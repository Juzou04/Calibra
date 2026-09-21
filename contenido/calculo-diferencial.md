---
id: calculo-diferencial
codigo: MATE-1203
nombre: Cálculo Diferencial
contexto: antes del parcial 1
activa: true
longitud: 12
---

ATENCIÓN: no hay ni un solo archivo de esta materia en el disco. Ni programa, ni parciales, ni talleres. Los subtemas de abajo son los estándar de un curso de cálculo diferencial y HAY QUE CONFIRMARLOS con el programa real antes de usarlos. Es la materia que el equipo tiene que salir a buscar.

Faltan las 12 preguntas.

## limites · Límites y continuidad

Errores a cazar: aplicar L Hôpital sin indeterminación, y confundir que el límite exista con que la función esté definida.

### P1 · dificultad 2
Calcula el límite: $\lim_{x\to 2} \frac{x^2 - 4}{x - 2}$

- A) 4 · CORRECTA
- B) 0 · aplicas L'Hôpital sin verificar que hay una forma indeterminada 0/0
- C) No existe · confundes que la función no esté definida en x=2 con que el límite no exista
- D) 2 · sustituyes directamente sin reconocer la indeterminación

### P2 · dificultad 2
Sea $f(x) = \frac{x^2 - 1}{x - 1}$ para x ≠ 1 y f(1) = 3. ¿La función es continua en x = 1?

- A) No, porque $\lim_{x\to 1} f(x) = 2 \ne f(1) = 3$ · CORRECTA
- B) Sí, porque el límite existe · confundes la existencia del límite con la continuidad de la función
- C) No, porque f(1) no está definida · no reconoces que f(1) = 3 está explícitamente definida
- D) Sí, porque se puede aplicar L'Hôpital · aplicas reglas de derivación sin verificar las condiciones de continuidad

### P3 · dificultad 2
Evalúa $\lim_{x\to 0} \frac{\sen(x)}{x}$

- A) 1 · CORRECTA
- B) 0 · aplicas límite directo sin reconocer que es un límite notable
- C) ∞ · confundes la forma 0/0 con una división por cero que tiende a infinito
- D) Aplico L'Hôpital: cos(0)/1 = 1, pero justificas mal · aplicas L'Hôpital sin mencionar primero que hay indeterminación 0/0

## derivada · La derivada y sus reglas

Errores a cazar: olvidar la regla de la cadena, y confundir la derivada con la pendiente de la secante.

### P4 · dificultad 2
Deriva: f(x) = (3x² + 1)⁵

- A) f'(x) = 5(3x² + 1)⁴ · 6x = 30x(3x² + 1)⁴ · CORRECTA
- B) f'(x) = 5(3x² + 1)⁴ · olvidas aplicar la regla de la cadena al término interior
- C) f'(x) = 15x²(3x² + 1)⁴ · derivas el exponente pero multiplicas mal el interior
- D) f'(x) = 5(6x)⁴ · confundes el orden de las operaciones al derivar

### P5 · dificultad 2
La derivada de una función en x = 2 es la pendiente de:

- A) La recta tangente en x = 2 · CORRECTA
- B) La recta secante entre x = 2 y x = 3 · confundes la derivada (tangente) con el cociente de diferencias (secante)
- C) La cuerda que une dos puntos cerca de x = 2 · describes la pendiente promedio, no la instantánea
- D) Cualquier recta que pase por f(2) · generalizas incorrectamente el concepto de pendiente en un punto

### P6 · dificultad 2
Deriva: g(x) = sen(x³)

- A) g'(x) = 3x² cos(x³) · CORRECTA
- B) g'(x) = cos(x³) · olvidas la regla de la cadena para x³
- C) g'(x) = 3x² sen(x³) · aplicas la regla de la potencia pero no cambias seno a coseno
- D) g'(x) = cos(3x²) · derivas el interior pero lo colocas en el argumento incorrecto

## aplicaciones · Aplicaciones de la derivada

Errores a cazar: confundir punto crítico con máximo, y olvidar revisar los extremos del intervalo.

### P7 · dificultad 2
f(x) = x³ - 3x tiene un punto crítico en x = 1. ¿Qué tipo de punto es?

- A) Mínimo local · CORRECTA
- B) Máximo local · confundes punto crítico con máximo sin verificar la segunda derivada o el criterio de la primera
- C) Punto de inflexión · no distingues entre donde f' = 0 y donde f'' = 0
- D) Máximo absoluto · asumes que todo punto crítico es un extremo absoluto sin analizar el comportamiento global

### P8 · dificultad 2
Encuentra el máximo de h(x) = -x² + 4x en [0, 5].

- A) En x = 2, h(2) = 4 · CORRECTA
- B) En x = 2, porque es punto crítico · identificas el punto crítico pero olvidas revisar los extremos x = 0 y x = 5
- C) En x = 5, h(5) = 5 · solo evalúas extremos sin buscar puntos críticos
- D) En x = 0, porque es el inicio del intervalo · asumes que el máximo está siempre en un extremo

### P9 · dificultad 2
Si f'(c) = 0 y f''(c) > 0, entonces x = c es:

- A) Mínimo local · CORRECTA
- B) Máximo local · inviertes el criterio de la segunda derivada
- C) Necesariamente el mínimo absoluto · confundes extremo local con absoluto sin considerar el dominio completo
- D) Un punto donde f es creciente · confundes f'(c) = 0 con que f sea creciente en c

## optimizacion · Optimización y razones de cambio

Errores a cazar: derivar antes de escribir la restricción, y no verificar que el resultado tenga sentido físico.

### P10 · dificultad 2
Quieres cercar un terreno rectangular con 100 m de cerca. ¿Qué dimensiones maximizan el área?

- A) 25 m × 25 m (cuadrado) · CORRECTA
- B) 50 m × 50 m · derivas A = x·y sin usar primero la restricción 2x + 2y = 100
- C) 30 m × 20 m · propones dimensiones arbitrarias sin optimizar
- D) 100 m × 0 m · obtienes un resultado matemático que no tiene sentido físico como terreno

### P11 · dificultad 2
Un globo esférico se infla a razón de 10 cm³/s. ¿A qué velocidad crece el radio cuando r = 5 cm? ($V = \frac{4}{3}\pi r^3$)

- A) $\frac{dr}{dt} = \frac{10}{4\pi\cdot 25} = \frac{1}{10\pi}$ cm/s · CORRECTA
- B) $\frac{dr}{dt} = \frac{10}{r^2}$ · derivas el volumen pero olvidas aplicar correctamente la regla de la cadena con respecto al tiempo
- C) $\frac{dr}{dt} = 10$ cm/s · confundes la tasa de cambio del volumen con la del radio
- D) $\frac{dr}{dt} = 2$ cm/s · calculas un valor que no verificas si tiene sentido físico para la situación

### P12 · dificultad 2
Una escalera de 10 m resbala por una pared. Si el extremo inferior se aleja a 2 m/s, ¿a qué velocidad baja el extremo superior cuando está a 6 m del suelo?

- A) $\frac{dy}{dt} = -\frac{3}{2}$ m/s · CORRECTA
- B) $\frac{dy}{dt} = -2$ m/s · asumes que ambos extremos se mueven a la misma velocidad
- C) $\frac{dy}{dt} = 2$ m/s · calculas la magnitud pero olvidas que el extremo superior baja (signo negativo)
- D) $\frac{dy}{dt} = -\frac{8}{3}$ m/s · derivas la ecuación x² + y² = 100 antes de sustituir correctamente x = 8 cuando y = 6
