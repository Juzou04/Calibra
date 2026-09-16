---
id: probabilidad-estadistica
codigo: IIND-2106
nombre: Probabilidad y Estadística
libro: Walpole, Myers, Myers y Ye. Probabilidad y Estadística para Ingeniería y Ciencias, 9.ª ed.
contexto: antes del parcial 1
activa: true
longitud: 12
---

Subtemas tomados de las sesiones del programa oficial del curso 2025-I.
Preguntas calibradas con errores conceptuales comunes identificados en las sesiones y complementarias.

## conteo · Técnicas de conteo

Sesión 2 del programa. Walpole pp. 35-62.
Errores que vale la pena cazar: confundir permutación con combinación, contar con repetición cuando no la hay, y multiplicar en vez de contar subconjuntos.

### P1 · dificultad 2
De un grupo de 10 monitores hay que escoger 3 para un comité. ¿De cuántas formas distintas se puede armar el comité?

- A) 120 · CORRECTA
- B) 720 · usas permutación y cuentas como si el orden de los tres importara
- C) 1000 · cuentas con repetición, como si un mismo monitor pudiera ocupar dos puestos
- D) 30 · multiplicas 10 por 3 en vez de contar cuántos subconjuntos de 3 hay

## condicional · Probabilidad condicional y Bayes

Sesión 3 del programa. Walpole pp. 63-81.
Errores que vale la pena cazar: invertir el condicionamiento, asumir independencia, y olvidar que condicionar reduce el espacio muestral.

### P2 · dificultad 2
En un curso, el 60% de los estudiantes presentó el parcial 1, y de los que lo presentaron, el 40% aprobó. Si eliges un estudiante al azar del curso completo, ¿cuál es la probabilidad de que haya presentado y aprobado?

- A) 0,24 · CORRECTA
- B) 0,40 · tomas la probabilidad condicional como si ya fuera la conjunta, e ignoras que solo el 60% presentó
- C) 1,00 · sumas las dos probabilidades cuando la regla del producto pide multiplicarlas
- D) 0,67 · divides una entre otra, que es lo que se hace para despejar una condicional, no para calcular una conjunta

### P3 · dificultad 3
En un experimento con dos eventos A y B, se sabe que P(A) = 0,6, P(B) = 0,5 y P(A∪B) = 0,8. ¿Son A y B independientes?

- A) No son independientes porque P(A∩B) = 0,3 y P(A)·P(B) = 0,3 pero P(A|B) ≠ P(A) · CORRECTA
- B) Sí son independientes porque P(A∪B) < 1 · confundes independencia con exclusión mutua
- C) No se puede determinar con la información dada · no reconoces que puedes calcular P(A∩B) usando P(A∪B)
- D) Sí son independientes porque P(A)·P(B) = 0,3 · calculas el producto pero no verificas la definición completa

## discretas · Variables aleatorias discretas

Sesión 4 y 6 del programa. Walpole pp. 81-87, 111-135, 143-170.
Errores que vale la pena cazar: confundir la función de probabilidad con la acumulada, usar la media donde se pide la varianza, y aplicar binomial a ensayos que no son independientes ni de probabilidad constante.

### P4 · dificultad 2
Una variable aleatoria X sigue distribución binomial con n = 10 y p = 0,3. ¿Cuál es E(X)?

- A) 3 · CORRECTA
- B) 2,1 · calculas la varianza np(1-p) en vez de la media
- C) 0,3 · confundes la media con el parámetro p
- D) 10 · usas n sin multiplicar por p

### P5 · dificultad 3
Si P(X = k) = 0,2 para k = 1,2,3,4,5, ¿cuál es P(X ≤ 3)?

- A) 0,6 · CORRECTA
- B) 0,2 · confundes la función acumulada con la función de probabilidad
- C) 1,0 · sumas todas las probabilidades ignorando la condición
- D) 0,4 · calculas P(X > 3) en lugar de P(X ≤ 3)

### P6 · dificultad 2
La varianza de una variable aleatoria discreta X se calcula como:

- A) E[(X - μ)²] o E(X²) - [E(X)]² · CORRECTA
- B) E(X) - μ · confundes varianza con desviación de la media
- C) E(X²) · olvidas restar el cuadrado de la media
- D) [E(X)]² · elevas la media al cuadrado sin calcular E(X²)

## continuas · Variables aleatorias continuas

Sesión 5 y 7 del programa. Walpole pp. 87-94, 171-211.
Errores que vale la pena cazar: leer la densidad como si fuera una probabilidad, olvidar estandarizar antes de usar la tabla normal, y calcular P(X = a) distinto de cero en una continua.

### P7 · dificultad 2
Para una variable continua X, ¿qué es cierto sobre P(X = a) donde a es una constante?

- A) P(X = a) = 0 siempre · CORRECTA
- B) P(X = a) = f(a) donde f es la densidad · confundes densidad con probabilidad
- C) P(X = a) = 1/n donde n es el rango · tratas la continua como discreta uniforme
- D) Depende del valor de a · no reconoces que en continuas un punto tiene probabilidad cero

### P8 · dificultad 3
Si X ~ N(100, 25), para calcular P(X < 110) usando la tabla estándar Z ~ N(0,1):

- A) Calculas Z = (110-100)/5 = 2 y buscas P(Z < 2) · CORRECTA
- B) Buscas directamente P(X < 110) en la tabla · olvidas estandarizar
- C) Calculas Z = (110-100)/25 = 0,4 · confundes la desviación estándar con la varianza
- D) Restas 110 - 100 = 10 y ese es el resultado · confundes diferencia con probabilidad

### P9 · dificultad 2
Una función f(x) puede ser densidad de probabilidad solo si:

- A) f(x) ≥ 0 para todo x y ∫f(x)dx = 1 en su dominio · CORRECTA
- B) f(x) ≤ 1 para todo x · confundes densidad con probabilidad acumulada
- C) f(x) = 1/n donde n es el número de valores · tratas continua como discreta
- D) Solo si f(x) es simétrica · agregas una condición innecesaria

## inferencia · Inferencia estadística básica

Sesiones 8-10 del programa. Errores comunes: confundir intervalo de confianza con probabilidad del parámetro, mal uso de estadísticos de prueba, y errores en interpretación de p-valor.

### P10 · dificultad 2
Un intervalo de confianza del 95% para la media μ significa que:

- A) Si repitieras el muestreo muchas veces, 95% de los intervalos contendrían μ · CORRECTA
- B) Hay 95% de probabilidad de que μ esté en este intervalo específico · interpretas el IC como probabilidad del parámetro
- C) El 95% de los datos están en el intervalo · confundes IC con rango de datos
- D) La media muestral tiene 95% de confianza · confundes parámetro con estadístico

### P11 · dificultad 3
En una prueba de hipótesis, un p-valor de 0,03 con α = 0,05 indica que:

- A) Rechazas H₀ porque p-valor < α · CORRECTA
- B) Aceptas H₀ porque el p-valor es pequeño · confundes rechazo con aceptación
- C) Hay 3% de probabilidad de que H₀ sea cierta · interpretas mal el p-valor como probabilidad de la hipótesis
- D) El error tipo I es 3% · confundes p-valor con nivel de significancia

### P12 · dificultad 2
Para construir un intervalo de confianza para μ cuando σ es desconocida y n < 30:

- A) Usas la distribución t de Student · CORRECTA
- B) Usas la distribución normal Z de todas formas · ignoras la condición de muestra pequeña
- C) No se puede construir el intervalo · crees que es imposible sin σ conocida
- D) Usas la distribución chi-cuadrado · confundes el estadístico apropiado
