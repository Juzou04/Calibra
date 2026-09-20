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

---

## Pantallas adicionales cubiertas (20 de septiembre de 2026)

Rama `juzou-prueba-diseno`, commit `3638e5e`. Se cubrieron las 15 y no solo las
tres del alcance recomendado, porque el patrón resultó ser uno y se aplica con
CSS sin tocar el DOM ni el motor.

Los puntos 1 y 2 de esta tarea (materias en rejilla, `.lista-monitores` en
rejilla) ya estaban hechos en el bloque 38 de `index.html`. Lo que faltaba era
decidir qué poner en el espacio sobrante. Tres bloques nuevos, todos dentro de
`@media (min-width:1200px) and (min-height:561px)`:

- Bloque 39, el escritorio y la hoja. `body` toma un tono propio
  (`--escritorio`), `.screen` conserva `--bg` y gana borde y sombra. Sin eso la
  columna no tiene canto y el margen parece un error de maquetación. Encima va
  un carril fijo con la marca, el paso del flujo y la nota del prototipo; su
  estado sale de `:has()` y no usa JS.
- Bloque 40, la segunda columna, pantalla por pantalla. Solo reagrupa hermanos
  que ya existían en el DOM.
- Bloque 41, los remates que salieron al mirar las capturas.

El punto 3 del alcance pedía evaluar si valía el riesgo tocar `s-prueba` y
`s-certificacion`. Sí valía: el riesgo era el oráculo del arnés, y el arnés
corre a 390×844, donde estos bloques no existen. Las 428 comprobaciones dan lo
mismo que antes de empezar.

El punto 4, `s-crear-perfil` a dos columnas, no se hizo. Partir en dos un
formulario de 8 campos cambia el orden en que se llena, y eso lo decide el
equipo. Queda a una columna, como estaba.

### Verificación hecha

- `verificar.cmd` completo antes y después: 428 comprobaciones, 419 OK, 9
  fallas en las dos corridas. Las 9 vienen de antes (8 de knowledge components
  y 1 de red por los 404 de Supabase). Se confirmó corriendo `--solo=kc` sobre
  `juzou` en un worktree aparte antes de tocar nada.
- Las 15 pantallas recorridas por el flujo real, no por hash, que
  `hashPermitido()` bloquea. A 390×844, 844×390, 1024, 1199, 1200, 1280, 1366,
  1440, 1536, 1600, 1920 y 2560: ningún elemento fuera del viewport ni de la
  hoja, `scrollWidth == clientWidth`, cero errores de consola.
- A 390×844, 24 de las 30 capturas salen idénticas byte a byte. Las otras 6 son
  ruido del arnés: dos corridas seguidas sobre el mismo archivo sin tocar dan
  también 6 distintas, y no son las mismas seis.
- Peso: 15.276 bytes crudos más (+4,6 %) y 5.223 con brotli (+7,5 %), de 69.330
  a 74.553. Cero peticiones nuevas, cero imágenes, cero JS.

### Trampas que conviene no olvidar

1. El guardián `min-height:561px` de los tres bloques no es opcional. El bloque
   `(max-height:560px) and (min-width:600px)` de la línea ~1222 pisa `--col`
   para el teléfono en horizontal y está más arriba en el mismo archivo.
2. Convertir un `.body` en `grid` convierte sus `::before`/`::after` en celdas
   de la rejilla. Hay que apagarlos y centrar con `align-content`.
3. `display:grid` con selector de id sobre una `.screen` no la resucita, porque
   `[hidden]{display:none !important}` de la línea 66 gana por `!important`. Si
   alguien quita ese `!important`, las 15 pantallas se ven a la vez en
   escritorio y el arnés no lo atrapa, porque solo mide a 390.
4. El carril se apaga con `display:none`. Aparcarlo con
   `transform:translateX(-100%)` rompería el chequeo `desbordes` en las 29
   pantallas auditadas.
