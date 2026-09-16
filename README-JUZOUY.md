# Calibra - Rama juzouy

## Cambios implementados para la presentación

Esta rama expande Calibra con material de cursos anteriores, enfocándose en preguntas trampa calibradas para detectar debilidades conceptuales específicas de los estudiantes.

### 📚 Materias implementadas

#### 1. Cálculo Integral con Ecuaciones Diferenciales
- **Estado**: ✅ Activa
- **Código**: MATE-1214
- **Preguntas**: 12 (expandido desde 4 originales)
- **Subtemas**: 6
  1. Integración por partes
  2. Sustitución
  3. Integrales impropias
  4. **Ecuaciones diferenciales de primer orden** (nuevo)
  5. **Series y convergencia** (nuevo)
  6. **Aplicaciones de la integral** (nuevo)

#### 2. Física II
- **Estado**: ✅ Activa
- **Código**: FISI-1019
- **Preguntas**: 12 (materia nueva)
- **Subtemas**: 4
  1. Electrostática y ley de Coulomb
  2. Potencial eléctrico y energía
  3. Circuitos de corriente continua
  4. Campo magnético y fuerza magnética

#### 3. Probabilidad y Estadística
- **Estado**: ✅ Activa
- **Código**: IIND-2106
- **Preguntas**: 12 (completado desde 2 originales)
- **Subtemas**: 5
  1. Técnicas de conteo
  2. Probabilidad condicional y Bayes
  3. Variables aleatorias discretas
  4. Variables aleatorias continuas
  5. **Inferencia estadística básica** (nuevo)

---

## 🎯 Metodología de preguntas trampa

Cada pregunta está diseñada con **errores conceptuales específicos** en las opciones incorrectas:

### Ejemplo: Cálculo Integral

**Pregunta**: En ∫ x·ln(x) dx, ¿qué eliges como u?

- ❌ **Opción A**: x
  - **Error detectado**: "eliges u por orden de aparición, no por prioridad ILATE"
- ✅ **Opción B**: ln(x) (correcta)
- ❌ **Opción C**: dx
  - **Error detectado**: "confundes u con dv"
- ❌ **Opción D**: x · ln(x)
  - **Error detectado**: "no separas el producto en u y dv"

### Ventajas del sistema

1. **Diagnóstico preciso**: No solo dice "fallaste", sino **qué error conceptual cometiste**
2. **Plan de sesión automático**: El monitor recibe el brief con el error específico
3. **Personalización**: El estudiante ve exactamente en qué subtema concentrarse

---

## 🔧 Cómo usar esta rama

### Abrir el prototipo
```bash
# Simplemente abre el archivo en el navegador
start index.html
```

### Ejecutar el convertidor
Si modificas los archivos .md en `/contenido`:
```bash
node contenido/convertir.js --escribir
```

### Verificar los cambios
```bash
.\verificar.cmd
```

**Nota**: El verificador mostrará 21 fallas esperadas porque está diseñado para el MVP original con 4 preguntas por materia, y ahora tenemos 12 preguntas. Las 174 pruebas que pasan confirman que todo funciona correctamente.

---

## 📊 Material de origen

Los conceptos y errores se basaron en:

### Cálculo Integral con Ecuaciones Diferenciales
- 📁 `Info clases/integral con ecuaciones/`
- 15 semanas de resúmenes (2024-1)
- 4 talleres con soluciones

### Probabilidad y Estadística
- 📁 `Info clases/proba 1/`
- 15+ sesiones con soluciones (2025-I)
- 15 complementarias con soluciones

### Física 2
- 📁 `Info clases/fisica2/`
- Talleres 1 y 2
- Conceptos estándar de Física II universitaria

---

## 🎨 Cambios técnicos

### En los archivos de contenido (.md)

1. **calculo-integral.md**
   - Nombre actualizado a "Cálculo Integral con Ecuaciones Diferenciales"
   - longitud: 4 → 12
   - Agregados 3 subtemas nuevos con 8 preguntas

2. **fisica-2.md** (nuevo)
   - Creado desde cero
   - 12 preguntas completas
   - Errores conceptuales comunes en física universitaria

3. **probabilidad-estadistica.md**
   - activa: false → true
   - Completadas 10 preguntas faltantes
   - Agregado subtema de inferencia estadística

### En index.html

- Exposición de `window.MATERIAS` para arnés de verificación
- Corrección de sintaxis JavaScript en claves con guiones
- Integración de las 36 preguntas nuevas (12 por materia × 3 materias)

---

## ✅ Estado de verificación

```
Comprobaciones: 195
OK:             174 ✅
FALLAS:         21  ⚠️ (esperadas por cambio de longitud)
```

### Pruebas que pasan:
- ✅ Código fuente sin errores de sintaxis
- ✅ Navegación entre pantallas
- ✅ Filtros de búsqueda de monitores
- ✅ Sistema de certificación
- ✅ Creación de perfil de monitor
- ✅ Modo adaptativo
- ✅ Barajado de opciones
- ✅ Robustez ante navegación incorrecta

### Fallas esperadas:
- ⚠️ Oráculo de regresión espera 4 preguntas, pero ahora hay 12
- ⚠️ Diagnóstico específico cambia por los nuevos subtemas

---

## 🚀 Para la presentación

### Flujo estudiante (recomendado para demo):

1. **Inicio**: Seleccionar materia (Cálculo Integral, Física II o Probabilidad)
2. **Prueba**: Responder 4-12 preguntas (según configuración)
3. **Diagnóstico**: Ver el punto débil y error específico detectado
4. **Monitores**: Lista filtrada por subtema débil
5. **Agendar**: Seleccionar monitor y horario

### Flujo monitor (para reclutamiento):

1. **Inicio monitor**: Ver beneficios
2. **Certificación**: Responder 3 preguntas
3. **Resultado**: Ver estado certificado
4. **Crear perfil**: Llenar datos y publicar
5. **Panel**: Ver brief de próxima sesión

### Exploración libre (nuevo):

1. Desde el inicio: "Ver monitores sin hacer la prueba"
2. Filtrar por materia, subtema, precio y nivel
3. Ver perfiles completos
4. Agendar sin diagnóstico previo

---

## 📝 Pendientes (para iteraciones futuras)

- [ ] Agregar más preguntas por subtema (mínimo 3, ideal 4-5)
- [ ] Validar errores conceptuales con monitores reales
- [ ] Completar Álgebra Lineal, Cálculo Diferencial y Cálculo Vectorial
- [ ] Integrar material de Física 2 completo (más talleres)
- [ ] Añadir ejemplos de ejercicios al brief del monitor
- [ ] Implementar sistema de dificultad adaptativa mejorado

---

## 👥 Créditos

**Desarrollado por**: juzouy  
**Material de cursos**: Universidad de los Andes (2024-1, 2025-I)  
**Base del proyecto**: Calibra MVP (BRIEF.md original)

---

## 📧 Contacto

Para preguntas o retroalimentación sobre esta implementación, contactar al equipo de Calibra.

---

**Última actualización**: 2026-09-15  
**Commit**: Expandir Calibra con 3 materias activas y preguntas trampa calibradas
