# Scraper BCV + USDT/VES

Recolector PHP que descarga las tasas oficiales del Banco Central de Venezuela y la referencia USDT/VES, y publica dos archivos JSON listos para consumir desde cualquier lenguaje.

- `latest.json` — última captura con USD, EUR y USDT.
- `daily-rates.json` — historial diario de hasta 400 días.

El código es el mismo que alimenta [Open Cambio](https://opencambio.puertale.com) y se publica bajo licencia MIT.

## Requisitos

- PHP 8.1 o superior con las extensiones `curl`, `dom` y `libxml`.
- Acceso a cron (VPS, cPanel, Plesk o similar).
- Permiso de escritura en la carpeta donde se publican los JSON.
- Salida a internet hacia `bcv.org.ve` y `usdt.com.ve`.

## Archivos del paquete

```
scraper-bcv/
├── scraper.php
├── .htaccess
├── README.md
└── certs/
    ├── cacert.pem
    └── sectigo-ov-r36.pem
```

## Instalación en un VPS

```bash
unzip scraper-bcv.zip
cd scraper-bcv
php scraper.php
```

Si la ejecución es correcta verás el JSON de diagnóstico y se crearán `latest.json` y `daily-rates.json` en la misma carpeta.

Cron recomendado (cada cuatro horas):

```cron
17 */4 * * * /usr/bin/php /var/www/scraper-bcv/scraper.php >> /var/www/scraper-bcv/scraper.log 2>&1
```

## Instalación en cPanel

1. Entra a **Administrador de archivos** y crea una carpeta, por ejemplo `bcv-scraper`.
2. Sube el contenido del ZIP.
3. Verifica que la carpeta tenga permisos de escritura para el usuario de PHP.
4. En **Trabajos cron**, agrega:

```cron
17 */4 * * * /usr/local/bin/php /home/USUARIO/bcv-scraper/scraper.php >> /home/USUARIO/bcv-scraper/scraper.log 2>&1
```

5. Abre `https://TU-DOMINIO/bcv-scraper/latest.json` para confirmar que se publica.

## Salidas

### latest.json

```json
{
  "source": "vex-scraper",
  "capturedAt": "2026-11-27T18:39:43-04:00",
  "effectiveDate": "Lunes, 30 Noviembre 2026",
  "sources": {
    "USD": "bcv.org.ve",
    "EUR": "bcv.org.ve",
    "USDT": "usdt.com.ve"
  },
  "rates": {
    "USD": 928.5454,
    "EUR": 1016.30222575,
    "USDT": 1092.94
  },
  "usdtFresh": true
}
```

### daily-rates.json

Objeto con claves `YYYY-MM-DD`. Cada entrada contiene `usd`, `eur`, `usdt` y `date`. Las fechas importadas desde el histórico del BCV pueden no incluir `usdt`.

## Certificado TLS del BCV

El BCV puede presentar su certificado sin enviar el intermedio de Sectigo. Los navegadores lo buscan solos, pero curl y PHP no. Si aparece:

```
SSL certificate problem: unable to get local issuer certificate
```

agrega el intermedio **Sectigo Public Server Authentication CA OV R36** al bundle `certs/cacert.pem`. El paquete ya lo incluye.

Verifica sin desactivar la validación TLS:

```bash
curl -sS -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' \
  --cacert certs/cacert.pem https://www.bcv.org.ve/
```

Debe responder `200 0`.

## Seguridad

No publiques `scraper.php`, la carpeta `certs/` ni los archivos de diagnóstico. Solo deben ser accesibles los JSON.

En Apache/cPanel el `.htaccess` incluido bloquea todo excepto `latest.json` y `daily-rates.json`.

En Nginx puedes usar:

```nginx
location ~ ^/(scraper\.php|certs/) {
    deny all;
}

location = /bcv-scraper/latest.json {
    add_header Cache-Control "no-store";
}
```

## Consumir desde otros lenguajes

Puedes leer los JSON desde JavaScript, Python, PHP, Java, C# o cualquier cliente HTTP. La documentación con ejemplos está en:

<https://opencambio.puertale.com/docs/scraper>

## Licencia

MIT. Puedes reutilizar, modificar y compartir el recolector. Se agradece mencionar el proyecto original, pero no es obligatorio.
