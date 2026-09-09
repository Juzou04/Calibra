/*
 * verificar.js — arnes de verificacion del prototipo Calibra
 *
 * Recorre el prototipo con Playwright (Chromium), toma capturas de las dos
 * rutas completas y ejecuta aserciones automaticas de layout, accesibilidad,
 * logica del diagnostico y robustez.
 *
 * Uso:
 *   verificar.cmd                 (define NODE_PATH y ejecuta este archivo)
 *   verificar.cmd --headed        (abre el navegador visible)
 *   verificar.cmd --solo=logica   (bloques: capturas, logica, monitor, robustez, fuente)
 *
 * Requisitos ya verificados del entorno:
 *   - playwright 1.61.1 instalado GLOBALMENTE, se resuelve via NODE_PATH.
 *   - solo hay Chromium descargado.
 *   - no existe @playwright/test: no se usa el test runner.
 *
 * Sale con codigo 1 si algo falla, 0 si todo pasa.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

// ---------------------------------------------------------------------------
// 0. Rutas y configuracion
// ---------------------------------------------------------------------------

const RAIZ = __dirname;
const INDEX = path.join(RAIZ, 'index.html');
const DIR_CAPTURAS = path.join(RAIZ, 'capturas');
const DIR_EST = path.join(DIR_CAPTURAS, 'estudiante');
const DIR_MON = path.join(DIR_CAPTURAS, 'monitor');
const RUTA_REPORTE = path.join(DIR_CAPTURAS, 'reporte.json');
const RUTA_SHEET = path.join(DIR_CAPTURAS, 'contact-sheet.html');

const ARGS = process.argv.slice(2);
const HEADED = ARGS.includes('--headed');
const SOLO = (() => {
  const a = ARGS.find((x) => x.startsWith('--solo='));
  if (!a) return null;
  return a.slice('--solo='.length).split(',').map((s) => s.trim()).filter(Boolean);
})();

const TIEMPO = 8000; // timeout por defecto de las esperas

const HOSTS_FUENTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ---------------------------------------------------------------------------
// 1. Textos oraculo (literales del brief, con tildes correctas)
// ---------------------------------------------------------------------------

const ERR_PARTES_P1 = 'eliges u por orden de aparición, no por prioridad ILATE';
const ERR_PARTES_P4 = 'te equivocas en el signo de la fórmula de partes';
const ERR_SUSTITUCION = 'no reconoces que 2x es la derivada de x²';
const ERR_IMPROPIAS = 'la confundes con 1/x, que sí diverge';
const SIN_FALLOS = 'Vas bien. Refuerza este subtema antes del parcial.';

const TXT_CERTIFICADO = 'Certificado en Cálculo Integral';
const TXT_NO_CERTIFICADO = 'Todavía no. Puedes reintentar en 7 días.';
const TXT_PIE = 'Prototipo · datos de ejemplo';

// Letras del banco: correcta / incorrecta canonica por pregunta.
// P1 correcta B (incorrecta A), P2 correcta B (incorrecta A),
// P3 correcta A (incorrecta B), P4 correcta A (incorrecta B).
const LETRA_CORRECTA = ['B', 'B', 'A', 'A'];
const LETRA_INCORRECTA = ['A', 'A', 'B', 'B'];

// Orden de lectura de porcentajes: partes, sustitucion, impropias.
const ORACULO = {
  FFFF: { pct: [34, 34, 34], debil: 'partes', error: ERR_PARTES_P1 },
  FFFV: { pct: [61, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  FFVF: { pct: [34, 34, 82], debil: 'partes', error: ERR_PARTES_P1 },
  FFVV: { pct: [61, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  FVFF: { pct: [34, 82, 34], debil: 'partes', error: ERR_PARTES_P1 },
  FVFV: { pct: [61, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  FVVF: { pct: [34, 82, 82], debil: 'partes', error: ERR_PARTES_P1 },
  FVVV: { pct: [61, 82, 82], debil: 'partes', error: ERR_PARTES_P1 },
  VFFF: { pct: [61, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFFV: { pct: [82, 34, 34], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFVF: { pct: [61, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VFVV: { pct: [82, 34, 82], debil: 'sustitucion', error: ERR_SUSTITUCION },
  VVFF: { pct: [61, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  VVFV: { pct: [82, 82, 34], debil: 'impropias', error: ERR_IMPROPIAS },
  VVVF: { pct: [61, 82, 82], debil: 'partes', error: ERR_PARTES_P4 },
  VVVV: { pct: [82, 82, 82], debil: 'partes', error: SIN_FALLOS },
};

// Combinacion usada para las capturas del flujo del estudiante:
// deja el punto debil en integracion por partes, que es la historia del brief.
const COMBO_CAPTURA = 'FVVV';

// ---------------------------------------------------------------------------
// 2. Acumulador de resultados
// ---------------------------------------------------------------------------

const reporte = {
  generado: new Date().toISOString(),
  base: null,
  bloques: [],
  consola: [],
  red: [],
  capturas: [],
  resumen: { total: 0, ok: 0, fallas: 0 },
};

let bloqueActual = null;
let contexto = 'arranque'; // para atribuir errores de consola a una pantalla

function abrirBloque(nombre) {
  bloqueActual = { nombre, comprobaciones: [] };
  reporte.bloques.push(bloqueActual);
  linea('');
  linea('== ' + nombre.toUpperCase() + ' ==');
}

function registrar(nombre, ok, detalle, datos) {
  if (!bloqueActual) abrirBloque('general');
  const c = { nombre, ok: !!ok, detalle: detalle || '' };
  if (datos !== undefined) c.datos = datos;
  bloqueActual.comprobaciones.push(c);
  reporte.resumen.total += 1;
  if (ok) reporte.resumen.ok += 1;
  else reporte.resumen.fallas += 1;
  const marca = ok ? 'OK   ' : 'FALLA';
  linea('  ' + marca + ' ' + nombre + (detalle ? ' -> ' + detalle : ''));
}

function linea(txt) {
  process.stdout.write(txt + '\n');
}

// ---------------------------------------------------------------------------
// 3. Servidor estatico minimo (sin dependencias)
// ---------------------------------------------------------------------------

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function crearServidor(raiz) {
  return new Promise((resolver, rechazar) => {
    const servidor = http.createServer((req, res) => {
      let ruta;
      try {
        ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname || '/');
      } catch (e) {
        res.writeHead(400).end('URL invalida');
        return;
      }
      if (ruta === '/favicon.ico') {
        // Evita un 404 de ruido en el bloque de red.
        res.writeHead(204).end();
        return;
      }
      if (ruta === '/') ruta = '/index.html';
      const destino = path.normalize(path.join(raiz, ruta));
      if (!destino.startsWith(raiz)) {
        res.writeHead(403).end('Fuera de la raiz');
        return;
      }
      fs.readFile(destino, (err, datos) => {
        if (err) {
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          res.end('No encontrado: ' + ruta);
          return;
        }
        res.writeHead(200, {
          'content-type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        res.end(datos);
      });
    });
    servidor.on('error', rechazar);
    servidor.listen(0, '127.0.0.1', () => {
      resolver({ servidor, puerto: servidor.address().port });
    });
  });
}

// ---------------------------------------------------------------------------
// 4. Utilidades de texto
// ---------------------------------------------------------------------------

function normalizarEspacios(s) {
  return String(s == null ? '' : s)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Equivalencias tipograficas aceptadas al comparar (NO toca tildes).
function normalizarMatematicas(s) {
  return normalizarEspacios(s)
    .replace(/x\s*\^\s*2/gi, 'x²')
    .replace(/x2(?![0-9])/g, 'x²')
    .replace(/\u00b7/g, '·')
    .replace(/\u2212/g, '-');
}

// Comparacion robusta: normaliza espacios y simbolos, ignora mayusculas,
// pero conserva las tildes. Comprueba inclusion del texto esperado.
function contieneTexto(actual, esperado) {
  const a = normalizarMatematicas(actual).toLowerCase();
  const e = normalizarMatematicas(esperado).toLowerCase().replace(/\.$/, '');
  return a.indexOf(e) !== -1;
}

function claveSubtema(nombreVisible) {
  const t = normalizarEspacios(nombreVisible)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (t.indexOf('parte') !== -1) return 'partes';
  if (t.indexOf('sustitu') !== -1) return 'sustitucion';
  if (t.indexOf('impropia') !== -1) return 'impropias';
  return null;
}

// ---------------------------------------------------------------------------
// 5. Auditoria en pagina (layout, tactil, tipografia, pie, comision, contraste)
// ---------------------------------------------------------------------------

function fnAuditoria(opciones) {
  const TXT_PIE = opciones.pie;

  function ruta(el) {
    const partes = [];
    let n = el;
    for (let i = 0; n && n.nodeType === 1 && i < 4; i += 1) {
      let s = n.tagName.toLowerCase();
      if (n.id) {
        partes.unshift(s + '#' + n.id);
        break;
      }
      if (n.classList && n.classList.length) {
        s += '.' + Array.prototype.slice.call(n.classList, 0, 2).join('.');
      }
      partes.unshift(s);
      n = n.parentElement;
    }
    return partes.join(' > ');
  }

  function esVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    return true;
  }

  function dentroDeScrollHorizontal(el) {
    let n = el.parentElement;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') return true;
      n = n.parentElement;
    }
    return false;
  }

  function parseColor(str) {
    if (!str) return null;
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(function (v) { return Number.isNaN(v); })) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function componer(arriba, abajo) {
    const a = arriba.a;
    return {
      r: arriba.r * a + abajo.r * (1 - a),
      g: arriba.g * a + abajo.g * (1 - a),
      b: arriba.b * a + abajo.b * (1 - a),
      a: 1,
    };
  }

  function fondoEfectivo(el) {
    const pila = [];
    let n = el;
    let imagen = false;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') imagen = true;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        pila.push(c);
        if (c.a >= 1) break;
      }
      n = n.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = pila.length - 1; i >= 0; i -= 1) base = componer(pila[i], base);
    return { color: base, imagen: imagen };
  }

  function luminancia(c) {
    const f = function (v) {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function contraste(a, b) {
    const l1 = luminancia(a);
    const l2 = luminancia(b);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function tieneTextoDirecto(el) {
    for (let i = 0; i < el.childNodes.length; i += 1) {
      const n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim().length) return true;
    }
    return false;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const de = document.documentElement;
  const todos = Array.prototype.slice.call(document.body.querySelectorAll('*'));
  const visibles = todos.filter(esVisible);

  // -- scroll horizontal ----------------------------------------------------
  const scrollHorizontal = {
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    ok: de.scrollWidth <= de.clientWidth + 1,
  };

  // -- desbordes laterales --------------------------------------------------
  const desbordes = [];
  visibles.forEach(function (el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (dentroDeScrollHorizontal(el)) return;
    if (r.right > vw + 1 || r.left < -1) {
      desbordes.push({
        selector: ruta(el),
        izquierda: Math.round(r.left * 10) / 10,
        derecha: Math.round(r.right * 10) / 10,
        ancho: Math.round(r.width * 10) / 10,
      });
    }
  });

  // -- areas tactiles -------------------------------------------------------
  const SEL_TACTIL = 'button, a, input, label.opt, label.slot, [role="button"], select, textarea';
  const areasTactiles = [];
  Array.prototype.slice.call(document.body.querySelectorAll(SEL_TACTIL)).forEach(function (el) {
    if (el.type === 'hidden') return;
    if (!esVisible(el)) return;
    // Un input envuelto por un label.opt/.slot ya se mide en la etiqueta.
    if (el.tagName === 'INPUT' && el.closest('label.opt, label.slot')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) {
      areasTactiles.push({
        selector: ruta(el),
        ancho: Math.round(r.width * 10) / 10,
        alto: Math.round(r.height * 10) / 10,
        texto: (el.textContent || el.value || '').trim().slice(0, 40),
      });
    }
  });

  // -- tipografia -----------------------------------------------------------
  const tipografia = [];
  visibles.forEach(function (el) {
    const esCampo = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName);
    if (!esCampo && !tieneTextoDirecto(el)) return;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    if (!Number.isNaN(px) && px < 13.995) {
      tipografia.push({
        selector: ruta(el),
        fontSize: Math.round(px * 100) / 100,
        texto: (el.textContent || '').trim().slice(0, 40),
      });
    }
  });

  // -- pie del prototipo ----------------------------------------------------
  const textoVisible = (document.body.innerText || '').replace(/\u00a0/g, ' ');
  const pieNormal = TXT_PIE.replace(/\s+/g, ' ');
  const pieEncontrado = textoVisible.replace(/\s+/g, ' ').indexOf(pieNormal) !== -1;
  let pieElemento = null;
  visibles.forEach(function (el) {
    if (pieElemento) return;
    if (!tieneTextoDirecto(el)) return;
    if ((el.textContent || '').replace(/\s+/g, ' ').indexOf(pieNormal) !== -1) pieElemento = ruta(el);
  });

  // -- sin comision ---------------------------------------------------------
  const plano = textoVisible.replace(/\s+/g, ' ');
  const patrones = [
    /\d+(?:[.,]\d+)?\s*%[^.]{0,60}?comisi[oó]n/i,
    /comisi[oó]n[^.]{0,60}?\d+(?:[.,]\d+)?\s*%/i,
  ];
  const comision = [];
  patrones.forEach(function (re) {
    const m = plano.match(re);
    if (m) comision.push(m[0]);
  });

  // -- contraste ------------------------------------------------------------
  const contrasteFallas = [];
  const vistos = {};
  visibles.forEach(function (el) {
    if (!tieneTextoDirecto(el)) return;
    const cs = getComputedStyle(el);
    const color = parseColor(cs.color);
    if (!color || color.a === 0) return;
    const fondo = fondoEfectivo(el);
    const primerPlano = color.a < 1 ? componer(color, fondo.color) : color;
    const px = parseFloat(cs.fontSize);
    const peso = parseInt(cs.fontWeight, 10) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const umbral = grande ? 3 : 4.5;
    const ratio = contraste(primerPlano, fondo.color);
    const clave = cs.color + '|' + Math.round(fondo.color.r) + ',' + Math.round(fondo.color.g) + ',' + Math.round(fondo.color.b) + '|' + umbral;
    if (ratio + 0.005 < umbral && !vistos[clave]) {
      vistos[clave] = true;
      contrasteFallas.push({
        selector: ruta(el),
        texto: (el.textContent || '').trim().slice(0, 40),
        color: cs.color,
        fondo: 'rgb(' + Math.round(fondo.color.r) + ', ' + Math.round(fondo.color.g) + ', ' + Math.round(fondo.color.b) + ')',
        fondoConImagen: fondo.imagen,
        fontSize: Math.round(px * 100) / 100,
        peso: peso,
        umbral: umbral,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  });

  // -- secciones visibles ---------------------------------------------------
  const seccionesVisibles = Array.prototype.slice
    .call(document.querySelectorAll('section.screen'))
    .filter(esVisible)
    .map(function (s) { return s.id; });

  return {
    viewport: { ancho: vw, alto: vh },
    scrollHorizontal: scrollHorizontal,
    desbordes: desbordes,
    areasTactiles: areasTactiles,
    tipografia: tipografia,
    pie: { encontrado: pieEncontrado, selector: pieElemento },
    comision: comision,
    contraste: contrasteFallas,
    seccionesVisibles: seccionesVisibles,
  };
}

async function auditarPantalla(page, etiqueta) {
  const r = await page.evaluate(fnAuditoria, { pie: TXT_PIE });

  registrar(
    etiqueta + ' · scrollHorizontal',
    r.scrollHorizontal.ok,
    r.scrollHorizontal.ok ? '' : 'scrollWidth ' + r.scrollHorizontal.scrollWidth + ' > clientWidth ' + r.scrollHorizontal.clientWidth,
    r.scrollHorizontal
  );

  registrar(
    etiqueta + ' · desbordes',
    r.desbordes.length === 0,
    r.desbordes.length === 0
      ? ''
      : r.desbordes.length + ' elemento(s) fuera del viewport: ' + r.desbordes.slice(0, 3).map((d) => d.selector + ' [' + d.izquierda + '..' + d.derecha + ']').join('; '),
    r.desbordes
  );

  registrar(
    etiqueta + ' · areasTactiles',
    r.areasTactiles.length === 0,
    r.areasTactiles.length === 0
      ? ''
      : r.areasTactiles.length + ' por debajo de 44x44: ' + r.areasTactiles.slice(0, 3).map((a) => a.selector + ' (' + a.ancho + 'x' + a.alto + ')').join('; '),
    r.areasTactiles
  );

  registrar(
    etiqueta + ' · tipografia',
    r.tipografia.length === 0,
    r.tipografia.length === 0
      ? ''
      : r.tipografia.length + ' por debajo de 14px: ' + r.tipografia.slice(0, 3).map((t) => t.selector + ' (' + t.fontSize + 'px)').join('; '),
    r.tipografia
  );

  registrar(
    etiqueta + ' · pieProtitipo',
    r.pie.encontrado,
    r.pie.encontrado ? r.pie.selector || '' : 'no aparece visible el texto "' + TXT_PIE + '"',
    r.pie
  );

  registrar(
    etiqueta + ' · sinComision',
    r.comision.length === 0,
    r.comision.length === 0 ? '' : 'aparece cifra de comision: ' + r.comision.join(' | '),
    r.comision
  );

  registrar(
    etiqueta + ' · contraste',
    r.contraste.length === 0,
    r.contraste.length === 0
      ? ''
      : r.contraste.length + ' par(es) por debajo del umbral: ' +
        r.contraste.slice(0, 3).map((c) => c.selector + ' ' + c.ratio + ':1 (min ' + c.umbral + ') ' + c.color + ' sobre ' + c.fondo).join('; '),
    r.contraste
  );

  registrar(
    etiqueta + ' · unaSolaPantalla',
    r.seccionesVisibles.length === 1,
    r.seccionesVisibles.length === 1 ? r.seccionesVisibles[0] : 'secciones visibles: [' + r.seccionesVisibles.join(', ') + ']',
    r.seccionesVisibles
  );

  return r;
}

// ---------------------------------------------------------------------------
// 6. Utilidades de navegacion sobre el prototipo
// ---------------------------------------------------------------------------

async function esperarPantalla(page, id, etiqueta) {
  try {
    await page.waitForSelector('#' + id, { state: 'visible', timeout: TIEMPO });
  } catch (e) {
    throw new Error(
      'No aparecio la pantalla #' + id + (etiqueta ? ' (' + etiqueta + ')' : '') +
      '. El contrato pide <section id="' + id + '" class="screen" hidden> y que el motor la muestre quitando .hidden.'
    );
  }
}

async function clic(page, selector, etiqueta) {
  const loc = page.locator(selector).first();
  try {
    await loc.waitFor({ state: 'visible', timeout: TIEMPO });
  } catch (e) {
    throw new Error('No encuentro el elemento clicable "' + selector + '"' + (etiqueta ? ' (' + etiqueta + ')' : '') + '.');
  }
  await loc.click();
}

async function irAInicio(page, base) {
  // goto sin hash fuerza recarga completa: el estado en memoria queda limpio.
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await esperarPantalla(page, 's-inicio', 'pantalla de arranque');
}

// Marca el elemento elegido con un atributo temporal y lo devuelve como
// selector. Evita componer selectores por concatenacion, que se rompe con
// listas separadas por coma.
const MARCA = 'data-arnes-objetivo';

async function limpiarMarca(page) {
  await page.evaluate((attr) => {
    Array.prototype.slice.call(document.querySelectorAll('[' + attr + ']')).forEach((n) => n.removeAttribute(attr));
  }, MARCA).catch(() => {});
}

async function elegirMateriaActiva(page, contenedor) {
  // La materia activa es el unico item de la lista sin .is-pronto.
  await limpiarMarca(page);
  const info = await page.evaluate(({ cont, attr }) => {
    const c = document.querySelector(cont);
    if (!c) return { error: 'no existe ' + cont };
    let nodos = Array.prototype.slice.call(c.querySelectorAll('.materia'));
    if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('li'));
    if (!nodos.length) return { error: 'la lista ' + cont + ' esta vacia' };
    let idx = nodos.findIndex((n) => !n.classList.contains('is-pronto') && !n.querySelector('.is-pronto'));
    if (idx < 0) idx = 0;
    nodos[idx].setAttribute(attr, '1');
    return { idx, total: nodos.length, texto: (nodos[idx].textContent || '').trim().slice(0, 60) };
  }, { cont: contenedor, attr: MARCA });
  if (info.error) return info; // no es fatal: puede que la lista no sea clicable
  try {
    await page.locator('[' + MARCA + '="1"]').first().click({ timeout: 2500 });
  } catch (e) {
    // La materia puede no ser interactiva; entonces manda el boton principal.
  }
  await limpiarMarca(page);
  return info;
}

async function elegirOpcion(page, contenedor, letra, etiqueta) {
  await limpiarMarca(page);
  const info = await page.evaluate(({ cont, l, attr }) => {
    const c = document.querySelector(cont);
    if (!c) return { error: 'no existe el contenedor ' + cont };
    let nodos = Array.prototype.slice.call(c.querySelectorAll('.opt'));
    if (!nodos.length) nodos = Array.prototype.slice.call(c.querySelectorAll('li'));
    if (!nodos.length) return { error: 'no hay opciones dentro de ' + cont };
    const idxLetra = nodos.findIndex((n) => {
      const k = n.querySelector('.key');
      if (!k) return false;
      return (k.textContent || '').trim().toUpperCase().replace(/[^A-D]/g, '') === l;
    });
    const idx = idxLetra >= 0 ? idxLetra : 'ABCD'.indexOf(l);
    if (idx < 0 || idx >= nodos.length) return { error: 'no encuentro la opcion ' + l + ' en ' + cont };
    nodos[idx].setAttribute(attr, '1');
    return { idx, total: nodos.length, porLetra: idxLetra >= 0, texto: (nodos[idx].textContent || '').trim().slice(0, 60) };
  }, { cont: contenedor, l: letra, attr: MARCA });
  if (info.error) throw new Error('[' + etiqueta + '] ' + info.error);
  try {
    await page.locator('[' + MARCA + '="1"]').first().click();
  } catch (e) {
    throw new Error('[' + etiqueta + '] no pude pulsar la opcion ' + letra + ': ' + e.message);
  }
  await limpiarMarca(page);
  return info;
}

async function avanzarPregunta(page, cfg) {
  const antes = normalizarEspacios(await page.locator(cfg.enunciado).first().textContent());
  await clic(page, cfg.boton, cfg.etiqueta);
  try {
    await page.waitForFunction(
      ([selEnun, prev, selDestino]) => {
        const d = document.querySelector(selDestino);
        if (d && d.getClientRects().length) return true;
        const e = document.querySelector(selEnun);
        if (!e) return false;
        return e.textContent.replace(/\s+/g, ' ').trim() !== prev;
      },
      [cfg.enunciado, antes, cfg.destino],
      { timeout: TIEMPO }
    );
  } catch (e) {
    throw new Error(
      '[' + cfg.etiqueta + '] tras pulsar ' + cfg.boton + ' ni cambio el enunciado ni aparecio ' + cfg.destino + '.'
    );
  }
}

async function responderPrueba(page, patron) {
  // patron: cadena de 4 (o 3) caracteres V/F
  for (let i = 0; i < patron.length; i += 1) {
    const letra = patron[i] === 'V' ? LETRA_CORRECTA[i] : LETRA_INCORRECTA[i];
    await elegirOpcion(page, '#prueba-opciones', letra, 'E2 pregunta ' + (i + 1));
    await avanzarPregunta(page, {
      enunciado: '#prueba-enunciado',
      boton: '#prueba-siguiente',
      destino: '#s-diagnostico',
      etiqueta: 'E2 pregunta ' + (i + 1),
    });
  }
}

async function responderCertificacion(page, patron) {
  for (let i = 0; i < patron.length; i += 1) {
    const letra = patron[i] === 'V' ? LETRA_CORRECTA[i] : LETRA_INCORRECTA[i];
    await elegirOpcion(page, '#cert-opciones', letra, 'M3 pregunta ' + (i + 1));
    await avanzarPregunta(page, {
      enunciado: '#cert-enunciado',
      boton: '#cert-siguiente',
      destino: '#s-monitor-resultado',
      etiqueta: 'M3 pregunta ' + (i + 1),
    });
  }
}

async function entrarAPrueba(page) {
  await elegirMateriaActiva(page, '#lista-materias');
  await clic(page, '#s-inicio [data-ir="prueba"]', 'boton Empezar la prueba (E1)');
  await esperarPantalla(page, 's-prueba', 'E2');
}

async function entrarACertificacion(page, base) {
  await irAInicio(page, base);
  await clic(page, '#s-inicio [data-ir="monitor"]', 'enlace Soy monitor (E1)');
  await esperarPantalla(page, 's-monitor', 'M1');
  await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'boton de M1 hacia M2');
  await esperarPantalla(page, 's-monitor-materia', 'M2');
  await elegirMateriaActiva(page, '#s-monitor-materia .materias, #s-monitor-materia ul');
  await clic(page, '#s-monitor-materia [data-ir="certificacion"]', 'boton de M2 hacia M3');
  await esperarPantalla(page, 's-certificacion', 'M3');
}

async function leerDiagnostico(page) {
  return page.evaluate(() => {
    const cont = document.querySelector('#diag-barras');
    if (!cont) return { fallo: 'falta el elemento #diag-barras que exige el contrato' };
    const filas = Array.prototype.slice.call(cont.querySelectorAll('li'));
    const barras = filas.map((li) => {
      const n = li.querySelector('.bar-name');
      const p = li.querySelector('.bar-pct');
      return {
        nombre: n ? n.textContent.trim() : (li.textContent || '').trim(),
        pct: p ? parseInt(String(p.textContent).replace(/[^0-9]/g, ''), 10) : null,
        debil: li.classList.contains('is-weak'),
      };
    });
    const t = document.querySelector('#diag-debil-titulo');
    const e = document.querySelector('#diag-debil-error');
    return {
      barras,
      titulo: t ? t.textContent.replace(/\s+/g, ' ').trim() : null,
      error: e ? e.textContent.replace(/\s+/g, ' ').trim() : null,
      faltaTitulo: !t,
      faltaError: !e,
    };
  });
}

async function capturar(page, dir, nombre, etiqueta) {
  const destino = path.join(dir, nombre);
  await page.screenshot({ path: destino, fullPage: false });
  reporte.capturas.push({
    archivo: path.relative(DIR_CAPTURAS, destino).split(path.sep).join('/'),
    etiqueta: etiqueta || nombre,
  });
  return destino;
}

// ---------------------------------------------------------------------------
// 7. Bloques de verificacion
// ---------------------------------------------------------------------------

async function bloqueFuente() {
  abrirBloque('Codigo fuente');
  const fuente = fs.readFileSync(INDEX, 'utf8');

  const usaLocal = /\blocalStorage\b/.test(fuente);
  const usaSesion = /\bsessionStorage\b/.test(fuente);
  registrar(
    'almacenamiento · sin localStorage ni sessionStorage',
    !usaLocal && !usaSesion,
    !usaLocal && !usaSesion ? '' : 'el fuente menciona ' + [usaLocal ? 'localStorage' : null, usaSesion ? 'sessionStorage' : null].filter(Boolean).join(' y ')
  );

  const secciones = [
    's-inicio', 's-prueba', 's-diagnostico', 's-monitores', 's-perfil', 's-confirmacion',
    's-monitor', 's-monitor-materia', 's-certificacion', 's-monitor-resultado', 's-panel', 's-profesor',
  ];
  const faltan = secciones.filter((id) => fuente.indexOf('id="' + id + '"') === -1 && fuente.indexOf("id='" + id + "'") === -1);
  registrar(
    'contrato · las 12 secciones existen',
    faltan.length === 0,
    faltan.length === 0 ? '' : 'faltan: ' + faltan.join(', ')
  );

  const ids = [
    'lista-materias', 'prueba-contador', 'prueba-track', 'prueba-track-fill', 'prueba-topic',
    'prueba-enunciado', 'prueba-opciones', 'prueba-siguiente', 'diag-barras', 'diag-debil-titulo',
    'diag-debil-error', 'lista-monitores', 'perfil-contenido', 'confirmacion-resumen',
    'cert-contador', 'cert-track', 'cert-track-fill', 'cert-topic', 'cert-enunciado', 'cert-opciones',
    'cert-siguiente', 'cert-resultado', 'panel-contenido', 'btn-reiniciar',
  ];
  const faltanIds = ids.filter((id) => fuente.indexOf('id="' + id + '"') === -1 && fuente.indexOf("id='" + id + "'") === -1);
  registrar(
    'contrato · ids que rellena el motor',
    faltanIds.length === 0,
    faltanIds.length === 0 ? '' : 'faltan: ' + faltanIds.join(', ')
  );

  const capturas = (fuente.match(/class="captura"/g) || []).length + (fuente.match(/class='captura'/g) || []).length;
  registrar(
    'contrato · tres formularios .captura',
    capturas >= 3,
    'encontrados: ' + capturas + ' (esperados 3: estudiante, monitor, profesor)'
  );
}

async function bloqueCapturas(page, base) {
  abrirBloque('Capturas y auditoria por pantalla');

  // ---------------- Flujo del estudiante ----------------
  contexto = 'E1 inicio';
  await irAInicio(page, base);
  await auditarPantalla(page, 'e-01-inicio');
  await capturar(page, DIR_EST, 'e-01-inicio.png', 'E1 · Inicio');

  contexto = 'E2 prueba';
  await elegirMateriaActiva(page, '#lista-materias');
  await clic(page, '#s-inicio [data-ir="prueba"]', 'boton Empezar la prueba (E1)');
  await esperarPantalla(page, 's-prueba', 'E2');

  const desactivado = await page.locator('#prueba-siguiente').first().isDisabled().catch(() => null);
  registrar(
    'E2 · Siguiente deshabilitado hasta elegir',
    desactivado === true,
    desactivado === true ? '' : 'el boton #prueba-siguiente no esta deshabilitado al entrar a la pregunta 1'
  );

  for (let i = 0; i < COMBO_CAPTURA.length; i += 1) {
    const n = i + 1;
    contexto = 'E2 pregunta ' + n;
    await auditarPantalla(page, 'e-0' + (n + 1) + '-pregunta-' + n);
    await capturar(page, DIR_EST, 'e-0' + (n + 1) + '-pregunta-' + n + '.png', 'E2 · Pregunta ' + n);
    const letra = COMBO_CAPTURA[i] === 'V' ? LETRA_CORRECTA[i] : LETRA_INCORRECTA[i];
    await elegirOpcion(page, '#prueba-opciones', letra, 'E2 pregunta ' + n);
    await avanzarPregunta(page, {
      enunciado: '#prueba-enunciado',
      boton: '#prueba-siguiente',
      destino: '#s-diagnostico',
      etiqueta: 'E2 pregunta ' + n,
    });
  }

  contexto = 'E3 diagnostico';
  await esperarPantalla(page, 's-diagnostico', 'E3');
  await auditarPantalla(page, 'e-06-diagnostico');
  await capturar(page, DIR_EST, 'e-06-diagnostico.png', 'E3 · Diagnostico');

  contexto = 'E4 monitores';
  await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores (E3)');
  await esperarPantalla(page, 's-monitores', 'E4');
  await auditarPantalla(page, 'e-07-monitores');
  await capturar(page, DIR_EST, 'e-07-monitores.png', 'E4 · Monitores');

  contexto = 'E5 perfil';
  await clic(page, '#lista-monitores [data-ir="perfil"], #s-monitores [data-ir="perfil"]', 'tarjeta de monitor (E4)');
  await esperarPantalla(page, 's-perfil', 'E5');
  await auditarPantalla(page, 'e-08-perfil');
  await capturar(page, DIR_EST, 'e-08-perfil.png', 'E5 · Perfil y agendar');

  contexto = 'E6 confirmacion';
  // Un horario puede ser obligatorio antes de agendar.
  const hayHorario = await page.locator('#s-perfil .slot').count().catch(() => 0);
  if (hayHorario) await page.locator('#s-perfil .slot').first().click().catch(() => {});
  await clic(page, '#s-perfil [data-ir="confirmacion"]', 'boton Agendar y pagar (E5)');
  await esperarPantalla(page, 's-confirmacion', 'E6');
  await auditarPantalla(page, 'e-09-confirmacion');
  await capturar(page, DIR_EST, 'e-09-confirmacion.png', 'E6 · Confirmacion');

  contexto = 'E6 captura de correo';
  await enviarCorreo(page, '#s-confirmacion form.captura', 'juan.demo@uniandes.edu.co');
  await capturar(page, DIR_EST, 'e-10-confirmacion-gracias.png', 'E6 · Agradecimiento');
  await auditarPantalla(page, 'e-10-confirmacion-gracias');

  // ---------------- Canal profesor ----------------
  contexto = 'P1 profesor';
  await irAInicio(page, base);
  const hayEnlaceProfesor = await page.locator('#s-inicio [data-ir="profesor"]').count();
  if (hayEnlaceProfesor) {
    await clic(page, '#s-inicio [data-ir="profesor"]', 'enlace Soy profesor (E1)');
  } else {
    await page.goto(base + '#profesor', { waitUntil: 'domcontentloaded' });
  }
  registrar(
    'P1 · enlace "Soy profesor" en E1',
    hayEnlaceProfesor > 0,
    hayEnlaceProfesor > 0 ? '' : 'no hay [data-ir="profesor"] en #s-inicio; se llego por hash'
  );
  await esperarPantalla(page, 's-profesor', 'P1');
  await auditarPantalla(page, 'e-11-profesor');
  await capturar(page, DIR_EST, 'e-11-profesor.png', 'P1 · Profesor');

  // ---------------- Flujo del monitor ----------------
  contexto = 'M1 inicio monitor';
  await irAInicio(page, base);
  await clic(page, '#s-inicio [data-ir="monitor"]', 'enlace Soy monitor (E1)');
  await esperarPantalla(page, 's-monitor', 'M1');
  await auditarPantalla(page, 'm-01-inicio');
  await capturar(page, DIR_MON, 'm-01-inicio.png', 'M1 · Inicio monitor');

  contexto = 'M2 materia monitor';
  await clic(page, '#s-monitor [data-ir="monitor-materia"]', 'boton de M1 hacia M2');
  await esperarPantalla(page, 's-monitor-materia', 'M2');
  await auditarPantalla(page, 'm-02-materia');
  await capturar(page, DIR_MON, 'm-02-materia.png', 'M2 · Materia');

  contexto = 'M3 certificacion';
  await elegirMateriaActiva(page, '#s-monitor-materia .materias, #s-monitor-materia ul');
  await clic(page, '#s-monitor-materia [data-ir="certificacion"]', 'boton de M2 hacia M3');
  await esperarPantalla(page, 's-certificacion', 'M3');

  for (let i = 0; i < 3; i += 1) {
    const n = i + 1;
    contexto = 'M3 pregunta ' + n;
    await auditarPantalla(page, 'm-0' + (n + 2) + '-pregunta-' + n);
    await capturar(page, DIR_MON, 'm-0' + (n + 2) + '-pregunta-' + n + '.png', 'M3 · Pregunta ' + n);
    await elegirOpcion(page, '#cert-opciones', LETRA_CORRECTA[i], 'M3 pregunta ' + n);
    await avanzarPregunta(page, {
      enunciado: '#cert-enunciado',
      boton: '#cert-siguiente',
      destino: '#s-monitor-resultado',
      etiqueta: 'M3 pregunta ' + n,
    });
  }

  contexto = 'M4 resultado certificado';
  await esperarPantalla(page, 's-monitor-resultado', 'M4');
  await auditarPantalla(page, 'm-06-resultado-certificado');
  await capturar(page, DIR_MON, 'm-06-resultado-certificado.png', 'M4 · Resultado certificado');

  contexto = 'M5 panel';
  await clic(page, '#s-monitor-resultado [data-ir="panel"]', 'boton de M4 hacia M5');
  await esperarPantalla(page, 's-panel', 'M5');
  await auditarPantalla(page, 'm-07-panel');
  await capturar(page, DIR_MON, 'm-07-panel.png', 'M5 · Panel del monitor');

  contexto = 'M5 captura de correo';
  await enviarCorreo(page, '#s-panel form.captura', 'daniela.demo@uniandes.edu.co');
  await capturar(page, DIR_MON, 'm-08-panel-gracias.png', 'M5 · Agradecimiento');
  await auditarPantalla(page, 'm-08-panel-gracias');

  contexto = 'M4 resultado no certificado';
  await entrarACertificacion(page, base);
  await responderCertificacion(page, 'FFV');
  await esperarPantalla(page, 's-monitor-resultado', 'M4 no certificado');
  await auditarPantalla(page, 'm-09-resultado-no-certificado');
  await capturar(page, DIR_MON, 'm-09-resultado-no-certificado.png', 'M4 · Resultado no certificado');
}

async function enviarCorreo(page, selectorForm, correo) {
  const form = page.locator(selectorForm).first();
  await form.waitFor({ state: 'visible', timeout: TIEMPO }).catch(() => {
    throw new Error('No encuentro el formulario ' + selectorForm + ' (contrato: form.captura con data-rol).');
  });
  await form.locator('input[type="email"]').first().fill(correo);
  await form.locator('button[type="submit"], button').first().click();
  await form.locator('.gracias').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
}

async function bloqueLogicaEstudiante(page, base) {
  abrirBloque('Logica del diagnostico · 16 combinaciones');
  const combos = Object.keys(ORACULO);
  for (const combo of combos) {
    contexto = 'combinacion ' + combo;
    const esperado = ORACULO[combo];
    try {
      await irAInicio(page, base);
      await entrarAPrueba(page);
      await responderPrueba(page, combo);
      await esperarPantalla(page, 's-diagnostico', 'E3 tras ' + combo);
      const d = await leerDiagnostico(page);
      if (d.fallo) throw new Error(d.fallo);

      const problemas = [];

      // Porcentajes por subtema
      const porClave = {};
      d.barras.forEach((b) => {
        const k = claveSubtema(b.nombre);
        if (k) porClave[k] = b.pct;
      });
      const obtenido = [porClave.partes, porClave.sustitucion, porClave.impropias];
      const faltantes = ['partes', 'sustitucion', 'impropias'].filter((k) => porClave[k] === undefined);
      if (faltantes.length) {
        problemas.push('no identifico las barras de: ' + faltantes.join(', ') + ' (nombres leidos: ' + d.barras.map((b) => b.nombre).join(' / ') + ')');
      } else if (obtenido.join(',') !== esperado.pct.join(',')) {
        problemas.push('porcentajes esperados ' + esperado.pct.join('/') + ' y obtenidos ' + obtenido.join('/') + ' (partes/sustitucion/impropias)');
      }

      // Subtema debil
      if (d.faltaTitulo) {
        problemas.push('falta #diag-debil-titulo');
      } else {
        const debil = claveSubtema(d.titulo);
        if (debil !== esperado.debil) {
          problemas.push('punto debil esperado "' + esperado.debil + '" y obtenido "' + (debil || '?') + '" en el texto: ' + d.titulo);
        }
      }
      // La barra marcada is-weak deberia coincidir con el punto debil
      const marcadas = d.barras.filter((b) => b.debil).map((b) => claveSubtema(b.nombre));
      if (marcadas.length === 1 && marcadas[0] !== esperado.debil) {
        problemas.push('la barra con .is-weak es "' + marcadas[0] + '" y deberia ser "' + esperado.debil + '"');
      }

      // Texto del error
      if (d.faltaError) {
        problemas.push('falta #diag-debil-error');
      } else if (!contieneTexto(d.error, esperado.error)) {
        problemas.push('error esperado "' + esperado.error + '" y obtenido "' + d.error + '"');
      }

      registrar(
        'combinacion ' + combo,
        problemas.length === 0,
        problemas.join(' | '),
        { esperado, obtenido: { barras: d.barras, titulo: d.titulo, error: d.error } }
      );
    } catch (e) {
      registrar('combinacion ' + combo, false, e.message);
    }
  }
}

async function bloqueLogicaMonitor(page, base) {
  abrirBloque('Logica de certificacion · 8 combinaciones');
  const combos = ['VVV', 'VVF', 'VFV', 'FVV', 'VFF', 'FVF', 'FFV', 'FFF'];
  for (const combo of combos) {
    contexto = 'certificacion ' + combo;
    const aciertos = combo.split('').filter((c) => c === 'V').length;
    const certifica = aciertos >= 2;
    try {
      await entrarACertificacion(page, base);
      await responderCertificacion(page, combo);
      await esperarPantalla(page, 's-monitor-resultado', 'M4 tras ' + combo);
      const texto = normalizarEspacios(await page.locator('#cert-resultado').first().textContent());
      const problemas = [];
      if (certifica) {
        if (!contieneTexto(texto, TXT_CERTIFICADO)) {
          problemas.push('esperaba "' + TXT_CERTIFICADO + '" y el resultado dice: ' + texto.slice(0, 160));
        }
        if (contieneTexto(texto, TXT_NO_CERTIFICADO)) {
          problemas.push('aparece el texto de no certificado en un caso que si certifica');
        }
      } else {
        if (!contieneTexto(texto, TXT_NO_CERTIFICADO)) {
          problemas.push('esperaba "' + TXT_NO_CERTIFICADO + '" y el resultado dice: ' + texto.slice(0, 160));
        }
        if (contieneTexto(texto, TXT_CERTIFICADO)) {
          problemas.push('aparece "Certificado" en un caso que no alcanza el umbral');
        }
      }
      registrar(
        'certificacion ' + combo + ' (' + aciertos + '/3, ' + (certifica ? 'certifica' : 'no certifica') + ')',
        problemas.length === 0,
        problemas.join(' | '),
        { texto: texto.slice(0, 300) }
      );
    } catch (e) {
      registrar('certificacion ' + combo, false, e.message);
    }
  }
}

async function bloqueRobustez(page, base, red) {
  abrirBloque('Robustez');

  // 1. #diagnostico sin estado
  contexto = 'robustez #diagnostico directo';
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.goto(base + '#diagnostico', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-inicio' && (est.hash === '' || est.hash === '#inicio');
    registrar(
      'abrir #diagnostico sin estado redirige a #inicio',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #diagnostico sin estado redirige a #inicio', false, e.message);
  }

  // 2. #panel sin estado
  contexto = 'robustez #panel directo';
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.goto(base + '#panel', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const ok = est.visibles.length === 1 && est.visibles[0] === 's-monitor' && (est.hash === '' || est.hash === '#monitor');
    registrar(
      'abrir #panel sin estado redirige a #monitor',
      ok,
      ok ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '"',
      est
    );
  } catch (e) {
    registrar('abrir #panel sin estado redirige a #monitor', false, e.message);
  }

  // 3. Reinicio deja el estado limpio
  contexto = 'robustez reinicio';
  try {
    await irAInicio(page, base);
    await entrarAPrueba(page);
    await responderPrueba(page, 'VVVV');
    await esperarPantalla(page, 's-diagnostico', 'E3 antes de reiniciar');
    await clic(page, '#btn-reiniciar', 'boton de reinicio global');
    await page.waitForTimeout(300);
    const tras = await estadoPantallas(page);
    const volvioAInicio = tras.visibles.length === 1 && tras.visibles[0] === 's-inicio';
    registrar(
      'el boton de reinicio vuelve a #inicio',
      volvioAInicio,
      volvioAInicio ? '' : 'visibles: [' + tras.visibles.join(', ') + ']',
      tras
    );

    // Sin recargar: el diagnostico ya no deberia ser alcanzable
    await page.evaluate(() => { window.location.hash = '#diagnostico'; });
    await page.waitForTimeout(300);
    const est = await estadoPantallas(page);
    const limpio = est.visibles.length === 1 && est.visibles[0] === 's-inicio';
    registrar(
      'tras reiniciar, #diagnostico vuelve a redirigir',
      limpio,
      limpio ? '' : 'visibles: [' + est.visibles.join(', ') + '] hash: "' + est.hash + '" (el estado no quedo limpio)',
      est
    );
  } catch (e) {
    registrar('el boton de reinicio deja el estado limpio', false, e.message);
  }

  // 4. Boton atras a mitad de la prueba
  contexto = 'robustez boton atras';
  try {
    await irAInicio(page, base);
    await entrarAPrueba(page);
    await elegirOpcion(page, '#prueba-opciones', LETRA_CORRECTA[0], 'E2 pregunta 1 (atras)');
    await avanzarPregunta(page, {
      enunciado: '#prueba-enunciado',
      boton: '#prueba-siguiente',
      destino: '#s-diagnostico',
      etiqueta: 'E2 pregunta 1 (atras)',
    });
    const erroresAntes = reporte.consola.length;
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(400);
    const est = await estadoPantallas(page);
    const problemas = [];
    if (est.visibles.length !== 1) problemas.push('secciones visibles: [' + est.visibles.join(', ') + ']');
    if (!est.textoVisible) problemas.push('la pantalla quedo en blanco');
    if (reporte.consola.length > erroresAntes) problemas.push('genero ' + (reporte.consola.length - erroresAntes) + ' error(es) de consola');
    registrar(
      'el boton atras a mitad de la prueba no rompe la pantalla',
      problemas.length === 0,
      problemas.join(' | '),
      est
    );
  } catch (e) {
    registrar('el boton atras a mitad de la prueba no rompe la pantalla', false, e.message);
  }

  // 5 y 6. Formulario de correo
  contexto = 'robustez formulario';
  try {
    await irAInicio(page, base);
    await entrarAPrueba(page);
    await responderPrueba(page, COMBO_CAPTURA);
    await esperarPantalla(page, 's-diagnostico', 'E3 para el formulario');
    await clic(page, '#s-diagnostico [data-ir="monitores"]', 'boton Ver monitores');
    await esperarPantalla(page, 's-monitores', 'E4');
    await clic(page, '#lista-monitores [data-ir="perfil"], #s-monitores [data-ir="perfil"]', 'tarjeta de monitor');
    await esperarPantalla(page, 's-perfil', 'E5');
    const hayHorario = await page.locator('#s-perfil .slot').count().catch(() => 0);
    if (hayHorario) await page.locator('#s-perfil .slot').first().click().catch(() => {});
    await clic(page, '#s-perfil [data-ir="confirmacion"]', 'boton Agendar y pagar');
    await esperarPantalla(page, 's-confirmacion', 'E6');

    const form = page.locator('#s-confirmacion form.captura').first();
    await form.waitFor({ state: 'visible', timeout: TIEMPO });

    // 6. Correo invalido: no debe mostrar el agradecimiento
    await form.locator('input[type="email"]').first().fill('correo-invalido');
    await form.locator('button[type="submit"], button').first().click();
    await page.waitForTimeout(500);
    const graciasInvalido = await form.locator('.gracias').first().isVisible().catch(() => false);
    registrar(
      'un correo invalido no muestra el agradecimiento',
      graciasInvalido === false,
      graciasInvalido === false ? '' : '.gracias aparecio con el valor "correo-invalido"'
    );

    // 5. Correo valido en modo demo: agradecimiento y cero peticiones de red
    const antes = red.peticiones.length;
    await form.locator('input[type="email"]').first().fill('demo@uniandes.edu.co');
    await form.locator('button[type="submit"], button').first().click();
    await page.waitForTimeout(800);
    const graciasValido = await form.locator('.gracias').first().isVisible().catch(() => false);
    const nuevas = red.peticiones.slice(antes).filter((p) => !esFuente(p.url));
    const problemas = [];
    if (!graciasValido) problemas.push('no aparecio .gracias tras enviar un correo valido');
    if (nuevas.length) problemas.push('hizo ' + nuevas.length + ' peticion(es) de red: ' + nuevas.slice(0, 3).map((p) => p.url).join(', '));
    registrar(
      'el formulario en modo demo agradece y no llama a la red',
      problemas.length === 0,
      problemas.join(' | '),
      { peticiones: nuevas }
    );
  } catch (e) {
    registrar('formulario de captura de correo', false, e.message);
  }
}

async function estadoPantallas(page) {
  return page.evaluate(() => {
    const secciones = Array.prototype.slice.call(document.querySelectorAll('section.screen'));
    const visibles = secciones.filter((s) => s.getClientRects().length > 0).map((s) => s.id);
    return {
      hash: window.location.hash,
      visibles,
      total: secciones.length,
      textoVisible: (document.body.innerText || '').trim().length > 0,
    };
  });
}

function esFuente(u) {
  return HOSTS_FUENTES.some((h) => String(u).indexOf(h) !== -1);
}

// ---------------------------------------------------------------------------
// 8. Contact sheet
// ---------------------------------------------------------------------------

function escribirContactSheet() {
  const filas = reporte.capturas
    .map(
      (c) =>
        '  <figure>\n    <img src="' + c.archivo + '" alt="' + c.etiqueta.replace(/"/g, '&quot;') + '" loading="lazy">\n' +
        '    <figcaption><b>' + c.archivo + '</b><br>' + c.etiqueta + '</figcaption>\n  </figure>'
    )
    .join('\n');

  const html =
    '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Calibra · hoja de contacto</title>\n<style>\n' +
    'body{margin:0;padding:24px;background:#101418;color:#E8EDF3;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}\n' +
    'h1{font-size:22px;margin:0 0 4px}\n' +
    'p.meta{margin:0 0 24px;color:#9AA7B6}\n' +
    '.rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}\n' +
    'figure{margin:0;background:#181E25;border:1px solid #2A333D;border-radius:12px;overflow:hidden}\n' +
    'img{display:block;width:100%;height:auto;background:#FFFDF5}\n' +
    'figcaption{padding:10px 12px;font-size:14px;color:#C3CEDA}\n' +
    'figcaption b{color:#FFFFFF;font-weight:600}\n' +
    '.resumen{margin:0 0 24px;padding:12px 16px;border-radius:12px;border:1px solid #2A333D;background:#181E25}\n' +
    '.ok{color:#7EE2A8}.falla{color:#FF9A9E}\n' +
    '</style>\n</head>\n<body>\n' +
    '<h1>Calibra · hoja de contacto</h1>\n' +
    '<p class="meta">Generada ' + new Date().toLocaleString('es-CO') + ' · viewport 390 × 844 · deviceScaleFactor 3</p>\n' +
    '<p class="resumen">Comprobaciones: ' + reporte.resumen.total +
    ' · <span class="ok">OK ' + reporte.resumen.ok + '</span>' +
    ' · <span class="falla">fallas ' + reporte.resumen.fallas + '</span>' +
    ' · detalle en <code>reporte.json</code></p>\n' +
    '<div class="rejilla">\n' + filas + '\n</div>\n</body>\n</html>\n';

  fs.writeFileSync(RUTA_SHEET, html, 'utf8');
}

// ---------------------------------------------------------------------------
// 9. Programa principal
// ---------------------------------------------------------------------------

function quiere(bloque) {
  return !SOLO || SOLO.indexOf(bloque) !== -1;
}

async function main() {
  linea('Calibra · arnes de verificacion');
  linea('Proyecto: ' + RAIZ);

  if (!fs.existsSync(INDEX)) {
    linea('');
    linea('FALLA: no existe ' + INDEX);
    linea('El arnes verifica el prototipo de una sola pagina; cree index.html en la raiz del proyecto y vuelva a ejecutarlo.');
    process.exit(1);
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    linea('');
    linea('FALLA: no pude cargar playwright.');
    linea('Ejecute este arnes con verificar.cmd, que define NODE_PATH=C:\\Users\\jdcha\\AppData\\Roaming\\npm\\node_modules');
    linea('Detalle: ' + e.message);
    process.exit(1);
  }

  fs.mkdirSync(DIR_EST, { recursive: true });
  fs.mkdirSync(DIR_MON, { recursive: true });

  let servidor = null;
  let navegador = null;
  const red = { peticiones: [], fallidas: [] };

  try {
    const s = await crearServidor(RAIZ);
    servidor = s.servidor;
    const base = 'http://127.0.0.1:' + s.puerto + '/index.html';
    reporte.base = base;
    linea('Servidor local: ' + base);

    try {
      navegador = await playwright.chromium.launch({ headless: !HEADED });
    } catch (e) {
      linea('');
      linea('FALLA: no pude lanzar Chromium. Solo hay Chromium descargado en este equipo.');
      linea('Detalle: ' + e.message);
      process.exit(1);
    }

    const contextoNav = await navegador.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      locale: 'es-CO',
      timezoneId: 'America/Bogota',
    });
    const page = await contextoNav.newPage();
    page.setDefaultTimeout(TIEMPO);

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        reporte.consola.push({ pantalla: contexto, tipo: 'console.error', texto: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      reporte.consola.push({ pantalla: contexto, tipo: 'pageerror', texto: String(err && err.message ? err.message : err) });
    });
    page.on('request', (req) => {
      red.peticiones.push({ url: req.url(), metodo: req.method() });
    });
    page.on('requestfailed', (req) => {
      const u = req.url();
      if (esFuente(u)) return;
      red.fallidas.push({ pantalla: contexto, url: u, motivo: (req.failure() && req.failure().errorText) || 'desconocido' });
    });
    page.on('response', (res) => {
      const u = res.url();
      if (esFuente(u)) return;
      if (res.status() >= 400) {
        red.fallidas.push({ pantalla: contexto, url: u, motivo: 'HTTP ' + res.status() });
      }
    });

    if (quiere('fuente')) {
      await bloqueFuente();
    }

    if (quiere('capturas')) {
      try {
        await bloqueCapturas(page, base);
      } catch (e) {
        registrar('recorrido de capturas', false, e.message);
      }
    }

    if (quiere('logica')) {
      try {
        await bloqueLogicaEstudiante(page, base);
      } catch (e) {
        registrar('logica del diagnostico', false, e.message);
      }
    }

    if (quiere('monitor')) {
      try {
        await bloqueLogicaMonitor(page, base);
      } catch (e) {
        registrar('logica de certificacion', false, e.message);
      }
    }

    if (quiere('robustez')) {
      try {
        await bloqueRobustez(page, base, red);
      } catch (e) {
        registrar('robustez', false, e.message);
      }
    }

    // Bloque global: consola y red, ya con todo el recorrido hecho
    abrirBloque('Consola y red');
    registrar(
      'consola sin errores',
      reporte.consola.length === 0,
      reporte.consola.length === 0
        ? ''
        : reporte.consola.length + ' error(es): ' + reporte.consola.slice(0, 3).map((c) => '[' + c.pantalla + '] ' + c.texto.slice(0, 120)).join(' | '),
      reporte.consola
    );
    registrar(
      'red sin peticiones fallidas (fuera de Google Fonts)',
      red.fallidas.length === 0,
      red.fallidas.length === 0
        ? ''
        : red.fallidas.length + ' fallida(s): ' + red.fallidas.slice(0, 3).map((f) => f.url + ' (' + f.motivo + ')').join(' | '),
      red.fallidas
    );
    reporte.red = red.fallidas;

    await contextoNav.close();
  } catch (e) {
    registrar('ejecucion del arnes', false, 'error inesperado: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  } finally {
    if (navegador) await navegador.close().catch(() => {});
    if (servidor) await new Promise((r) => servidor.close(r));
  }

  // ---- Salida ----
  try {
    escribirContactSheet();
  } catch (e) {
    linea('Aviso: no pude escribir la hoja de contacto: ' + e.message);
  }
  try {
    fs.writeFileSync(RUTA_REPORTE, JSON.stringify(reporte, null, 2), 'utf8');
  } catch (e) {
    linea('Aviso: no pude escribir reporte.json: ' + e.message);
  }

  linea('');
  linea('== RESUMEN ==');
  linea('  Comprobaciones: ' + reporte.resumen.total);
  linea('  OK:             ' + reporte.resumen.ok);
  linea('  FALLAS:         ' + reporte.resumen.fallas);
  linea('  Capturas:       ' + reporte.capturas.length + ' en ' + DIR_CAPTURAS);
  linea('  Hoja de contacto: ' + RUTA_SHEET);
  linea('  Reporte:          ' + RUTA_REPORTE);

  if (reporte.resumen.fallas > 0) {
    linea('');
    linea('Fallas por bloque:');
    reporte.bloques.forEach((b) => {
      const malas = b.comprobaciones.filter((c) => !c.ok);
      if (!malas.length) return;
      linea('  ' + b.nombre + ': ' + malas.length);
      malas.slice(0, 12).forEach((c) => linea('    - ' + c.nombre + (c.detalle ? ' -> ' + c.detalle : '')));
      if (malas.length > 12) linea('    - (' + (malas.length - 12) + ' mas en reporte.json)');
    });
  }

  process.exit(reporte.resumen.fallas > 0 ? 1 : 0);
}

main().catch((e) => {
  linea('');
  linea('FALLA no controlada del arnes: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
