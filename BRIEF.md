# Calibra — Brief para construir el MVP

> Documento de contexto y especificación. Guárdalo en la raíz del repositorio como `BRIEF.md`.
> Todo lo que necesitas para construir está aquí: no hace falta preguntar por el negocio.

---

## 1. Qué es Calibra

Plataforma web que conecta a estudiantes de pregrado de la Universidad de los Andes con **monitores** —estudiantes de semestres superiores que ya cursaron esa materia— para materias de ciclo básico.

El diferenciador no es el directorio. Es una **prueba de opción múltiple calibrada**: cada opción incorrecta está diseñada para delatar un error conceptual específico, y las preguntas se construyen sobre el temario real del curso. Con ese resultado la plataforma (a) le dice al estudiante en qué subtema exacto está fallando y (b) le entrega al monitor el plan de la sesión antes de que empiece.

**Modelo de ingresos:** comisión cobrada al monitor por cada monitoría concretada en la plataforma.

**Los tres problemas que ataca:**

1. Falsa sensación de preparación — el estudiante no sabe qué subtema no domina.
2. Acceso limitado y barrera psicológica — las monitorías institucionales están llenas y a muchos les da pena pedir ayuda.
3. Monitoría no personalizada — el monitor llega sin saber qué explicar.

**Métrica clave del negocio:** tasa de retorno tras la primera clase.

---

## 1.b Contexto competitivo — qué NO construir

Tres hallazgos de la investigación de mercado condicionan el diseño. Léelos antes de escribir código.

- **Ya existe un competidor colombiano casi idéntico** (Calico: marketplace de monitorías, comisión del 15%, lista Cálculo Diferencial). Un directorio de monitores con perfiles y agenda **no es diferenciador**: eso ya está hecho. Lo único que separa a Calibra es la calibración por subtema, el emparejamiento por **mismo profesor** y el brief que recibe el monitor. Esos tres elementos son el corazón del MVP; todo lo demás es soporte.
- **El Pentágono de Uniandes publica gratis el banco oficial de parciales.** Calibra no compite dando material: compite diciéndole al estudiante *cuál* de ese material tiene que estudiar.
- **Google regala AI Plus por 12 meses a universitarios colombianos hasta el 31 de diciembre de 2026.** El sustituto gratuito es muy fuerte. Por eso el producto no puede terminar en "aquí está tu explicación": tiene que terminar en una persona agendada.

> **Pendiente de validar:** el porcentaje exacto de la comisión y si el cobro es por sesión o por paquete prepago. El modelo de pago inmediato por sesión deja un margen de contribución muy bajo; está en revisión. Para el MVP no importa —no hay pagos reales— pero no inventes cifras de comisión en pantalla.

---

## 2. Qué es este MVP y para qué

Es un **prototipo navegable para validación y reclutamiento**. Sirve para sentarse con un estudiante o con un monitor candidato, pasarle el celular, y que recorra el producto en un minuto.

**No es producción.** No hay backend, no hay autenticación, no hay pagos reales, no hay IA real. Toda la lógica de diagnóstico es determinista y está escrita a mano en el código.

Dos objetivos concretos:

- Que un **estudiante** entienda en 60 segundos qué recibe y diga si lo usaría.
- Que un **monitor candidato** vea que se certifica, que le llegan estudiantes, que llega preparado y que subiendo de nivel cobra más — y deje su correo.

**Regla de honestidad, no negociable:** en el pie de todas las pantallas debe aparecer, discreto pero legible, `Prototipo · datos de ejemplo`. Nadie que lo use puede quedar creyendo que ya está operando.

---

## 3. Alcance

**Sí construye:**

- Flujo completo del estudiante (6 pantallas).
- Flujo completo del monitor (5 pantallas).
- Captura de correo al final de cada flujo.
- Botón de reinicio para volver a demostrar sin recargar.

**No construye:**

- Backend, base de datos, login, pasarela de pago.
- Llamadas a APIs de IA.
- Panel de administración.
- Más de una materia: solo **Cálculo Integral**.

---

## 4. Reglas técnicas

- **Un solo archivo `index.html` autónomo.** Todo el CSS en un `<style>` y todo el JS en un `<script>` internos. Sin frameworks, sin build, sin npm.
- Navegación por estado en JS (mostrar/ocultar secciones), con hash en la URL para poder compartir una pantalla concreta.
- **Mobile-first.** Diseñado para 390 × 844 px y que se vea bien hasta escritorio. Áreas táctiles de mínimo 44 px. Nada de texto por debajo de 14 px.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, y respeta `env(safe-area-inset-*)`.
- Sin dependencias externas salvo Google Fonts (Inter), con fallback a `system-ui`.
- El estado vive en memoria; el botón de reinicio lo limpia. No uses `localStorage`.
- Transiciones máximas de 150 ms. Respeta `prefers-reduced-motion`.
- Todo el texto en español de Colombia.

