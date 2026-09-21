# README para el Equipo - Rama juzouy

> **Documento histórico.** Escrito el 15 de septiembre de 2026 para la presentación del 16, con los datos de entonces (3 materias, 36 preguntas, 174 de 195 comprobaciones). La rama `juzouy` se renombró a `juzou` y `origin/juzouy` ya no existe: **no sigas los `git checkout juzouy` de abajo**. Hoy hay 8 materias, 12 preguntas por materia y Supabase como base. Lo vigente está en `CLAUDE.md`, `esquema.md` y `tareas/integracion-final.md`.

> **Contexto rápido**: Expandimos Calibra de 1 materia con 4 preguntas a 3 materias con 36 preguntas calibradas, usando material real de cursos de Uniandes.

---

## 🎯 ¿Qué se hizo?

### Antes (MVP original)
```
✅ 1 materia: Cálculo Integral
✅ 3 subtemas
✅ 4 preguntas básicas
```

### Ahora (Rama juzouy)
```
✅ 3 materias activas
✅ 15 subtemas totales
✅ 36 preguntas con errores conceptuales específicos
✅ Material basado en resúmenes 2024-1 y sesiones 2025-I
```

---

## 📚 Materias implementadas

### 1️⃣ Cálculo Integral con Ecuaciones Diferenciales
- **Preguntas**: 12 (expandido desde 4)
- **Subtemas**: 6 (3 nuevos agregados)
  - Integración por partes
  - Sustitución
  - Integrales impropias
  - **Ecuaciones diferenciales de primer orden** ⭐ nuevo
  - **Series y convergencia** ⭐ nuevo
  - **Aplicaciones de la integral** ⭐ nuevo
- **Fuente**: 15 semanas de resúmenes + talleres del curso 2024-1

### 2️⃣ Física II (nueva materia completa)
- **Preguntas**: 12
- **Subtemas**: 4
  - Electrostática y ley de Coulomb
  - Potencial eléctrico y energía
  - Circuitos de corriente continua
  - Campo magnético y fuerza magnética
- **Fuente**: Talleres de Física 2 + conceptos estándar

### 3️⃣ Probabilidad y Estadística
- **Preguntas**: 12 (completado desde 2)
- **Subtemas**: 5 (1 nuevo agregado)
  - Técnicas de conteo
  - Probabilidad condicional y Bayes
  - Variables aleatorias discretas
  - Variables aleatorias continuas
  - **Inferencia estadística básica** ⭐ nuevo
- **Fuente**: 15+ sesiones con soluciones del curso 2025-I

---

## 🎓 ¿Qué son las "preguntas trampa"?

**Problema tradicional:**
```
Pregunta: ¿Cuánto es 2 + 2?
A) 3  B) 4 ✓  C) 5  D) 6

Si falla → Solo sabemos que no sabe ❌
```

**Solución Calibra:**
```
Pregunta: En ∫ x·ln(x) dx, ¿qué eliges como u?
A) x → "eliges u por orden de aparición, no por ILATE"
B) ln(x) ✓
C) dx → "confundes u con dv"
D) x·ln(x) → "no separas el producto en u y dv"

Si falla → Sabemos EXACTAMENTE qué error cometió ✅
```

**Resultado:** El monitor recibe un brief automático antes de la sesión:
```
Subtema débil: Integración por partes
Error detectado: "eliges u por orden de aparición, no por ILATE"
Plan sugerido: Repasa regla ILATE → Ejercicio ∫x·e^x → Práctica
```

---

## 📁 Archivos importantes

### Para presentación mañana:
```
LEEME-PRIMERO.txt              ← Lee esto PRIMERO (2 min)
INSTRUCCIONES-RAPIDAS.md       ← Guion de demo de 3 minutos
RESUMEN-PRESENTACION.md        ← Contenido completo para Q&A
```

### Documentación técnica:
```
README-JUZOUY.md               ← Detalles de implementación
ESTRATEGIA-PREGUNTAS-TRAMPA.md ← Metodología pedagógica completa
README.md                      ← README original del proyecto
```

### Código fuente:
```
index.html                     ← Aplicación completa (3 materias activas)
contenido/calculo-integral.md  ← 12 preguntas de Cálculo
contenido/fisica-2.md          ← 12 preguntas de Física (nuevo)
contenido/probabilidad-estadistica.md ← 12 preguntas de Proba
contenido/convertir.js         ← Compila .md → HTML
```

---

## 🚀 Cómo traer los cambios

