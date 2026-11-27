"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript",
    note: "Funciona en Node.js 18+, Deno, Bun y navegadores modernos.",
    code: `const res = await fetch("https://TU-DOMINIO/latest.json", {
  cache: "no-store",
});
if (!res.ok) throw new Error("HTTP " + res.status);

const { rates, capturedAt } = await res.json();
console.log(capturedAt, rates.USD, rates.EUR, rates.USDT);`,
  },
  {
    id: "python",
    label: "Python",
    note: "Requiere el paquete requests (pip install requests).",
    code: `import requests

res = requests.get("https://TU-DOMINIO/latest.json", timeout=10)
res.raise_for_status()
data = res.json()
rates = data["rates"]

print(data["capturedAt"], rates["USD"], rates["EUR"], rates.get("USDT"))`,
  },
  {
    id: "php",
    label: "PHP",
    note: "PHP 8.1+ con la extensión curl habilitada.",
    code: `<?php

$ch = curl_init("https://TU-DOMINIO/latest.json");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);

$body = curl_exec($ch);
curl_close($ch);

$data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
echo $data["capturedAt"], " ", $data["rates"]["USD"], PHP_EOL;`,
  },
  {
    id: "java",
    label: "Java",
    note: "Java 11+. El parseo del JSON usa Gson (com.google.code.gson:gson).",
    code: `// Dependencia: com.google.code.gson:gson
import com.google.gson.JsonParser;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

var client = HttpClient.newHttpClient();
var request = HttpRequest.newBuilder(
    URI.create("https://TU-DOMINIO/latest.json")
).GET().build();
var response = client.send(request, HttpResponse.BodyHandlers.ofString());

var rates = JsonParser.parseString(response.body())
    .getAsJsonObject()
    .getAsJsonObject("rates");

System.out.printf("USD %s - EUR %s - USDT %s%n",
    rates.get("USD"), rates.get("EUR"), rates.get("USDT"));`,
  },
  {
    id: "csharp",
    label: "C#",
    note: ".NET 6+ con System.Net.Http.Json incluido en el framework.",
    code: `using System.Net.Http.Json;
using System.Text.Json;

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
var data = await http.GetFromJsonAsync<JsonElement>(
    "https://TU-DOMINIO/latest.json"
);
var rates = data.GetProperty("rates");

Console.WriteLine(
    "USD " + rates.GetProperty("USD") +
    " - EUR " + rates.GetProperty("EUR") +
    " - USDT " + rates.GetProperty("USDT")
);`,
  },
] as const;

export default function ScraperLanguageTabs() {
  const [active, setActive] = useState<string>(LANGUAGES[0].id);
  const [copied, setCopied] = useState(false);
  const current = LANGUAGES.find((language) => language.id === active) ?? LANGUAGES[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2" role="tablist" aria-label="Lenguajes de programación">
        {LANGUAGES.map((language) => (
          <button
            key={language.id}
            type="button"
            role="tab"
            aria-selected={language.id === active}
            onClick={() => setActive(language.id)}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 ${
              language.id === active
                ? "bg-primary text-on-primary"
                : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground/80"
            }`}
          >
            {language.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={copy}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-foreground/70 transition-colors"
          aria-label="Copiar código"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <pre className="bg-background/70 rounded-xl p-3 pt-9 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
          <code>{current.code}</code>
        </pre>
      </div>

      <p className="mt-2 text-[11px] text-foreground/50 leading-relaxed">{current.note}</p>
    </div>
  );
}
