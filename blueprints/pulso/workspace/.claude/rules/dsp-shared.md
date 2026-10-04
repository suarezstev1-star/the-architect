---
description: Pure DSP, ghost line and scoring formulas in packages/shared
paths:
  - "packages/shared/src/**"
---

# Paquete compartido (puro, determinista)

- Sin I/O, sin `Date.now()` ni `Math.random()` en la lógica: el reloj y la semilla se inyectan. Misma entrada, misma salida.
- Sin dependencias de Node (`Buffer`, `fs`) ni del DOM: el paquete corre en navegador, servidor y pruebas.
- Un solo punto de entrada: `src/index.ts` reexporta los módulos públicos (excepción documentada a "sin barriles": es la API del paquete).
- Las fórmulas del producto son constantes con nombre y se prueban con vectores calculados a mano:
  dicción = 100 × (0.55 × confianza + 0.25 × ritmo + 0.20 × pausas);
  nivel = 0.30 × dicción + 0.25 × (100 − muletillas normalizadas) + 0.20 × control de frecuencia + 0.15 × vocabulario activo + 0.10 × constancia;
  seguimiento = % del tiempo dentro de la banda; banda = `max(0.75, 0.15 × rango del fantasma)` semitonos; tolerancia temporal fija ±3 muestras (sin DTW).
- Tono en semitonos relativos a la mediana del usuario (`12 × log2(hz / referencia)`).
- Constantes de audio: 16 000 Hz, tramas de 100 ms (1600 muestras), ventana de 8 s, 10 datos por segundo, tope de sesión 270 s.
- Las pruebas generan señales con `dsp/synth.ts` (PRNG sembrado); nunca archivos de audio binarios en el repo.