---

## 5. Sistema visual

```
Fondo          #FFFDF5
Superficie     #FFFFFF
Primario       #005EFF   botones, bordes destacados, barras normales
Alerta         #E5484D   solo el subtema débil
Éxito          #0F9D58   solo el estado "certificado"
Texto          #0B1B33
Texto suave    #6B7789
Bordes         #DDE3EC
```

Esquinas de 14 px. Sombras muy suaves o ninguna. Título ~26 px, cuerpo ~16 px, etiquetas ~13 px. Nada de degradados, nada de emojis decorativos, y **ningún icono de cerebro, robot o "IA"**.

---

## 6. Flujo del estudiante

**E1 · Inicio**
Logo tipográfico "Calibra". Titular: *"Llega a la monitoría y que el monitor ya sepa qué explicarte"*. Selector de materia con una sola opción activa: **Cálculo Integral** (las demás en gris, con la etiqueta "pronto"). Botón: *Empezar la prueba*. Enlace secundario abajo: *Soy monitor*.

**E2 · Prueba** (4 preguntas, una por pantalla)
Barra de progreso arriba con "Pregunta N de 4" y la etiqueta del subtema. Enunciado. Cuatro opciones tipo tarjeta, seleccionables. Botón *Siguiente* que solo se activa al elegir. Bajo el botón, en gris: *"Sin nota. Solo para saber qué explicarte."*
No muestres si acertó o falló: esto no es un quiz, es una calibración.

**E3 · Diagnóstico**
Título *"Tu diagnóstico"*, subtítulo *"Cálculo Integral · antes del parcial 2"*.
Una barra horizontal por subtema evaluado, con porcentaje. La más baja va en color de alerta.
Debajo, tarjeta destacada: *"Tu punto débil: {subtema}"* y *"Error detectado: {texto del error}"*.
Botón: *Ver monitores de este subtema*.

**E4 · Monitores**
Lista de 3 tarjetas de monitor. Cada una: inicial en círculo, nombre, carrera y semestre, chips de nivel y calificación, precio por hora, y una línea de por qué encaja. La primera lleva el chip *"Cursó con tu mismo profesor"* y está marcada como recomendada.

**E5 · Perfil y agendar**
Datos del monitor seleccionado. Tarjeta destacada con borde primario: *"{Nombre} recibirá tu diagnóstico antes de la sesión: qué explicarte, en qué orden y con qué ejercicio arrancar."* Dos horarios seleccionables. Precio. Botón: *Agendar y pagar*.

**E6 · Confirmación y lista de espera**
*"Listo. Tu sesión quedaría agendada."* Resumen de lo agendado.
Bloque de captura: *"Calibra todavía no está abierta. Déjanos tu correo y eres de los primeros."* Campo de correo + botón *Avísenme*. Al enviar, mensaje de agradecimiento.
Botón secundario: *Empezar de nuevo*.

---

## 7. Flujo del monitor

**M1 · Inicio monitor**
Titular: *"Gana dinero explicando lo que ya sabes."* Tres puntos: te certificas por materia, te llegan estudiantes con el diagnóstico hecho, y subes de nivel para cobrar más. Botón: *Presentar la prueba de certificación*.

**M2 · Selección de materia**
Igual que E1, solo Cálculo Integral activa.

**M3 · Prueba de certificación** (3 preguntas, una por pantalla)
Mismo componente visual de E2, pero aquí sí es un examen: barra de progreso y contador. Sin la línea de "sin nota".

**M4 · Resultado**
Si acierta 2 o más de 3: estado **certificado** en color de éxito, *"Certificado en Cálculo Integral"*, y su perfil generado — nivel 1, tarifa sugerida $25.000/hora, "0 monitorías".
Si acierta menos: *"Todavía no. Puedes reintentar en 7 días."* y ahí termina el flujo con la captura de correo.

**M5 · Panel del monitor**
Es la pantalla que convence. Tres bloques:

1. *Próxima sesión* — "Mañana 4:00 p. m. con Juan D." y debajo la tarjeta del brief:
   `Subtema · Integración por partes`
   `Error detectado · elige u por orden alfabético, no por prioridad ILATE`
   `Plan de 60 min · 3 ejercicios, arrancar por el caso con logaritmo`
