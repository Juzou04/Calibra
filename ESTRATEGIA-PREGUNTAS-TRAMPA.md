# Estrategia de Preguntas Trampa en Calibra

## Filosofía pedagógica

### El problema que resolvemos

Los exámenes tradicionales de opción múltiple tienen un problema fundamental: **cuando un estudiante falla, solo sabemos que no sabe la respuesta, pero no sabemos POR QUÉ falló**.

**Ejemplo clásico (inútil)**:
```
¿Cuánto es 2 + 2?
A) 3
B) 4 ✓
C) 5
D) 6
```

Si el estudiante elige C, solo sabemos que se equivocó. ¿Sumó mal? ¿Confundió operaciones? ¿Adivinó? No tenemos idea.

### Nuestra solución: Errores conceptuales específicos

Cada opción incorrecta **representa un error conceptual específico y documentado** que delata exactamente qué malentendido tiene el estudiante.

**Ejemplo Calibra**:
```
En ∫ x·ln(x) dx, ¿qué eliges como u?

A) x
   → Error: "eliges u por orden de aparición, no por prioridad ILATE"
   
B) ln(x) ✓
   
C) dx
   → Error: "confundes u con dv"
   
D) x · ln(x)
   → Error: "no separas el producto en u y dv"
```

Si el estudiante elige A, ahora **sabemos exactamente qué enseñarle**: la regla ILATE (Inversa, Logarítmica, Algebraica, Trigonométrica, Exponencial) para elegir u en integración por partes.

---

## Metodología de construcción

### 1. Identificar el concepto clave

Cada pregunta evalúa **UN concepto fundamental** del subtema, no múltiples conceptos a la vez.

❌ **Pregunta mal diseñada**: "Calcula ∫₀^∞ x²e^(-x) dx"
- Mezcla límites impropios, integración por partes Y evaluación numérica

✅ **Pregunta bien diseñada**: "∫ desde 1 hasta ∞ de (1/x²) dx:"
- Solo evalúa: ¿reconoces convergencia/divergencia de impropias?

### 2. Documentar los 3-4 errores más comunes

Las opciones incorrectas **NO son números aleatorios**. Cada una debe corresponder a un error real que cometen los estudiantes.

**Fuentes para identificar errores:**

1. **Monitores y profesores** (la mejor fuente)
   - "¿Cuáles son los 3 errores que más ves en este tema?"
   - Evidencia directa de malentendidos reales

2. **Parciales con solución**
   - Los errores comunes aparecen en las soluciones paso a paso
   - "Si haces X en lugar de Y, llegas a respuesta Z"

3. **Experiencia propia**
   - Los errores que tú cometiste cuando aprendiste el tema
   - Válido, pero menos representativo que preguntar a monitores

### 3. Escribir el error en segunda persona

El texto del error debe:
- Describir **qué pensó el estudiante**, no qué le faltó
- Ser **accionable**: se debe convertir directamente en un plan de sesión
- Evitar jerga técnica innecesaria

❌ **Mal**: "No sabe la regla de la cadena"
- Demasiado vago para ser útil

✅ **Bien**: "Ignoras que 2x es la derivada de x² al elegir la sustitución"
- Específico, accionable, se convierte en: "Explícale cómo identificar du en la sustitución"

---

## Taxonomía de errores conceptuales

### Tipo 1: Confusión de conceptos similares

**Patrón**: El estudiante aplica un concepto correcto, pero en el contexto equivocado.

**Ejemplos**:
- Usa **permutación cuando debería usar combinación** (el orden no importa)
- Usa **fórmula de paralelo cuando es serie** en circuitos
- Confunde **densidad con probabilidad** en variables continuas

**Diseño de la pregunta**:
- La opción incorrecta sale de aplicar el concepto confundido correctamente
- El enunciado debe hacer que ambos conceptos sean tentadores

### Tipo 2: Aplicación incompleta de procedimiento

**Patrón**: El estudiante conoce parte del procedimiento pero omite un paso crucial.

**Ejemplos**:
- Calcula E(X²) pero **olvida restar [E(X)]²** en la varianza
- Suma resistencias en paralelo sin **invertir el resultado**
- Estandariza en normal pero **olvida dividir por σ**, solo resta μ

**Diseño de la pregunta**:
- La opción incorrecta sale de ejecutar el procedimiento hasta el paso omitido
- El número debe ser "razonable" para que sea tentador

### Tipo 3: Inversión de relación

**Patrón**: El estudiante conoce las variables involucradas pero invierte su relación.

**Ejemplos**:
- **V = E/d** en lugar de V = Ed
- **U = qV** escrito como V = qU
- **P(A|B)** confundido con P(B|A) en Bayes

**Diseño de la pregunta**:
- La opción correcta e incorrecta deben ser algebraicamente simétricas
- Ambas deben ser dimensionalmente coherentes para ser tentadoras

### Tipo 4: Sobregeneralización de caso especial

**Patrón**: El estudiante aplica una regla que funciona en casos especiales a todos los casos.