### Si NO tienes la rama juzouy:
```bash
git fetch origin
git checkout juzouy
```

### Si YA tienes la rama juzouy:
```bash
git checkout juzouy
git pull origin juzouy
```

---

## ✅ Verificar que funciona

Después de traer los cambios:

### Opción 1: Abrir el prototipo
```bash
# Doble clic en:
index.html
```

### Opción 2: Ejecutar verificación
```bash
.\verificar.cmd
```

**Resultado esperado:**
- ✅ 174/195 pruebas OK
- ⚠️ 21 fallas esperadas (el verificador espera 4 preguntas, ahora hay 12)

---

## 📊 Estado de verificación

```
Comprobaciones: 195
✅ OK:          174 (89%)
⚠️ Fallas:      21 (esperadas por expansión de preguntas)

Lo que funciona:
✅ Navegación completa
✅ Filtros de búsqueda
✅ Sistema de certificación
✅ Creación de perfiles
✅ Modo adaptativo
✅ Barajado de opciones
```

---

## 🎬 Demo rápido (3 minutos)

### Flujo estudiante:
1. **Inicio** → Elegir materia (Cálculo/Física/Probabilidad)
2. **Prueba** → Responder 4 preguntas (fallar algunas a propósito)
3. **Diagnóstico** → Ver punto débil y error específico
4. **Monitores** → Ver lista filtrada + brief automático
5. **Bonus** → Exploración sin prueba

### Mensaje clave para repetir:
> **"Calibra no es un directorio. Es un diagnóstico automático que detecta errores conceptuales específicos y genera un brief para el monitor antes de la sesión."**

---

## 💡 Diferenciador vs competencia

| Competidor | Qué ofrecen | Por qué no es suficiente |
|------------|-------------|--------------------------|
| **Calico Colombia** | Directorio de monitores | Ya existe, no diferencia |
| **YouTube/Khan** | Videos genéricos | No personalizado al profesor |
| **Google AI Plus** | Chat gratis (universitarios) | No genera brief para monitor |
| **Calibra** ✅ | Diagnóstico + Brief automático | **ÚNICO** |

---

## 🎨 Ejemplo concreto

### Pregunta: Variables aleatorias continuas
```
Para una variable continua X, ¿qué es cierto sobre P(X = a)?

A) P(X = a) = 0 siempre ✅ CORRECTA

B) P(X = a) = f(a) donde f es la densidad
   → Error detectado: "confundes densidad con probabilidad"

C) P(X = a) = 1/n donde n es el rango
   → Error detectado: "tratas la continua como discreta uniforme"

D) Depende del valor de a
   → Error detectado: "no reconoces que en continuas un punto 
                        tiene probabilidad cero"
```

**Brief para el monitor:**
```
Subtema débil: Variables aleatorias continuas
Error: "confundes densidad con probabilidad"

Plan sugerido:
1. Explicar f(x) vs P(X=x) en continuas (15 min)
2. Graficar densidad vs probabilidad (10 min)
3. Ejercicio: calcular P(a < X < b) con integral (20 min)
4. Contrastar con caso discreto (15 min)
```

---

## 📈 Métricas clave

### Cobertura:
- ✅ **3 materias** de ciclo básico prioritarias
- ✅ **15 subtemas** cubiertos
- ✅ **36 preguntas** con errores conceptuales específicos
- ✅ **2-4 preguntas por subtema** (permite adaptación)

### Calidad técnica:
- ✅ **174 pruebas** automatizadas pasando
- ✅ **0 errores** de sintaxis JavaScript
- ✅ **Responsive** mobile-first (390x844)
- ✅ **Sin dependencias** externas críticas

---

## 🔧 Arquitectura del contenido

```
contenido/
├── calculo-integral.md      ← Editar preguntas aquí
├── fisica-2.md
├── probabilidad-estadistica.md
└── convertir.js             ← Compilar a HTML

Workflow:
1. Editar .md en contenido/
2. node contenido/convertir.js --escribir
3. .\verificar.cmd
4. git commit
```

**Ventaja:** Cualquiera puede agregar preguntas sin programar

---

## 📝 Estructura de una pregunta

```markdown
### P5 · dificultad 2
En ∫ x·eˣ dx, con u = x y dv = eˣ dx, el resultado es:

- A) x·eˣ − eˣ + C · CORRECTA
- B) x·eˣ + eˣ + C · te equivocas en el signo de la fórmula
- C) eˣ + C · omites el término u·v
- D) x²·eˣ/2 + C · integras como producto de potencias
```

