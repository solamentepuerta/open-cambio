<?php

/**
 * Scraper BCV + USDT/VES para Open Cambio.
 *
 * Descarga las tasas oficiales de https://www.bcv.org.ve/ y la referencia
 * USDT/VES de https://www.usdt.com.ve/. Publica latest.json y un historial
 * diario en daily-rates.json, ambos con escritura atómica.
 *
 * Requisitos: PHP 8.1+ con las extensiones curl, dom y libxml.
 * Licencia: MIT. Puedes reutilizarlo, modificarlo y compartirlo.
 *
 * Nota TLS: si curl falla con "unable to get local issuer certificate",
 * agrega el intermedio Sectigo Public Server Authentication CA OV R36 a
 * certs/cacert.pem. No desactives CURLOPT_SSL_VERIFYPEER.
 */

declare(strict_types=1);

ini_set('serialize_precision', '-1');

const BCV_URL = 'https://www.bcv.org.ve/';
const USDT_URL = 'https://www.usdt.com.ve/';
const USER_AGENT = 'Vex-BCV-Research/0.1 (+local compatibility test)';
const HISTORY_RETENTION_DAYS = 400;

function writeJsonAtomically(string $path, array $value): void
{
    $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) {
        throw new RuntimeException('No se pudo serializar el JSON.');
    }

    $temporaryPath = $path . '.tmp';
    if (file_put_contents($temporaryPath, $json . PHP_EOL, LOCK_EX) === false) {
        throw new RuntimeException("No se pudo escribir {$temporaryPath}.");
    }
    if (!rename($temporaryPath, $path)) {
        @unlink($temporaryPath);
        throw new RuntimeException("No se pudo publicar {$path}.");
    }
}

function recordDailyRates(array $latest): void
{
    $historyFile = __DIR__ . DIRECTORY_SEPARATOR . 'daily-rates.json';
    $history = [];
    if (is_file($historyFile)) {
        $decoded = json_decode((string) file_get_contents($historyFile), true);
        if (is_array($decoded)) {
            $history = $decoded;
        }
    }

    $capturedAt = new DateTimeImmutable((string) $latest['capturedAt']);
    $caracas = $capturedAt->setTimezone(new DateTimeZone('America/Caracas'));
    $dayKey = $caracas->format('Y-m-d');
    $cutoffKey = $caracas->modify('-' . HISTORY_RETENTION_DAYS . ' days')->format('Y-m-d');
    $rates = $latest['rates'];

    $history[$dayKey] = [
        'usd' => (float) $rates['USD'],
        'eur' => (float) $rates['EUR'],
        'usdt' => (float) $rates['USDT'],
        'date' => $capturedAt->format(DateTimeInterface::ATOM),
    ];

    $history = array_filter(
        $history,
        static fn (mixed $entry, string $key): bool => preg_match('/^\d{4}-\d{2}-\d{2}$/', $key) === 1
            && $key >= $cutoffKey
            && is_array($entry),
        ARRAY_FILTER_USE_BOTH
    );
    ksort($history);
    writeJsonAtomically($historyFile, $history);
}

function normalizeText(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
}

function parseDecimal(string $value): ?float
{
    $normalized = preg_replace('/[^0-9,.]/', '', $value);
    if ($normalized === null || $normalized === '') {
        return null;
    }

    $normalized = str_replace('.', '', $normalized);
    $normalized = str_replace(',', '.', $normalized);
    $number = filter_var($normalized, FILTER_VALIDATE_FLOAT);

    return $number !== false && $number > 0 ? (float) $number : null;
}

function extractRate(DOMXPath $xpath, string $id): array
{
    $container = $xpath->query("//*[@id='{$id}']")->item(0);
    if (!$container instanceof DOMNode) {
        return ['value' => null, 'raw' => null, 'found' => false];
    }

    $strong = $xpath->query('.//strong', $container)->item(0);
    $raw = normalizeText($strong?->textContent ?? $container->textContent);

    return ['value' => parseDecimal($raw), 'raw' => $raw, 'found' => true];
}

