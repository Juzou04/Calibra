---
id: calculo-integral
codigo: MATE-1214
nombre: Cálculo Integral
libro: Stewart, Cálculo de una variable, 6.ª ed.
contexto: antes del parcial 2
activa: true
longitud: 4
---

Las cuatro preguntas vienen literales de la sección 8 del BRIEF.md y no se deben cambiar sin cambiar también el brief: son las que sostienen la tabla oráculo de 16 casos que usan las pruebas automáticas.

El curso real se llama Cálculo Integral con Ecuaciones Diferenciales. Los tres subtemas de abajo son técnicas de integración; el temario completo incluye además aplicaciones de la integral, coordenadas polares, sucesiones y series, y ecuaciones diferenciales básicas. Ahí hay espacio para crecer.

## partes · Integración por partes

### P1 · dificultad 2
En ∫ x·ln(x) dx, ¿qué eliges como u?

- A) x · eliges u por orden de aparición, no por prioridad ILATE
- B) ln(x) · CORRECTA
- C) dx · confundes u con dv
- D) x · ln(x) · no separas el producto en u y dv

### P4 · dificultad 2
En ∫ x·eˣ dx, con u = x y dv = eˣ dx, el resultado es:

- A) x·eˣ − eˣ + C · CORRECTA
- B) x·eˣ + eˣ + C · te equivocas en el signo de la fórmula de partes
- C) eˣ + C · omites el término u·v
- D) x²·eˣ/2 + C · integras como si fuera un producto de potencias

## sustitucion · Sustitución

### P2 · dificultad 2
En ∫ 2x·cos(x²) dx, ¿qué método aplicas?

- A) Integración por partes · no reconoces que 2x es la derivada de x²
- B) Sustitución con u = x² · CORRECTA
- C) Fracciones parciales · aplicas un método que no corresponde a esta forma
- D) Integral directa de tabla · ignoras la regla de la cadena

## impropias · Integrales impropias

### P3 · dificultad 3
∫ desde 1 hasta ∞ de (1/x²) dx:

- A) Converge a 1 · CORRECTA
- B) Diverge · la confundes con 1/x, que sí diverge
- C) Converge a 0 · evalúas mal el límite superior
- D) No se puede determinar · no reconoces una impropia convergente
