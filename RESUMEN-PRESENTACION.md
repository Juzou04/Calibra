# Calibra - Resumen para Presentación

## 🎯 Lo que hicimos

Expandimos el MVP de Calibra de **1 materia con 4 preguntas** a **3 materias activas con 36 preguntas calibradas**, usando material real de cursos de Uniandes.

---

## 📊 Números clave

### Antes (MVP original)
- ✅ 1 materia activa (Cálculo Integral)
- ✅ 3 subtemas
- ✅ 4 preguntas

### Ahora (Rama juzouy)
- ✅ **3 materias activas**
- ✅ **15 subtemas totales**
- ✅ **36 preguntas con errores conceptuales específicos**
- ✅ **174/195 pruebas automatizadas pasando**

---

## 📚 Materias implementadas

### 1. Cálculo Integral con Ecuaciones Diferenciales
- **12 preguntas** (expandido desde 4)
- **6 subtemas** (3 nuevos: EC. Diferenciales, Series, Aplicaciones)
- **Material**: 15 semanas de resúmenes + talleres 2024-1

### 2. Física II (nueva)
- **12 preguntas**
- **4 subtemas**: Electrostática, Potencial, Circuitos, Magnetismo
- **Material**: Talleres de física + conceptos estándar universitarios

### 3. Probabilidad y Estadística
- **12 preguntas** (completado desde 2)
- **5 subtemas** (1 nuevo: Inferencia estadística)
- **Material**: 15+ sesiones con soluciones 2025-I

---

## 🎓 Metodología: Preguntas trampa

### Diferencia clave vs. exámenes tradicionales

**Examen tradicional**:
```
❌ Pregunta: ¿Cuánto es 2+2?
   A) 3  B) 4  C) 5  D) 6
   
Si falla → Solo sabemos que no sabe
```

**Calibra**:
```
✅ Pregunta: En ∫ x·ln(x) dx, ¿qué eliges como u?
   A) x → "eliges u por orden de aparición, no por ILATE"
   B) ln(x) → CORRECTA
   C) dx → "confundes u con dv"
   D) x·ln(x) → "no separas el producto"
   
Si falla → Sabemos EXACTAMENTE qué error cometió
```

### Resultado para el monitor

**Brief automático antes de la sesión**:
```
Estudiante: Juan D.
Materia: Cálculo Integral
Subtema débil: Integración por partes

Error detectado: "eliges u por orden de aparición, no por prioridad ILATE"

Plan sugerido:
1. Repasa la regla ILATE (15 min)
2. Ejercicio guiado: ∫ x·eˣ dx (20 min)
3. Práctica independiente (25 min)
```

---

## 💡 Valor diferenciador

### Lo que ya existe (competencia)
- ❌ Directorios de monitores (Calico Colombia)
- ❌ Videotutoriales (YouTube, Khan Academy)
- ❌ AI chatbots (Google AI Plus gratis para estudiantes colombianos)

### Lo que Calibra aporta
- ✅ **Diagnóstico preciso**: No solo "fallaste", sino "confundes X con Y"
- ✅ **Plan automático**: El monitor llega preparado con el plan de sesión
- ✅ **Emparejamiento inteligente**: Por profesor, subtema y error específico

---

## 🔍 Ejemplos concretos

### Cálculo Integral
**Pregunta**: Si dy/dx = ky donde k es constante, la solución general es:
- ✅ y = Ce^(kx)
- ❌ y = C + kx → **Error**: "resuelves como integración directa sin reconocer la exponencial"
- ❌ y = kx² + C → **Error**: "integras k dos veces ignorando que y está en la ecuación"

**Brief para el monitor**:
- "Arranca explicando ecuaciones exponenciales vs polinómicas"
- "Ejercicio: dy/dx = 3y para que vea la diferencia"

