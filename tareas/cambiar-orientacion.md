# Cambiar orientación: de app de celular a página web responsive

Instrucciones para un agente de IA que arranca esta tarea desde cero, sin el
contexto de la conversación donde se decidió. No necesitas leer el chat del
equipo: este archivo y los que enlaza abajo tienen todo lo necesario.

## Contexto

Calibra es un prototipo web (un solo `index.html`, sin build, sin frameworks)
que conecta estudiantes con monitores de materias de ciclo básico, con una
prueba diagnóstica calibrada como diferenciador. Antes de tocar nada, lee
`CLAUDE.md` en la raíz del repo (arquitectura, ramas, reglas del producto que
no se negocian) y `README.md` (cómo abrirlo y correr el arnés).

**Rama de partida:** `main`. Es la rama con el código más reciente (Supabase
conectado, motor de knowledge components, 428 comprobaciones del arnés en
verde). Crea tu rama de trabajo a partir de ahí.

## El problema

La app está construida como un simulador de app de celular, no como una
página web. Cada una de las 16 pantallas es un `<section class="screen">`
con esta regla central (línea ~74 de `index.html`, dentro de `<style>`):

```css
.screen{
  block-size:100dvh;          /* ocupa el alto completo de la ventana */
  max-inline-size:var(--col); /* ancho máximo de la columna */
  margin-inline:auto;         /* centrada; el resto de la pantalla queda vacío */
  overflow:hidden;            /* solo el .body interno hace scroll */
}
```

`--col` (definida en `:root`, línea ~44) ya crece con el viewport:

```css
:root{ --col:430px; }                          /* mobile, por defecto */
@media (min-width:768px){ :root{ --col:540px } }  /* línea ~508 */
@media (min-width:1024px){ :root{ --col:600px } } /* línea ~524 */
```

Es decir: **ya existen breakpoints**, pero lo único que hacen es agrandar un
poco la tarjeta de celular centrada. En un monitor de escritorio, el
resultado es una columna angosta flotando en medio de una pantalla vacía —
sigue siendo el mismo mockup de teléfono, no una página web que aprovecha el
ancho disponible.

Las 16 pantallas (buscar todas por `class="screen"` en `index.html`):
`s-inicio`, `s-prueba`, `s-diagnostico`, `s-monitores`, `s-perfil`,
`s-confirmacion`, `s-profesor`, `s-monitor`, `s-monitor-materia`,
`s-monitor-correo`, `s-certificacion`, `s-monitor-resultado`, `s-panel`,
`s-buscar`, `s-crear-perfil`.

## Objetivo

Que la interfaz se comporte como una página web real: en pantallas anchas,
el contenido se reorganiza (grids, columnas, layouts distintos), no solo se
escala un mismo bloque centrado. Debe seguir funcionando igual de bien en
celular — no es un rediseño mobile-first a desktop-first, es agregar
comportamiento real en los breakpoints que ya existen.

## Alcance recomendado: medio

Dado que el equipo tiene una entrega con jurados el 23 de septiembre y hay
pendientes bloqueantes sin resolver (proyecto Supabase real, credenciales,
rama por defecto en GitHub, Vercel, video demo, evidencia de entrevistas —
ver `tareas/integracion-final.md`), **no toques las 16 pantallas**. Enfócate
en las que más se ven y más se usan:

1. `s-inicio` — la lista de materias (`<ul class="materias">`, línea ~1130
   en adelante) hoy es una columna vertical (`display:flex;
   flex-direction:column`, línea ~308). A partir de 768px, conviértela en
   grid de 2-3 columnas.
2. `s-buscar` y `s-monitores` — ambas pintan un `<ul class="lista-monitores"
   id="lista-monitores">` vacío que el JS llena con `<li class="monitor-card">`
   (ver comentario en el HTML, línea ~1218). El JS que genera las tarjetas
   **no necesita cambiar**: basta con que `.lista-monitores` pase a
   `display:grid` con columnas responsivas en los breakpoints anchos.
3. `s-prueba` y `s-certificacion` — la pregunta y las opciones podrían
   convivir con una barra de progreso o resumen al costado en vez de
   apilarse, pero evalúa si vale la pena el riesgo: esta pantalla tiene la
   lógica de `avanzarPrueba` y los chequeos del oráculo del arnés más
   sensibles (ver "Trampas conocidas" en `CLAUDE.md`).
4. `s-crear-perfil` — formulario largo; en desktop puede pasar de una
   columna a dos (datos básicos | tarifa y encaje) sin tocar el JS de
   validación.

Si terminas esto con margen de tiempo, expande al resto de las 16 pantallas
siguiendo el mismo patrón. No es necesario para dar la tarea por completa.

## Cómo hacerlo

1. Para cada pantalla del alcance, decide qué layout tiene a partir de
   768px y de 1024px (ya existen esos dos breakpoints, línea ~508 y ~524 de
   `index.html`; puedes reusarlos o afinar puntos intermedios si hace
   falta).