**Ejemplos**:
- Piensa que **toda integral impropia diverge**
- Asume que **la normal siempre se anula al restar** sin verificar
- Cree que **P(X = a) ≠ 0 en continuas** porque funciona en discretas

**Diseño de la pregunta**:
- El enunciado debe ser un caso donde la regla especial NO aplica
- La opción correcta debe romper la intuición del caso especial

### Tipo 5: Malinterpretación de simbolismo

**Patrón**: El estudiante confunde la notación matemática con su significado.

**Ejemplos**:
- Lee **f(x) en una densidad como probabilidad** en lugar de derivada de F(x)
- Confunde **u en ∫u dv** con la variable de integración u en sustitución
- Piensa que **IC del 95% significa P(μ ∈ IC) = 0.95**

**Diseño de la pregunta**:
- El enunciado debe usar la notación ambigua explícitamente
- Las opciones deben contrastar la interpretación correcta vs incorrecta

---

## Criterios de calidad

### Una buena pregunta trampa debe:

1. ✅ **Evaluar UN concepto específico**
   - No mezclar múltiples temas en una pregunta

2. ✅ **Tener 3-4 errores conceptuales documentados**
   - Cada opción incorrecta delata un malentendido específico
   - NO son números aleatorios ni distractores genéricos

3. ✅ **Ser independiente del contexto**
   - No requiere recordar una fórmula específica de una clase
   - Evalúa comprensión, no memorización

4. ✅ **Tener opciones tentadoras**
   - Todas las opciones deben parecer razonables a primera vista
   - El estudiante que no domina el tema debe dudar

5. ✅ **Generar un plan de sesión accionable**
   - El texto del error debe convertirse directamente en:
     - "Explícale X"
     - "Practica Y"
     - "Arranca con el ejercicio Z"

---

## Proceso de validación

### Antes de agregar una pregunta al banco:

1. **Validar con un monitor**: ¿Son estos los errores que ves?
2. **Probarla con un estudiante**: ¿Las opciones incorrectas son tentadoras?
3. **Verificar accionabilidad**: ¿El error se convierte en un plan de 60 min?

### Señales de alerta (revisar la pregunta):

❌ **Todos eligen la misma opción incorrecta**
- Probablemente el enunciado es ambiguo o la opción correcta está mal

❌ **Nadie elige ciertas opciones incorrectas**
- Esas opciones no representan errores reales, son relleno

❌ **El monitor no sabe qué hacer con el error detectado**
- El texto del error no es suficientemente específico

❌ **La pregunta requiere cálculos largos**
- Evalúa destreza aritmética, no comprensión conceptual

---

## Cobertura por materia

### Cálculo Integral (12 preguntas, 6 subtemas)

| Subtema | Preguntas | Errores principales |
|---------|-----------|---------------------|
| Integración por partes | 2 | ILATE, signos en fórmula, separación de u y dv |
| Sustitución | 1 | Reconocer du, métodos incorrectos, regla de la cadena |
| Impropias | 1 | Divergencia vs convergencia, evaluación de límites |
| Ec. diferenciales | 3 | Separación de variables, factor integrante, soluciones exponenciales |
| Series | 3 | Criterios de convergencia, radio, series de Taylor |
| Aplicaciones | 2 | Volumen de revolución, longitud de arco |

### Física II (12 preguntas, 4 subtemas)

| Subtema | Preguntas | Errores principales |
|---------|-----------|---------------------|
| Electrostática | 3 | Fuerza vs campo, ley del inverso cuadrado, superposición |
| Potencial | 3 | U vs V, trabajo eléctrico, diferencia de potencial |
| Circuitos | 3 | Serie vs paralelo, leyes de Kirchhoff, potencia |
| Magnetismo | 3 | Producto cruz, regla mano derecha, fuerza sobre corrientes |

### Probabilidad (12 preguntas, 5 subtemas)

| Subtema | Preguntas | Errores principales |
|---------|-----------|---------------------|
| Conteo | 1 | Permutación vs combinación, repetición, multiplicación vs subconjuntos |
| Condicional | 2 | Inversión de condicionamiento, independencia, espacio muestral reducido |
| Discretas | 3 | f vs F acumulada, media vs varianza, binomial mal aplicada |
| Continuas | 3 | Densidad como probabilidad, estandarización, P(X=a) en continuas |
| Inferencia | 3 | Interpretación de IC, p-valor, distribución t |

---

## Ejemplos detallados por tipo de error

### Ejemplo 1: Confusión de conceptos (Tipo 1)

**Pregunta**: De un grupo de 10 monitores hay que escoger 3 para un comité. ¿De cuántas formas distintas se puede armar el comité?

**Opciones**:
- A) 120 ✓ (C(10,3) = 10!/(3!·7!))
- B) 720 → **Error**: "usas permutación y cuentas como si el orden de los tres importara"
- C) 1000 → **Error**: "cuentas con repetición, como si un mismo monitor pudiera ocupar dos puestos"
- D) 30 → **Error**: "multiplicas 10 por 3 en vez de contar cuántos subconjuntos de 3 hay"

