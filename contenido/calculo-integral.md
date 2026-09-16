---
id: calculo-integral
codigo: MATE-1214
nombre: Cálculo Integral con Ecuaciones Diferenciales
libro: Stewart, Cálculo de una variable, 6.ª ed.
contexto: antes del parcial 2
activa: true
longitud: 12
---

Curso completo de Cálculo Integral con Ecuaciones Diferenciales basado en el programa 2024-1.
Incluye técnicas de integración, aplicaciones, series y ecuaciones diferenciales.
Preguntas calibradas con errores conceptuales específicos del material de clase.

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

## ecuaciones-diferenciales · Ecuaciones diferenciales de primer orden

### P5 · dificultad 2
Una ecuación diferencial de variables separables tiene la forma dy/dx = f(x)·g(y). ¿Cuál es el primer paso para resolverla?

- A) Separar variables y escribir (1/g(y))dy = f(x)dx · CORRECTA
- B) Integrar ambos lados directamente sin separar · no separas las variables antes de integrar
- C) Derivar ambos lados para simplificar · confundes resolver con derivar
- D) Sustituir y = 0 para encontrar la constante · intentas encontrar la constante antes de integrar

### P6 · dificultad 3
Para la ecuación diferencial dy/dx + P(x)y = Q(x), el factor integrante es:

- A) e^(∫P(x)dx) · CORRECTA
- B) e^(∫Q(x)dx) · confundes P(x) con Q(x) en la fórmula del factor integrante
- C) ∫P(x)dx · olvidas aplicar la exponencial al integrar P(x)
- D) P(x)·e^x · mezclas la fórmula con la solución de homogéneas

### P7 · dificultad 2
Si dy/dx = ky donde k es constante, la solución general es:

- A) y = Ce^(kx) · CORRECTA
- B) y = C + kx · resuelves como si fuera integración directa sin reconocer la exponencial
- C) y = kx² + C · integras k dos veces ignorando que y está en la ecuación
- D) y = e^x + k · olvidas la constante k en el exponente

## series · Series y convergencia

### P8 · dificultad 2
Para determinar si una serie ∑(1/n²) converge, ¿qué criterio es más directo?

- A) Criterio de la integral o criterio p con p = 2 · CORRECTA
- B) Criterio del cociente · usas un criterio más complejo cuando el criterio p es suficiente
- C) Criterio de la raíz · aplicas un criterio que no es el más eficiente para esta forma
- D) Comparación con 1/n · comparas con una serie divergente en vez de convergente

### P9 · dificultad 3
Una serie de potencias ∑aₙ(x-c)ⁿ tiene radio de convergencia R = 4. ¿Qué puedes afirmar?

- A) Converge absolutamente para |x-c| < 4 · CORRECTA
- B) Converge para todo x en (0, 4) · interpretas R como intervalo absoluto sin considerar el centro c
- C) Diverge para x = c + 4 siempre · asumes divergencia en los extremos sin verificar
- D) R = 4 significa que converge solo en 4 puntos · confundes radio con número de puntos

### P10 · dificultad 2
Para encontrar la serie de Taylor de f(x) = e^x centrada en x = 0, necesitas:

- A) Calcular f⁽ⁿ⁾(0) para todo n y usar ∑(f⁽ⁿ⁾(0)/n!)xⁿ · CORRECTA
- B) Integrar e^x repetidamente · confundes derivadas con integrales en la construcción de la serie
- C) Usar la serie de ln(x) · confundes e^x con su función inversa
- D) Solo calcular f'(0) y f''(0) · crees que la serie termina después de dos términos

## aplicaciones-integral · Aplicaciones de la integral

### P11 · dificultad 2
El volumen de un sólido de revolución al rotar y = f(x) alrededor del eje x entre a y b es:

- A) π∫[f(x)]²dx de a a b · CORRECTA
- B) π∫f(x)dx de a a b · olvidas elevar al cuadrado el radio
- C) ∫[f(x)]²dx de a a b · omites el π en la fórmula del volumen
- D) 2π∫xf(x)dx de a a b · confundes método de discos con método de cascarones

### P12 · dificultad 3
Para calcular la longitud de arco de y = f(x) de a a b, usas:

- A) ∫√(1 + [f'(x)]²)dx de a a b · CORRECTA
- B) ∫f'(x)dx de a a b · crees que la longitud es solo la integral de la derivada
- C) ∫√([f(x)]²)dx de a a b · confundes la fórmula usando f(x) en lugar de f'(x)
- D) [f(b) - f(a)] · usas la distancia vertical en lugar de la longitud de curva