function extractValueDate(DOMXPath $xpath): ?string
{
    $nodes = $xpath->query("//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚ', 'abcdefghijklmnopqrstuvwxyzáéíóú'), 'fecha valor')]");
    if ($nodes === false) {
        return null;
    }

    foreach ($nodes as $node) {
        $text = normalizeText($node->textContent);
        if (preg_match('/Fecha\s+Valor\s*:\s*((?:Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo),?\s+\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóú]+\s+\d{4})/iu', $text, $matches)) {
            return normalizeText($matches[1]);
        }
    }

    return null;
}

function findExchangeRate(mixed $value): ?float
{
    if (!is_array($value)) {
        return null;
    }

    if (isset($value['currentExchangeRate']['price'])) {
        $price = filter_var($value['currentExchangeRate']['price'], FILTER_VALIDATE_FLOAT);
        if ($price !== false && $price > 0) {
            return (float) $price;
        }
    }

    foreach ($value as $child) {
        $rate = findExchangeRate($child);
        if ($rate !== null) {
            return $rate;
        }
    }

    return null;
}

function extractUsdtRate(string $html): ?float
{
    $document = new DOMDocument();
    if (!$document->loadHTML($html, LIBXML_NOWARNING | LIBXML_NOERROR)) {
        return null;
    }

    $xpath = new DOMXPath($document);
    $scripts = $xpath->query("//script[@type='application/ld+json']");
    if ($scripts !== false) {
        foreach ($scripts as $script) {
            $data = json_decode($script->textContent, true);
            $rate = findExchangeRate($data);
            if ($rate !== null) {
                return $rate;
            }
        }
    }

    if (preg_match('/Precio\s+USDT\s+en\s+Venezuela\s*:\s*([0-9.,]+)/iu', $html, $matches)) {
        return parseDecimal($matches[1]);
    }

    return null;
}

$outputDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'output';
if (!is_dir($outputDirectory) && !mkdir($outputDirectory, 0775, true) && !is_dir($outputDirectory)) {
    fwrite(STDERR, "No se pudo crear output/.\n");
    exit(1);
}

$headers = [];
$curl = curl_init(BCV_URL);
$curlOptions = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_USERAGENT => USER_AGENT,
    CURLOPT_ENCODING => '',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTPHEADER => [
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: es-VE,es;q=0.9',
        'Cache-Control: no-cache',
    ],
    CURLOPT_HEADERFUNCTION => static function ($handle, string $line) use (&$headers): int {
        $length = strlen($line);
        $parts = explode(':', $line, 2);
        if (count($parts) === 2) {
            $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
        }
        return $length;
    },
];
$localCaBundle = __DIR__ . DIRECTORY_SEPARATOR . 'certs' . DIRECTORY_SEPARATOR . 'cacert.pem';
if (is_file($localCaBundle)) {
    $curlOptions[CURLOPT_CAINFO] = $localCaBundle;
}
curl_setopt_array($curl, $curlOptions);

$startedAt = microtime(true);
$html = curl_exec($curl);
$elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
$effectiveUrl = curl_getinfo($curl, CURLINFO_EFFECTIVE_URL);
$curlError = curl_error($curl);
curl_close($curl);

if (!is_string($html) || $html === '') {
    fwrite(STDERR, "Descarga fallida: {$curlError}\n");
    exit(1);
}

file_put_contents($outputDirectory . DIRECTORY_SEPARATOR . 'bcv-home.html', $html);

libxml_use_internal_errors(true);
$document = new DOMDocument();
$loaded = $document->loadHTML($html, LIBXML_NOWARNING | LIBXML_NOERROR);
$parseErrors = array_map(
    static fn (LibXMLError $error): string => trim($error->message),
    libxml_get_errors()
);
libxml_clear_errors();

if (!$loaded) {
    fwrite(STDERR, "PHP recibió HTML, pero DOMDocument no pudo analizarlo.\n");
    exit(1);
}