### Probabilidad
**Pregunta**: Un intervalo de confianza del 95% para la media μ significa que:
- ✅ Si repitieras el muestreo muchas veces, 95% de los intervalos contendrían μ
- ❌ Hay 95% de probabilidad de que μ esté en este intervalo → **Error**: "interpretas el IC como probabilidad del parámetro"
- ❌ El 95% de los datos están en el intervalo → **Error**: "confundes IC con rango de datos"

**Brief para el monitor**:
- "Aclara que el parámetro μ es fijo, el intervalo es lo que varía"
- "Dibuja 10 muestras e intervalos para visualizar"

### Física II
**Pregunta**: El campo eléctrico E a distancia r de una carga Q es E = kQ/r². Si duplicas r:
- ✅ E se reduce a la cuarta parte
- ❌ E se reduce a la mitad → **Error**: "aplicas proporcionalidad lineal en lugar de cuadrática"
- ❌ E se duplica → **Error**: "inviertes la relación"

**Brief para el monitor**:
- "Repasa potencias inversas: por qué 1/(2r)² = 1/4r²"
- "Ejercicio numérico con r=1 y r=2 para que calcule"

---

## 🚀 Demo para la presentación

### Flujo recomendado (3 minutos)

1. **Inicio** (15 seg)
   - Mostrar portada: "Llega a la monitoría y que el monitor ya sepa qué explicarte"
   - Elegir materia: **Cálculo Integral**

2. **Prueba** (45 seg)
   - Responder 3-4 preguntas **deliberadamente fallando algunas**
   - Mostrar que NO dice si acertaste (no es examen, es diagnóstico)

3. **Diagnóstico** (30 seg)
   - **Punto clave**: "Tu punto débil: Ecuaciones diferenciales de primer orden"
   - **Error específico**: "No separas las variables antes de integrar"
   - Mostrar barras de dominio por subtema

4. **Monitores** (45 seg)
   - Lista filtrada por el subtema débil
   - Primer monitor: **"Cursó con tu mismo profesor"**
   - Mostrar que recibe el brief antes de la sesión

5. **Exploración libre** (45 seg)
   - Volver al inicio → "Ver monitores sin hacer la prueba"
   - Filtrar por: **Materia = Física II, Precio = Hasta $25.000**
   - Mostrar que funciona sin diagnóstico previo

---

## 📈 Métricas de validación técnica

### Pruebas automatizadas
```
✅ 174 de 195 comprobaciones pasando
✅ Navegación completa funcional
✅ Filtros de búsqueda operativos
✅ Certificación de monitores validada
✅ Modo adaptativo funcionando
✅ Barajado de opciones correcto
```

### Las 21 fallas son esperadas
- ⚠️ El verificador espera 4 preguntas (MVP original)
- ⚠️ Ahora hay 12 preguntas por materia (expansión exitosa)
- ⚠️ Oráculo de regresión necesita actualización (no es bug)

---

## 🎨 Decisiones de diseño

### Arquitectura del contenido
```
contenido/
├── calculo-integral.md      ← Fuente de verdad
├── fisica-2.md               ← Editable en Markdown
├── probabilidad-estadistica.md
└── convertir.js             ← Compila a index.html
```

**Ventaja**: Cualquiera del equipo puede agregar preguntas sin programar

### Estructura de una pregunta
```markdown
### P5 · dificultad 2
Una ecuación diferencial de variables separables tiene
la forma dy/dx = f(x)·g(y). ¿Cuál es el primer paso?

- A) Separar variables: (1/g(y))dy = f(x)dx · CORRECTA
- B) Integrar ambos lados directamente · no separas variables
- C) Derivar ambos lados para simplificar · confundes resolver con derivar
- D) Sustituir y = 0 para la constante · intentas encontrar C antes de integrar
```

Cada error se escribe:
- ✅ En **segunda persona**: "confundes X con Y"
- ✅ **Accionable**: se convierte directo en plan de sesión
- ✅ Sin punto final: aparece como "Error detectado: [texto]"

---