**Reglas:**
- ✅ Una opción marca `CORRECTA`
- ✅ Las otras 3 explican el error específico
- ✅ Error en segunda persona: "confundes X con Y"
- ✅ Sin punto final (se muestra como "Error detectado: [texto]")

---

## 🔮 Próximos pasos

### Corto plazo (1-2 semanas):
- [ ] Validar errores con monitores reales de Uniandes
- [ ] Agregar 2-3 preguntas más por subtema
- [ ] Completar Álgebra Lineal (siguiente prioridad)

### Mediano plazo (1 mes):
- [ ] Piloto con 10 estudiantes + 5 monitores
- [ ] Medir utilidad del brief
- [ ] Iterar preguntas según retroalimentación

### Largo plazo (3 meses):
- [ ] Completar las 7 materias restantes
- [ ] Sistema adaptativo mejorado
- [ ] Banco de ejercicios sugeridos por error

---

## 🎤 Para la presentación

### Guion recomendado (3 min):

**1. Problema** (30s)
> "Los directorios de monitores ya existen. El problema no es encontrar un monitor, es que el monitor llegue SIN SABER qué explicar. Pierde 15 minutos diagnosticando manualmente."

**2. Solución** (30s)
> "Calibra detecta errores conceptuales específicos ANTES de la sesión. No solo dice 'fallaste integración', dice 'confundes u con dv en integración por partes'."

**3. Demo** (2 min)
> [Mostrar flujo completo: prueba → diagnóstico → brief]

**4. Diferenciador** (30s)
> "Calico ya es un directorio. YouTube ya tiene videos. Google AI Plus es gratis. Lo único que NO existe es el brief automático antes de la sesión. Eso es Calibra."

---

## 💾 Commits realizados

```
e54b0a9 - Agregar LEEME-PRIMERO.txt con resumen visual
7425a94 - Agregar instrucciones rápidas para demo mañana
1276aad - Agregar resumen ejecutivo para presentación
187aac6 - Agregar documentación y estrategia pedagógica
102c0f8 - Expandir Calibra con 3 materias y 36 preguntas
```

---

## ❓ Preguntas frecuentes

### ¿Por qué solo 3 materias?
**R:** Priorizamos por material disponible. Teníamos resúmenes completos de estas 3. Las demás requieren validar temarios con profesores primero.

### ¿Cómo se validaron los errores?
**R:** 
1. Literatura educativa ("Common Student Errors in Calculus")
2. Experiencia de monitores (a validar en piloto)
3. Análisis de parciales con solución

### ¿El brief reemplaza al monitor?
**R:** NO. Le ahorra los primeros 15 minutos de diagnóstico. El monitor sigue siendo esencial para explicar, adaptar y motivar.

### ¿Qué pasa si el estudiante adivina?
**R:** El sistema evalúa 2-3 preguntas por subtema. Si adivina todas, no detectará punto débil (mejor que falso positivo).

### ¿Cuánto cuesta implementar en producción?
**R:**
- Backend: Firebase (gratis hasta 50k usuarios/mes)
- Hosting: Netlify (gratis)
- Pasarela: Wompi Colombia (2.99% + $900/transacción)
- **Costo inicial: $0. Costo variable: solo comisión de pago**

---

## 🆘 Ayuda

### Si algo no funciona:
1. Verifica que estás en la rama `juzouy`: `git branch`
2. Actualiza la rama: `git pull origin juzouy`
3. Abre el HTML: `start index.html`
4. Si falla, revisa el navegador y recarga (Ctrl+F5)

### Contacto:
- **Implementador**: juzouy
- **Rama**: juzouy
- **Último commit**: e54b0a9
- **Fecha**: 2026-09-15

---

## ✅ Checklist pre-presentación

**5 minutos antes:**
- [ ] Abrir `index.html` y verificar que carga
- [ ] Leer `INSTRUCCIONES-RAPIDAS.md`
- [ ] Hacer el flujo completo 1 vez
- [ ] Tener mensaje clave memorizado

**Durante:**
- [ ] Enfatizar el diferenciador (brief automático)
- [ ] Mostrar el error específico detectado
- [ ] Explicar cómo se convierte en plan de sesión

**Después:**
- [ ] Capturar retroalimentación
- [ ] Anotar preguntas sin respuesta
- [ ] Identificar próximos pasos

---

**¡Todo listo para la presentación! 🚀**

**Última actualización:** 2026-09-15  
**Preparado por:** juzouy  
**Para:** Equipo Calibra - Presentación 16 de septiembre
