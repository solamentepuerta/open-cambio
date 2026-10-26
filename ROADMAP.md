# Roadmap

## Rendimiento e infraestructura

- [ ] **Optimizar el intervalo de ISR de la portada**
  - Revisar primero el consumo real de funciones, lecturas y escrituras ISR en Vercel.
  - Evaluar aumentar `revalidate` de 5 a 30–60 minutos si las métricas lo justifican.
  - Mantener la invalidación inmediata de la caché cuando el botón manual o el cron actualicen las tasas.
  - Confirmar después del cambio el TTFB, la proporción de respuestas `HIT` y que las tasas nuevas aparezcan sin retraso.