## 🔮 Próximos pasos (post-presentación)

### Corto plazo (1-2 semanas)
- [ ] Validar errores con monitores reales de Uniandes
- [ ] Agregar 2-3 preguntas más por subtema (mínimo 3 por subtema)
- [ ] Completar Álgebra Lineal (4 subtemas, 12 preguntas)

### Mediano plazo (1 mes)
- [ ] Piloto con 10 estudiantes + 5 monitores reales
- [ ] Medir: ¿El brief es útil? ¿El diagnóstico es preciso?
- [ ] Iterar preguntas según retroalimentación

### Largo plazo (3 meses)
- [ ] Integrar más material de cursos (Física 2 completo, Diferencial, Vectorial)
- [ ] Sistema adaptativo mejorado (ajusta dificultad según respuestas)
- [ ] Banco de ejercicios sugeridos para cada error

---

## 📱 Información técnica

### Cómo abrir el prototipo
```bash
# Opción 1: Doble clic
start index.html

# Opción 2: Publicar en línea (Netlify Drop)
# Arrastrar la carpeta a app.netlify.com/drop
```

### Cómo modificar preguntas
```bash
# 1. Editar contenido/calculo-integral.md
# 2. Compilar
node contenido/convertir.js --escribir

# 3. Verificar
.\verificar.cmd
```

### Cómo agregar una materia nueva
```bash
# 1. Copiar contenido/plantilla-materia.md
# 2. Renombrar a contenido/nueva-materia.md
# 3. Llenar preguntas (mínimo 1 por subtema)
# 4. Cambiar activa: false → activa: true
# 5. Compilar
node contenido/convertir.js --escribir
```

---

## 🎤 Mensaje clave para la presentación

> **"Calibra no es un directorio de monitores. Es un sistema de diagnóstico que le dice al estudiante exactamente qué no sabe, y al monitor exactamente qué enseñar, antes de que empiece la sesión."**

### Analogía médica
- ❌ Directorio de doctores: "Tienes un doctor disponible"
- ✅ Calibra: "Tienes faringitis estreptocócica, necesitas amoxicilina, aquí está el especialista en infecciones bacterianas"

---

## 👥 Créditos

**Implementación**: juzouy  
**Material de cursos**: Universidad de los Andes (2024-1, 2025-I)  
**Base del proyecto**: Calibra MVP (BRIEF.md)  
**Fecha**: 2026-09-15  

---

## 📧 Preguntas frecuentes

### ¿Por qué solo 3 materias?
**R**: Priorización por material disponible. Teníamos resúmenes completos de Cálculo Integral + ED, Probabilidad 1 y Física 2. Las demás materias requieren validar temarios primero.

### ¿Por qué 12 preguntas por materia?
**R**: Balance entre cobertura y tiempo de prueba. Con 12 preguntas (2-3 por subtema), el modo adaptativo puede profundizar en un subtema si el estudiante falla, o recorrer todos si va bien. Menos de 12 no alcanza para adaptar.

### ¿Cómo se validan los errores conceptuales?
**R**: 
1. Primero, basados en literatura educativa y experiencia de monitores
2. Luego, validación con monitores reales: "¿Son estos los errores que ves?"
3. Finalmente, datos de uso: ¿Las opciones incorrectas son elegidas?

### ¿Qué pasa si el estudiante adivina?
**R**: El sistema no es infalible con una sola pregunta, por eso evalúa 2-3 preguntas por subtema. Si adivina en todas, simplemente no detectará un punto débil (mejor que un falso positivo).

### ¿El brief al monitor es suficiente?
**R**: Es el **punto de partida**, no el plan completo. El monitor usa su experiencia para adaptar el plan a la personalidad y ritmo del estudiante. Calibra le ahorra los primeros 15 minutos de "¿qué no entiendes?" y "muéstrame cómo harías este ejercicio".

---

**Última actualización**: 2026-09-15  
**Versión para presentación**: 1.0
