# Instrucciones Rápidas - Demo Mañana

## ⚡ Abrir el prototipo

### Opción 1: Local (recomendado)
```
Doble clic en: index.html
```

### Opción 2: Online (si falla local)
1. Ir a: https://app.netlify.com/drop
2. Arrastrar toda la carpeta
3. Copiar URL generada
4. ¡Listo en 30 segundos!

---

## 🎬 Guion de demo (3 minutos)

### 1. Inicio (15 segundos)
```
✅ Mostrar portada
✅ Explicar: "Diagnostica debilidades específicas"
✅ Elegir: Cálculo Integral
```

### 2. Hacer la prueba (45 segundos)
```
✅ Responder 4 preguntas (fallar 1-2 a propósito)
✅ Enfatizar: NO dice si acertaste (no es examen)
✅ Hacer clic: "Siguiente" en cada pregunta
```

### 3. Diagnóstico (30 segundos)
```
✅ Mostrar punto débil específico
✅ Leer error conceptual en voz alta
✅ "ESTO es lo que el monitor recibe ANTES de la sesión"
```

### 4. Monitores (45 segundos)
```
✅ Mostrar lista filtrada por subtema
✅ Señalar: "Cursó con tu mismo profesor"
✅ Abrir perfil de monitor
✅ Leer brief: "Qué explicar, en qué orden"
```

### 5. Bonus: Exploración libre (30 segundos)
```
✅ Volver a inicio
✅ "Ver monitores sin hacer la prueba"
✅ Filtrar por: Física II + Precio bajo
✅ "Funciona sin diagnóstico también"
```

---

## 🎯 Mensaje clave para repetir

> **"No es un directorio. Es un diagnóstico automático que le dice al estudiante QUÉ no sabe, y al monitor QUÉ enseñar, antes de la sesión."**

---

## 📱 Si algo falla durante la demo

### Problema: No carga index.html
**Solución**: 
```
1. Abrir PowerShell en la carpeta
2. python -m http.server 8000
3. Abrir: http://localhost:8000
```

### Problema: Se ve mal en pantalla
**Solución**: 
```
1. F12 → Device Toolbar (Ctrl+Shift+M)
2. Elegir: iPhone 12 Pro (390x844)
3. Listo: diseño mobile-first
```

### Problema: Internet lento para Google Fonts
**Solución**: 
```
No importa. La app funciona sin internet.
Solo cambia la tipografía a system-ui.
```

---

## 🔑 Datos clave para mencionar

### Números
- ✅ **3 materias activas** (Cálculo, Física, Probabilidad)
- ✅ **36 preguntas calibradas** (12 por materia)
- ✅ **15 subtemas** cubiertos
- ✅ **174/195 pruebas automatizadas pasando**

### Diferenciadores vs competencia
- ❌ Calico Colombia: directorio de monitores (ya existe)
- ❌ YouTube/Khan: videotutoriales genéricos (ya existe)
- ❌ Google AI Plus: chat gratis para universitarios (ya existe)
- ✅ **Calibra**: diagnóstico + brief automático (único)

### Material usado
- 📁 15 semanas de resúmenes (Cálculo Integral 2024-1)
- 📁 15+ sesiones con soluciones (Probabilidad 2025-I)
- 📁 Talleres de Física 2
- 📊 Errores conceptuales validados por literatura educativa

---

## 🎤 Respuestas a preguntas frecuentes

### "¿Esto reemplaza al monitor?"
**R**: No. Le ahorra al monitor los primeros 15 minutos de diagnóstico manual. El monitor sigue siendo esencial para explicar, adaptar y motivar.

### "¿Qué pasa si el estudiante adivina?"
**R**: El sistema evalúa 2-3 preguntas por subtema. Si adivina todas, no detectará punto débil (mejor que un falso positivo). En un piloto real, podríamos agregar más preguntas.

### "¿Cómo validan los errores conceptuales?"
**R**: 
1. Literatura educativa ("Common Student Errors in Calculus")
2. Experiencia de monitores reales (a validar en piloto)
3. Datos de uso (cuáles opciones son elegidas)

### "¿Por qué solo 3 materias?"
**R**: Priorizamos por material disponible. Teníamos resúmenes completos de estas 3. Las demás requieren validar temarios con profesores primero.

### "¿Cuánto costaría producción?"
**R**: 
- Backend: Firebase (gratis hasta 50k usuarios/mes)
- Hosting: Netlify (gratis)
- Pasarela de pago: Wompi Colombia (2.99% + $900 por transacción)
- **Costo inicial: $0. Costo variable: comisión de pasarela**

### "¿Cómo monetizan?"
**R**: Comisión al monitor por cada sesión agendada (a definir: 10-15%). El estudiante paga al monitor, Calibra retiene comisión. Modelo validado por Calico (competencia) y Superprof (internacional).

---

## 📸 Capturas de respaldo

Si el HTML falla completamente:

```
capturas/estudiante/
  e-01-inicio.png           ← Portada
  e-02-pregunta-1.png       ← Durante la prueba
  e-06-diagnostico.png      ← Resultado con error
  e-07-monitores.png        ← Lista filtrada
  e-08-perfil.png           ← Brief del monitor

capturas/monitor/
  m-06-resultado-certificado.png  ← Monitor certificado
  m-07-panel.png                   ← Panel con brief
```

**Plan B**: Mostrar capturas + narrar el flujo si la demo en vivo falla.

---

## ⏱️ Timing estricto

| Fase | Tiempo | Qué mostrar |
|------|--------|-------------|
| Portada | 15s | Headline + selección materia |
| Prueba | 45s | 4 preguntas (fallar 2) |
| Diagnóstico | 30s | Punto débil + error |
| Monitores | 45s | Lista + brief |
| Bonus | 30s | Exploración libre |
| **TOTAL** | **2:45** | Dejar 15s para preguntas |

---

## 🚨 Checklist pre-demo

**5 minutos antes**:
- [ ] Abrir `index.html` y verificar que carga
- [ ] Hacer clic en "Empezar de nuevo" (botón inferior)
- [ ] Cerrar todas las ventanas menos el navegador
- [ ] Poner celular en modo avión (no interrupciones)
- [ ] Tener Plan B (capturas) abierto en otra pestaña

**1 minuto antes**:
- [ ] Refrescar la página (F5)
- [ ] Verificar que está en pantalla de inicio
- [ ] Respirar profundo
- [ ] ¡A romperla! 🚀

---

## 📧 Contacto de emergencia

Si algo falla y necesitas ayuda técnica:
- Implementador: juzouy
- Rama: `juzouy`
- Último commit: "Agregar resumen ejecutivo para presentación mañana"

---

## 🎉 Después de la presentación

### Si sale bien:
- [ ] Capturar retroalimentación de la audiencia
- [ ] Anotar preguntas que no supiste responder
- [ ] Identificar próximos pasos sugeridos

### Si sale mal:
- [ ] No pasa nada. Es un prototipo.
- [ ] Anotar qué falló para iterar
- [ ] El valor está en el concepto, no en el demo perfecto

---

**¡MUCHA SUERTE! 🍀**

El trabajo ya está hecho. El prototipo funciona. Los números están ahí. Solo queda contarlo bien.

**Recuerda**: No estás vendiendo código. Estás vendiendo la visión de que "el monitor puede llegar preparado a la sesión sin perder tiempo diagnosticando".

---

**Última revisión**: 2026-09-15 23:45  
**Preparado por**: juzouy  
**Para**: Presentación del 16 de septiembre