**Por qué funciona**:
- Opción B sale de calcular P(10,3) = 10!/(7!) = 720 correctamente... pero para el problema equivocado
- Opción C sale de 10³ = 1000, aplicando repetición (que NO corresponde)
- Opción D sale de 10×3 = 30, multiplicando en lugar de contar subconjuntos
- Cada error es **un malentendido conceptual específico**, no un número aleatorio

**Plan de sesión que genera**:
- Si eligió B: "Explícale cuándo importa el orden (permutación) vs cuando no (combinación)"
- Si eligió C: "Practica problemas con y sin repetición hasta que distinga"
- Si eligió D: "Ejercicio: calcular C(5,2) desde el principio para ver por qué no es 5×2"

### Ejemplo 2: Aplicación incompleta (Tipo 2)

**Pregunta**: La varianza de una variable aleatoria discreta X se calcula como:

**Opciones**:
- A) E[(X - μ)²] o E(X²) - [E(X)]² ✓
- B) E(X) - μ → **Error**: "confundes varianza con desviación de la media"
- C) E(X²) → **Error**: "olvidas restar el cuadrado de la media"
- D) [E(X)]² → **Error**: "elevas la media al cuadrado sin calcular E(X²)"

**Por qué funciona**:
- Opción C sale de ejecutar el procedimiento hasta el primer paso (calcular E(X²)) y olvidar el resto
- Es **tentadora** porque parece "suficientemente complejo" para ser la respuesta
- El estudiante que sabe que "hay que elevar algo al cuadrado" pero no recuerda qué, elegirá C
- El error es **accionable**: "Practica 3 ejemplos calculando varianza paso a paso hasta que automatices la fórmula"

### Ejemplo 3: Inversión de relación (Tipo 3)

**Pregunta**: La diferencia de potencial entre dos puntos en un campo eléctrico uniforme E separados una distancia d es:

**Opciones**:
- A) V = Ed ✓
- B) V = E/d → **Error**: "inviertes la relación"
- C) V = Ed² → **Error**: "agregas una potencia incorrecta"
- D) V = E independiente de d → **Error**: "ignoras la distancia"

**Por qué funciona**:
- Opción B es **tentadora** porque "divide" suena razonable si no estás seguro
- Ambas opciones (A y B) son dimensionalmente coherentes (voltios = E·m o E/m)
- El estudiante que duda entre multiplicar o dividir elegirá B
- El error es **accionable**: "Deduce la fórmula desde W = qEd y V = W/q para que veas por qué es producto"

---

## Iteración y mejora continua

### Ciclo de refinamiento:

1. **Diseñar pregunta inicial** con 4 opciones basadas en errores intuidos
2. **Validar con monitores**: ¿Son estos los errores que ven?
3. **Probar con 5-10 estudiantes** de diferentes niveles
4. **Analizar resultados**:
   - Si una opción nunca se elige → reemplazar por error más común
   - Si todos eligen la misma incorrecta → enunciado ambiguo, reescribir
   - Si la pregunta es muy fácil/difícil → ajustar dificultad
5. **Refinar texto de error** basado en retroalimentación de monitores
6. **Iterar** hasta que la pregunta sea confiable

### Métricas de calidad (por implementar):

- **Distribución de respuestas**: Cada opción incorrecta debería ser elegida por al menos 5% de estudiantes
- **Correlación con desempeño**: Estudiantes que fallan esta pregunta deberían tener dificultades en ejercicios del mismo subtema
- **Accionabilidad**: Monitores deberían poder generar un plan de 60 min a partir del error detectado

---

## Recursos adicionales

### Para crear preguntas nuevas:

1. **Catálogo de errores comunes** (a construir)
   - Documento colaborativo con errores por materia
   - Aportado por monitores y profesores

2. **Banco de parciales con solución**
   - El Pentágono de Uniandes (público)
   - Parciales de semestres anteriores con solución detallada

3. **Literatura pedagógica**
   - "Common Student Errors in Calculus" - investigación educativa
   - Foros de monitores (StackExchange, Reddit r/learnmath)

### Para validar preguntas existentes:

1. **Análisis de datos** (cuando tengamos usuarios reales)
   - Distribución de respuestas por pregunta
   - Correlación entre diagnóstico y desempeño posterior

2. **Entrevistas con monitores**
   - "¿El brief que recibiste fue útil?"
   - "¿Qué agregarías al plan de sesión?"

3. **A/B testing de preguntas**
   - Dos versiones de la misma pregunta con errores ligeramente distintos
   - Ver cuál genera diagnósticos más accionables

---

**Conclusión**: Las preguntas trampa son el corazón diferenciador de Calibra. No basta con tener un directorio de monitores - eso ya existe (Calico). Lo que nos distingue es **saber exactamente qué explicarle al estudiante antes de que empiece la sesión**.

Cada pregunta debe ser tratada como un **instrumento de diagnóstico médico**: no solo detecta que hay un problema, sino que identifica específicamente cuál es el problema y cómo tratarlo.