2. Cambia el `display` de los contenedores de lista (`.materias`,
   `.lista-monitores`, etc.) a `grid` dentro de esos `@media`, con
   `grid-template-columns:repeat(auto-fill,minmax(...,1fr))` o fijo
   (2/3 columnas), según se vea mejor.
3. Si una pantalla necesita reorganizar bloques (ej. pregunta a la
   izquierda, progreso a la derecha), usa CSS Grid con
   `grid-template-areas` y la propiedad `order` para reordenar visualmente
   sin tocar el DOM ni el JS. Solo agrega contenedores nuevos en el HTML si
   de verdad no hay forma de lograrlo con lo que ya existe — y si lo haces,
   confirma que el JS que hace `querySelector`/`closest` sobre esa pantalla
   no dependía de la estructura anterior.
4. No toques el patrón `.screen{block-size:100dvh;overflow:hidden}` por
   debajo de 768px: ahí es donde vive el comportamiento mobile que ya está
   verificado (E4 y M5 sin scroll de página, pie fijo, etc. — ver comentario
   en la línea ~68 de `index.html`). Si decides que en desktop una pantalla
   ya no debe comportarse como "una sola vista sin scroll", hazlo *dentro*
   de un `@media (min-width:768px)`, nunca en la regla base.

## Verificación

`verificar.js` corre Playwright **solo a 390×844** (ver "Lo que no está
probado" en `README.md`). Los 428 chequeos actuales no van a detectar nada
de lo que cambies en los breakpoints anchos — y tampoco deben romperse por
tus cambios, porque siguen corriendo a ese mismo ancho.

1. Antes de empezar y al terminar, corre `verificar.cmd` completo. Tiene que
   seguir en verde (428/428 o el número vigente). Si algo se rompe, es
   porque tocaste una regla compartida por debajo de 768px.
2. Como no hay arnés para los anchos nuevos, verifica a ojo con un script
   descartable de Playwright (usa el mismo Playwright global que
   `verificar.cmd`, vía `NODE_PATH=%APPDATA%\npm\node_modules`). Toma
   capturas de cada pantalla del alcance a tres anchos: 390px (no debe
   cambiar), 768px y 1440px. Ejemplo mínimo:

   ```js
   // captura-anchos.mjs — script de un solo uso, no lo dejes en el repo
   import { chromium } from 'playwright';
   const anchos = [390, 768, 1440];
   const browser = await chromium.launch();
   for (const w of anchos) {
     const page = await browser.newPage({ viewport: { width: w, height: 900 } });
     await page.goto('file:///' + process.cwd().replace(/\\/g,'/') + '/index.html');
     // navega a la pantalla que quieras probar, ej. clic en "Buscar monitores"
     await page.screenshot({ path: `tmp-${w}.png`, fullPage: true });
   }
   await browser.close();
   ```

3. No commitees las capturas de este script ni el script mismo — es solo
   para tu propia revisión visual. Las capturas oficiales del repo
   (`capturas/`) las genera `verificar.cmd`.

## No toques

- El contenido de `contenido/*.md`, `contenido/convertir.js`, el esquema de
  Supabase (`supabase/`) ni la lógica de negocio en el `<script>` de
  `index.html` (diagnóstico, knowledge components, inserts a Supabase). Esta
  tarea es solo de layout/CSS (y HTML mínimo si hace falta un contenedor).
- Las reglas del producto listadas en `CLAUDE.md`: nada de `localStorage`,
  el pie "Prototipo · datos de ejemplo" visible en todas las pantallas,
  áreas táctiles de 44px o más (no las reduzcas al meter grids), sin
  degradados ni iconos decorativos.
- El comportamiento a 390×844: es lo único que el arnés verifica hoy, y es
  el tamaño con el que el equipo probó todo el producto.

## Definición de hecho

- [ ] Las pantallas del alcance (mínimo: `s-inicio`, `s-buscar`,
      `s-monitores`) muestran un layout distinto y con sentido a 768px y a
      1024px+ — no la misma columna vertical escalada.
- [ ] A 390px (mobile) nada cambió visualmente respecto a antes de esta
      tarea.
- [ ] `verificar.cmd` sigue en verde, mismo número de comprobaciones que
      antes de empezar.
- [ ] Capturas de revisión (a 390/768/1440px) de cada pantalla tocada,
      compartidas con el equipo para aprobar el diseño antes de dar la
      tarea por cerrada — no hay un mockup previo aprobado, así que las
      decisiones de layout las toma quien ejecuta esta tarea y las valida
      el equipo al final, no antes.
- [ ] Si se tocó alguna pantalla fuera del alcance recomendado, está
      anotado en este mismo archivo, en una sección "Pantallas adicionales
      cubiertas".