$xpath = new DOMXPath($document);
$result = [
    'ok' => $status >= 200 && $status < 300,
    'request' => [
        'url' => BCV_URL,
        'effectiveUrl' => $effectiveUrl,
        'status' => $status,
        'contentType' => $contentType,
        'elapsedMs' => $elapsedMs,
        'bytes' => strlen($html),
        'etag' => $headers['etag'] ?? null,
        'lastModified' => $headers['last-modified'] ?? null,
    ],
    'capturedAt' => (new DateTimeImmutable('now', new DateTimeZone('America/Caracas')))->format(DateTimeInterface::ATOM),
    'rates' => [
        'USD' => extractRate($xpath, 'dolar'),
        'EUR' => extractRate($xpath, 'euro'),
    ],
    'valueDate' => extractValueDate($xpath),
    'domWarnings' => array_slice(array_values(array_unique($parseErrors)), 0, 5),
];

$result['ok'] = $result['ok']
    && $result['rates']['USD']['value'] !== null
    && $result['rates']['EUR']['value'] !== null;

$previousLatest = [];
$latestFile = __DIR__ . DIRECTORY_SEPARATOR . 'latest.json';
if (is_file($latestFile)) {
    $decodedLatest = json_decode((string) file_get_contents($latestFile), true);
    if (is_array($decodedLatest)) {
        $previousLatest = $decodedLatest;
    }
}

$usdtCurl = curl_init(USDT_URL);
$usdtOptions = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_USERAGENT => USER_AGENT,
    CURLOPT_ENCODING => '',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTPHEADER => [
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: es-VE,es;q=0.9',
    ],
];
if (is_file($localCaBundle)) {
    $usdtOptions[CURLOPT_CAINFO] = $localCaBundle;
}
curl_setopt_array($usdtCurl, $usdtOptions);
$usdtStartedAt = microtime(true);
$usdtHtml = curl_exec($usdtCurl);
$usdtElapsedMs = (int) round((microtime(true) - $usdtStartedAt) * 1000);
$usdtStatus = curl_getinfo($usdtCurl, CURLINFO_RESPONSE_CODE);
$usdtError = curl_error($usdtCurl);
curl_close($usdtCurl);

$usdtRate = is_string($usdtHtml) && $usdtStatus >= 200 && $usdtStatus < 300
    ? extractUsdtRate($usdtHtml)
    : null;
$previousUsdt = isset($previousLatest['rates']['USDT'])
    ? filter_var($previousLatest['rates']['USDT'], FILTER_VALIDATE_FLOAT)
    : false;
$resolvedUsdt = $usdtRate ?? ($previousUsdt !== false ? (float) $previousUsdt : null);

$result['usdt'] = [
    'ok' => $usdtRate !== null,
    'url' => USDT_URL,
    'status' => $usdtStatus,
    'elapsedMs' => $usdtElapsedMs,
    'value' => $resolvedUsdt,
    'fresh' => $usdtRate !== null,
    'error' => $usdtRate === null ? ($usdtError ?: 'No se encontró una tasa válida') : null,
];

$json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
file_put_contents($outputDirectory . DIRECTORY_SEPARATOR . 'result.json', $json . PHP_EOL);

if ($result['ok']) {
    $latest = [
        'source' => 'vex-scraper',
        'capturedAt' => $result['capturedAt'],
        'effectiveDate' => $result['valueDate'],
        'sources' => [
            'USD' => 'bcv.org.ve',
            'EUR' => 'bcv.org.ve',
            'USDT' => $usdtRate !== null ? 'usdt.com.ve' : ($previousLatest['sources']['USDT'] ?? null),
        ],
        'rates' => [
            'USD' => $result['rates']['USD']['value'],
            'EUR' => $result['rates']['EUR']['value'],
            'USDT' => $resolvedUsdt,
        ],
        'usdtFresh' => $usdtRate !== null,
    ];
    writeJsonAtomically($latestFile, $latest);
    recordDailyRates($latest);
}

echo $json . PHP_EOL;

exit($result['ok'] ? 0 : 2);