2. *Tu progreso* — barra: "8 de 15 monitorías para Nivel 2" y la línea *"En Nivel 2 tu tarifa sube a $35.000/hora"*.
3. Captura de correo: *"¿Quieres ser de los primeros monitores? Déjanos tu correo."*

---

## 8. Banco de preguntas — úsalo literal, no inventes

La calibración usa las 4 primeras. La certificación del monitor usa las 3 primeras.
Cada opción incorrecta lleva su error conceptual: ese texto es el que se muestra en el diagnóstico.

**P1 · Integración por partes**
En ∫ x·ln(x) dx, ¿qué eliges como u?
- A) `x` — *eliges u por orden de aparición, no por prioridad ILATE*
- B) `ln(x)` — **correcta**
- C) `dx` — *confundes u con dv*
- D) `x · ln(x)` — *no separas el producto en u y dv*

**P2 · Sustitución**
En ∫ 2x·cos(x²) dx, ¿qué método aplicas?
- A) Integración por partes — *no reconoces que 2x es la derivada de x²*
- B) Sustitución con u = x² — **correcta**
- C) Fracciones parciales — *aplicas un método que no corresponde a esta forma*
- D) Integral directa de tabla — *ignoras la regla de la cadena*

**P3 · Integrales impropias**
∫ desde 1 hasta ∞ de (1/x²) dx:
- A) Converge a 1 — **correcta**
- B) Diverge — *la confundes con 1/x, que sí diverge*
- C) Converge a 0 — *evalúas mal el límite superior*
- D) No se puede determinar — *no reconoces una impropia convergente*

**P4 · Integración por partes**
En ∫ x·eˣ dx, con u = x y dv = eˣ dx, el resultado es:
- A) x·eˣ − eˣ + C — **correcta**
- B) x·eˣ + eˣ + C — *te equivocas en el signo de la fórmula de partes*
- C) eˣ + C — *omites el término u·v*
- D) x²·eˣ/2 + C — *integras como si fuera un producto de potencias*

**Cómo calcular el diagnóstico (determinista):**
Porcentaje de dominio por subtema = (aciertos ÷ preguntas del subtema) × 100, y si es 100% muéstralo como 82% para que no se vea artificial; si es 0% muéstralo como 34%; si es 50% muéstralo como 61%.
El punto débil es el subtema con el porcentaje más bajo; si hay empate, gana Integración por partes.
El "error detectado" es el texto de la primera opción incorrecta que eligió dentro de ese subtema. Si no falló ninguna, muestra igualmente el subtema más bajo con el texto *"Vas bien. Refuerza este subtema antes del parcial."*

---

## 9. Datos de ejemplo — monitores

| Inicial | Nombre | Carrera y semestre | Nivel | Calificación | Precio/h | Encaje |
|---|---|---|---|---|---|---|
| D | Daniela R. | Ingeniería Industrial · 7º | 3 | 4,8 ★ (37) | $28.000 | Especializada en integración por partes · **cursó con tu mismo profesor** |
| S | Santiago M. | Matemáticas · 6º | 2 | 4,6 ★ (19) | $24.000 | Fuerte en sustitución e impropias |
| V | Valeria C. | Ingeniería Civil · 8º | 3 | 4,9 ★ (52) | $30.000 | La mejor calificada del semestre |

---

## 10. Captura de correos

Define al inicio del `<script>` una constante:

```js
const FORM_ENDPOINT = ""; // pegar aquí la URL de Formspree o Google Forms
```

Si está vacía, el formulario no envía nada y muestra el mensaje de gracias igual (modo demo). Si tiene valor, hace `fetch` POST con el correo, el rol (`estudiante` o `monitor`) y la fecha. Nunca bloquees la demo por un error de red: si falla, muestra el agradecimiento de todas formas.

---

## 11. Opcional, solo si sobra tiempo — canal profesor

Un enlace discreto en E1: *"Soy profesor"*. Lleva a una sola pantalla: *"Aplica la calibración en tu curso y mira qué subtema tiene flojo antes del parcial. Gratis."* Con captura de correo. Sin más pantallas.

---

## 12. Verificación antes de entregar

Renderiza con Playwright a 390 × 844 con `deviceScaleFactor` 3 y recorre los dos flujos completos tomando captura de cada pantalla. Revisa tú mismo las capturas y confirma: nada cortado, nada desbordado, sin scroll horizontal, contraste legible, y los botones alcanzables con el pulgar. Corrige y vuelve a verificar antes de darlo por terminado.

Entrega al final:

- `index.html`
- La carpeta de capturas de los dos flujos.
- Un `README.md` de diez líneas: cómo abrirlo, cómo publicarlo gratis en GitHub Pages o Netlify Drop, y dónde pegar el `FORM_ENDPOINT`.
