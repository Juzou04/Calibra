---
id: calculo-integral
codigo: MATE-1214
nombre: Cálculo Integral con Ecuaciones Diferenciales
libro: Stewart, Cálculo de una variable, 6.ª ed.
contexto: antes del parcial 2
activa: true
longitud: 12
---

Curso completo de Cálculo Integral con Ecuaciones Diferenciales basado en el programa 2024-1.
Incluye técnicas de integración, aplicaciones, series y ecuaciones diferenciales.
Preguntas calibradas con errores conceptuales específicos del material de clase.

Piloto de knowledge components: cada subtema declara sus kc (habilidades concretas) y sus mc
(misconcepciones reutilizables). Cada pregunta dice qué kc mide y cada opción incorrecta dice
qué mc delata. Las preguntas marcadas "borrador" las redactó el asistente de IA y falta que
alguien que sepa la materia las revise; hasta entonces solo entran con --borradores.
Para ver la cobertura: node contenido/convertir.js --cobertura

## partes · Integración por partes

kc: partes-eleccion-u · Elegir u y dv con la prioridad ILATE
kc: partes-formula · Aplicar uv − ∫v du con signos y términos correctos
kc: partes-reiterada · Aplicar partes varias veces o en forma cíclica
mc: u-orden-aparicion · partes-eleccion-u · eliges u por orden de aparición, no por la prioridad ILATE
mc: u-dv-confundidos · partes-eleccion-u · confundes el papel de u y dv
mc: sin-separar-u-dv · partes-eleccion-u · no separas el integrando en u y dv
mc: signo-partes · partes-formula · te equivocas en el signo de la fórmula uv − ∫v du
mc: omite-uv · partes-formula · omites el término u·v
mc: omite-integral-restante · partes-formula · olvidas restar la integral ∫v du
mc: producto-factor-a-factor · partes-formula · integras un producto factor por factor, como si ∫f·g fuera ∫f·∫g
mc: partes-una-sola-vez · partes-reiterada · te detienes tras una aplicación de partes aunque la integral que queda sigue siendo un producto
mc: deshace-paso · partes-reiterada · al repetir partes inviertes la elección de u y dv y deshaces el paso anterior
mc: ciclica-no-reconocida · partes-reiterada · no reconoces que la integral original reaparece y hay que despejarla
mc: despeje-incompleto · partes-reiterada · al despejar la integral original olvidas dividir entre 2

### P1 · dificultad 2 · kc: partes-eleccion-u
En ∫ x·ln(x) dx, ¿qué eliges como u?

- A) x · [u-orden-aparicion] eliges u por orden de aparición, no por prioridad ILATE
- B) ln(x) · CORRECTA
- C) dx · [u-dv-confundidos] confundes u con dv
- D) x · ln(x) · [sin-separar-u-dv] no separas el producto en u y dv

### P4 · dificultad 2 · kc: partes-formula
En ∫ x·eˣ dx, con u = x y dv = eˣ dx, el resultado es:

- A) x·eˣ − eˣ + C · CORRECTA
- B) x·eˣ + eˣ + C · [signo-partes] te equivocas en el signo de la fórmula de partes
- C) eˣ + C · [omite-uv] omites el término u·v
- D) x²·eˣ/2 + C · [producto-factor-a-factor] integras como si fuera un producto de potencias

### P13 · dificultad 2 · kc: partes-eleccion-u · borrador
En ∫ eˣ·x² dx, ¿qué conviene elegir como u?

- A) eˣ · [u-orden-aparicion] eliges u por el orden en que aparece, no por la prioridad ILATE
- B) x² · CORRECTA
- C) dx · [u-dv-confundidos] tomas como u el diferencial, que siempre va en dv
- D) eˣ·x² · [sin-separar-u-dv] tomas todo el integrando como u sin separarlo en u y dv

### P14 · dificultad 3 · kc: partes-eleccion-u · borrador
En ∫ x³·ln(x) dx un compañero toma u = x³ y dv = ln(x) dx. ¿Qué opinas?

- A) Se complica, porque tendría que integrar ln(x) para hallar v: conviene u = ln(x) · CORRECTA
- B) Está bien, porque x³ aparece primero · [u-orden-aparicion] eliges u por orden de aparición, no por prioridad ILATE
- C) Está bien, porque da igual cuál sea u y cuál dv · [u-dv-confundidos] crees que u y dv son intercambiables
- D) Debería tomar u = x³·ln(x) y dv = dx · [sin-separar-u-dv] no separas el producto en u y dv

### P15 · dificultad 2 · kc: partes-formula · borrador
En ∫ x·cos(x) dx, con u = x y dv = cos(x) dx, el resultado es:

- A) x·sen(x) + cos(x) + C · CORRECTA
- B) x·sen(x) − cos(x) + C · [signo-partes] te equivocas en el signo de la fórmula de partes
- C) cos(x) + C · [omite-uv] omites el término u·v
- D) (x²/2)·sen(x) + C · [producto-factor-a-factor] integras cada factor por separado

### P16 · dificultad 3 · kc: partes-formula · borrador
∫ ln(x) dx, usando u = ln(x) y dv = dx, da:

- A) x·ln(x) − x + C · CORRECTA
- B) x·ln(x) + x + C · [signo-partes] te equivocas en el signo de la fórmula de partes
- C) −x + C · [omite-uv] omites el término u·v
- D) x·ln(x) + C · [omite-integral-restante] olvidas restar la integral ∫v du

### P17 · dificultad 2 · kc: partes-formula · borrador
En ∫ x·e^(2x) dx, con u = x y dv = e^(2x) dx, el resultado es:

- A) (x/2)·e^(2x) − (1/4)·e^(2x) + C · CORRECTA
- B) (x/2)·e^(2x) + C · [omite-integral-restante] olvidas restar la integral ∫v du
- C) (x²/2)·(e^(2x)/2) + C · [producto-factor-a-factor] integras cada factor por separado
- D) (x/2)·e^(2x) + (1/4)·e^(2x) + C · [signo-partes] te equivocas en el signo de la fórmula de partes

### P18 · dificultad 3 · kc: partes-reiterada, partes-formula · borrador
Al resolver ∫ x²·eˣ dx con u = x² queda x²·eˣ − ∫ 2x·eˣ dx. ¿Qué sigue?

- A) Aplicar partes otra vez a ∫ 2x·eˣ dx, con u = 2x · CORRECTA
- B) Escribir x²·eˣ − 2x·eˣ + C y terminar · [partes-una-sola-vez] te detienes aunque la integral que queda sigue siendo un producto
- C) Aplicar partes a ∫ 2x·eˣ dx, pero ahora con u = eˣ · [deshace-paso] inviertes la elección de u y dv y deshaces el paso anterior
- D) Integrar 2x·eˣ como x²·eˣ, así que el resultado es C · [producto-factor-a-factor] integras cada factor por separado

### P19 · dificultad 3 · kc: partes-reiterada · borrador
Para I = ∫ eˣ·sen(x) dx, tras aplicar partes dos veces (primero u = sen(x), luego u = cos(x)) llegas a I = eˣ·sen(x) − eˣ·cos(x) − I. ¿Cuánto vale I?

- A) (eˣ/2)·(sen(x) − cos(x)) + C · CORRECTA
- B) eˣ·sen(x) − eˣ·cos(x) + C · [ciclica-no-reconocida] ignoras que la integral original reaparece y hay que despejarla
- C) Hay que aplicar partes una tercera vez, ahora con u = eˣ · [deshace-paso] al repetir partes inviertes la elección de u y deshaces el paso anterior
- D) eˣ·(sen(x) − cos(x)) + C · [despeje-incompleto] al despejar I olvidas dividir entre 2

### P20 · dificultad 3 · kc: partes-reiterada · borrador
Para I = ∫ eˣ·cos(x) dx, tras dos aplicaciones de partes llegas a I = eˣ·cos(x) + eˣ·sen(x) − I. Entonces I es:

- A) (eˣ/2)·(cos(x) + sen(x)) + C · CORRECTA
- B) eˣ·(cos(x) + sen(x)) + C · [despeje-incompleto] al despejar I olvidas dividir entre 2
- C) eˣ·cos(x) + eˣ·sen(x) − I · [ciclica-no-reconocida] dejas la integral original en la respuesta sin despejarla
- D) eˣ·cos(x) + C · [partes-una-sola-vez] te quedas con el primer término de la primera aplicación de partes

## sustitucion · Sustitución

kc: sust-reconocer · Reconocer la derivada de la función interna para elegir u
kc: sust-dx · Reescribir dx en términos de du, con sus constantes
kc: sust-limites · Cambiar los límites de integración al sustituir
mc: no-ve-derivada-interna · sust-reconocer · no reconoces cuándo un factor es la derivada de la función interna
mc: metodo-equivocado · sust-reconocer · aplicas un método o fórmula que no corresponde a la forma de la integral
mc: ignora-cadena · sust-reconocer · integras con la tabla ignorando la regla de la cadena
mc: olvida-constante-du · sust-dx · ajustas mal la constante al pasar de dx a du
mc: deja-x-mezclada · sust-dx · dejas x y u mezcladas en la misma integral
mc: dx-sin-convertir · sust-dx · cambias el integrando a u pero dejas dx sin convertir
mc: limites-sin-cambiar · sust-limites · usas los límites en x después de cambiar a la variable u
mc: limite-mal-calculado · sust-limites · calculas o asignas mal los límites nuevos en u
mc: limites-dos-veces · sust-limites · cambias los límites y además regresas a x, mezclando los dos caminos

### P2 · dificultad 2 · kc: sust-reconocer
En ∫ 2x·cos(x²) dx, ¿qué método aplicas?

- A) Integración por partes · [no-ve-derivada-interna] no reconoces que 2x es la derivada de x²
- B) Sustitución con u = x² · CORRECTA
- C) Fracciones parciales · [metodo-equivocado] aplicas un método que no corresponde a esta forma
- D) Integral directa de tabla · [ignora-cadena] ignoras la regla de la cadena

### P21 · dificultad 2 · kc: sust-reconocer, sust-dx · borrador
∫ 2x·e^(x²) dx es:

- A) e^(x²) + C · CORRECTA
- B) x²·e^(x²) + C · [no-ve-derivada-interna] no reconoces que 2x es la derivada de x² e integras los factores por separado
- C) e^(x²)/(2x) + C · [ignora-cadena] divides por la derivada de la función interna como si fuera una constante
- D) 2·e^(x²) + C · [olvida-constante-du] ajustas mal la constante al pasar de dx a du

### P22 · dificultad 3 · kc: sust-reconocer, sust-dx · borrador
¿Cómo se resuelve ∫ x/(x² + 1) dx?

- A) Con u = x² + 1, y da (1/2)·ln(x² + 1) + C · CORRECTA
- B) Con u = x, porque es el numerador · [no-ve-derivada-interna] eliges u por la forma y no por la derivada de la función interna
- C) Directo: es arctan(x) + C · [metodo-equivocado] aplicas la fórmula de ∫ 1/(x² + 1) dx, que no corresponde a esta forma
- D) Con u = x² + 1, y da ln(x² + 1) + C · [olvida-constante-du] olvidas el 1/2 al pasar de dx a du

### P23 · dificultad 2 · kc: sust-dx · borrador
En ∫ x·√(x² + 4) dx, con u = x² + 4, la integral en u queda:

- A) (1/2)·∫ √u du · CORRECTA
- B) ∫ √u du · [olvida-constante-du] olvidas el 1/2 al despejar x dx
- C) ∫ x·√u du · [deja-x-mezclada] dejas x y u mezcladas en la misma integral
- D) ∫ √u dx · [dx-sin-convertir] cambias el integrando a u pero dejas dx sin convertir

### P24 · dificultad 2 · kc: sust-dx · borrador
Con u = ln(x), ¿en qué se convierte ∫ (ln(x))²/x dx?

- A) ∫ u² du · CORRECTA
- B) ∫ u²/x du · [deja-x-mezclada] dejas x y u mezcladas en la misma integral
- C) ∫ u² dx · [dx-sin-convertir] cambias el integrando a u pero dejas dx sin convertir
- D) (1/2)·∫ u² du · [olvida-constante-du] agregas una constante que no aparece al pasar de dx a du

### P25 · dificultad 2 · kc: sust-limites · borrador
Para ∫ de 0 a 2 de 2x·(x² + 1)³ dx con u = x² + 1, la integral en u es:

- A) ∫ de 1 a 5 de u³ du · CORRECTA
- B) ∫ de 0 a 2 de u³ du · [limites-sin-cambiar] usas los límites en x después de cambiar a u
- C) ∫ de 1 a 3 de u³ du · [limite-mal-calculado] calculas el límite nuevo con otra expresión que no es u
- D) Regresar a (x² + 1)⁴/4 y evaluar entre 1 y 5 · [limites-dos-veces] cambias los límites y además regresas a x

### P26 · dificultad 3 · kc: sust-limites · borrador
En ∫ de 0 a π/2 de sen²(x)·cos(x) dx usaste u = sen(x) y llegaste a u³/3. ¿Cómo terminas?

- A) Evalúo u³/3 entre u = 0 y u = 1, y da 1/3 · CORRECTA
- B) Evalúo u³/3 entre u = 0 y u = π/2, y da π³/24 · [limites-sin-cambiar] usas los límites en x después de cambiar a u
- C) Regreso a sen³(x)/3 y evalúo entre 0 y 1 · [limites-dos-veces] cambias los límites y además regresas a x
- D) Evalúo u³/3 entre u = 1 y u = 0, y da −1/3 · [limite-mal-calculado] asignas al revés los límites nuevos

## impropias · Integrales impropias

kc: impropia-p · Decidir la convergencia de ∫ 1/xᵖ en intervalos infinitos
kc: impropia-limite · Plantear y evaluar la integral impropia como un límite
kc: impropia-discontinuidad · Detectar discontinuidades del integrando en el intervalo
mc: confunde-p1 · impropia-p · confundes 1/xᵖ con p > 1 con el caso 1/x, que diverge
mc: condicion-p-mal · impropia-p · usas mal la condición de convergencia p > 1
mc: no-reconoce-convergente · impropia-p · crees que una integral sobre un intervalo infinito no puede dar un número finito
mc: limite-mal-evaluado · impropia-limite · evalúas mal la antiderivada en los límites
mc: infinito-como-numero · impropia-limite · reemplazas ∞ como si fuera un número en vez de tomar un límite
mc: integrando-vs-integral · impropia-limite · confundes lo que hace el integrando con lo que hace la integral
mc: solo-limites-infinitos · impropia-discontinuidad · crees que una integral solo es impropia si tiene límites infinitos
mc: ignora-discontinuidad · impropia-discontinuidad · no revisas si el integrando se indefine en un extremo o dentro del intervalo

### P3 · dificultad 3 · kc: impropia-p, impropia-limite
∫ desde 1 hasta ∞ de (1/x²) dx:

- A) Converge a 1 · CORRECTA
- B) Diverge · [confunde-p1] la confundes con 1/x, que sí diverge
- C) Converge a 0 · [limite-mal-evaluado] evalúas mal el límite superior
- D) No se puede determinar · [no-reconoce-convergente] no reconoces una impropia convergente

### P27 · dificultad 2 · kc: impropia-p · borrador
¿Cuál de estas integrales desde 1 hasta ∞ converge?

- A) ∫ 1/x³ dx · CORRECTA
- B) ∫ 1/x dx · [confunde-p1] crees que 1/x se comporta como las potencias con p > 1
- C) ∫ 1/√x dx · [condicion-p-mal] inviertes la condición y crees que converge con p < 1
- D) Ninguna, porque el intervalo es infinito · [no-reconoce-convergente] crees que un intervalo infinito siempre da un resultado infinito

### P28 · dificultad 3 · kc: impropia-p, impropia-limite · borrador
∫ desde 1 hasta ∞ de 1/x^(3/2) dx:

- A) Converge a 2 · CORRECTA
- B) Diverge, igual que 1/x · [confunde-p1] la confundes con 1/x, que sí diverge
- C) Converge a 2/3 · [limite-mal-evaluado] integras o evalúas mal la antiderivada en los límites
- D) Diverge, porque hace falta p ≥ 2 · [condicion-p-mal] exiges una condición más fuerte que p > 1

### P29 · dificultad 2 · kc: impropia-limite · borrador
¿Cómo se trabaja correctamente ∫ desde 0 hasta ∞ de e^(−x) dx?

- A) Como el límite cuando b → ∞ de ∫ de 0 a b de e^(−x) dx · CORRECTA
- B) Evaluando −e^(−x) directamente en x = ∞ y en x = 0 · [infinito-como-numero] reemplazas ∞ como si fuera un número
- C) Vale 0, porque e^(−x) tiende a 0 · [integrando-vs-integral] confundes que el integrando tienda a 0 con el valor de la integral
- D) Como el límite cuando b → ∞ de e^(−b) · [limite-mal-evaluado] evalúas solo un extremo de la antiderivada

### P30 · dificultad 3 · kc: impropia-limite · borrador
Un estudiante dice que ∫ desde 1 hasta ∞ de 1/x dx converge "porque 1/x tiende a 0". ¿Qué está mal?

- A) Que el integrando tienda a 0 no basta: ln(b) tiende a ∞ cuando b → ∞ · CORRECTA
- B) Nada, y la integral vale 0 · [integrando-vs-integral] confundes que el integrando tienda a 0 con que la integral converja
- C) Nada: vale ln(∞) − ln(1), que es un número · [infinito-como-numero] reemplazas ∞ como si fuera un número
- D) Converge a 1, porque solo cuenta el límite inferior · [limite-mal-evaluado] evalúas mal la antiderivada en los límites

### P31 · dificultad 2 · kc: impropia-discontinuidad, impropia-limite · borrador
¿Es impropia ∫ de 0 a 1 de 1/√x dx?

- A) Sí, porque 1/√x no está definida en x = 0 · CORRECTA
- B) No, porque los límites de integración son finitos · [solo-limites-infinitos] crees que solo es impropia si tiene límites infinitos
- C) Sí, y diverge porque 1/√x crece sin límite cerca de 0 · [integrando-vs-integral] confundes que el integrando crezca sin límite con que la integral diverja
- D) No, porque x = 0 es un extremo y los extremos no cuentan · [ignora-discontinuidad] no revisas si el integrando se indefine en un extremo

### P32 · dificultad 3 · kc: impropia-discontinuidad, impropia-limite · borrador
Un estudiante calcula ∫ de −1 a 1 de 1/x² dx como [−1/x] entre −1 y 1, y obtiene −2. ¿Qué pasa?

- A) No vale: 1/x² se indefine en x = 0, hay que partir la integral y resulta divergente · CORRECTA
- B) Está bien: los límites son finitos, así que no es impropia · [solo-limites-infinitos] crees que solo es impropia si tiene límites infinitos
- C) Está bien el método, pero el resultado es 2 · [ignora-discontinuidad] no revisas si el integrando se indefine dentro del intervalo
- D) Hay que partirla en 0, y cada mitad vale 1, así que da 2 · [limite-mal-evaluado] evalúas mal los límites de cada mitad

## ecuaciones-diferenciales · Ecuaciones diferenciales de primer orden

kc: edo-separables · Separar variables e integrar
kc: edo-lineal · Resolver lineales con factor integrante
kc: edo-exponencial · Reconocer y resolver dy/dx = ky con condición inicial
mc: no-separa · edo-separables · integras ambos lados sin separar antes las variables
mc: deriva-en-vez-de-integrar · edo-separables · derivas cuando la ecuación pide integrar
mc: constante-antes · edo-separables · fijas o descartas la constante antes de terminar de integrar
mc: factor-con-q · edo-lineal · usas Q(x) en vez de P(x) para el factor integrante
mc: factor-sin-exponencial · edo-lineal · olvidas la exponencial en el factor integrante
mc: factor-mezclado · edo-lineal · mezclas el procedimiento del factor integrante con otros métodos
mc: integra-directo-ky · edo-exponencial · resuelves dy/dx = ky como integración directa sin ver que y está en ambos lados
mc: pierde-k-exponente · edo-exponencial · pierdes la constante k del exponente
mc: constante-sumada · edo-exponencial · sumas la constante en vez de multiplicar la exponencial

### P5 · dificultad 2 · kc: edo-separables
Una ecuación diferencial de variables separables tiene la forma dy/dx = f(x)·g(y). ¿Cuál es el primer paso para resolverla?

- A) Separar variables y escribir (1/g(y))dy = f(x)dx · CORRECTA
- B) Integrar ambos lados directamente sin separar · [no-separa] no separas las variables antes de integrar
- C) Derivar ambos lados para simplificar · [deriva-en-vez-de-integrar] confundes resolver con derivar
- D) Sustituir y = 0 para encontrar la constante · [constante-antes] intentas encontrar la constante antes de integrar

### P6 · dificultad 3 · kc: edo-lineal
Para la ecuación diferencial dy/dx + P(x)y = Q(x), el factor integrante es:

- A) e^(∫P(x)dx) · CORRECTA
- B) e^(∫Q(x)dx) · [factor-con-q] confundes P(x) con Q(x) en la fórmula del factor integrante
- C) ∫P(x)dx · [factor-sin-exponencial] olvidas aplicar la exponencial al integrar P(x)
- D) P(x)·eˣ · [factor-mezclado] mezclas la fórmula con la solución de homogéneas

### P7 · dificultad 2 · kc: edo-exponencial
Si dy/dx = ky donde k es constante, la solución general es:

- A) y = Ceᵏˣ · CORRECTA
- B) y = C + kx · [integra-directo-ky] resuelves como si fuera integración directa sin reconocer la exponencial
- C) y = kx² + C · [integra-directo-ky] integras k dos veces ignorando que y está en la ecuación
- D) y = eˣ + k · [pierde-k-exponente] olvidas la constante k en el exponente

### P33 · dificultad 2 · kc: edo-separables · borrador
Resuelves dy/dx = x·y² separando variables. ¿Qué queda para integrar?

- A) ∫ dy/y² = ∫ x dx · CORRECTA
- B) ∫ dy = ∫ x·y² dx · [no-separa] integras sin separar antes las variables
- C) d²y/dx² = y² + 2xy·(dy/dx) · [deriva-en-vez-de-integrar] derivas la ecuación en vez de integrarla
- D) Primero se halla C con y(0) y después se separa · [constante-antes] buscas la constante antes de integrar

### P34 · dificultad 3 · kc: edo-separables · borrador
La solución general de dy/dx = 2x/y es:

- A) y² = 2x² + C · CORRECTA
- B) y = x²/y + C · [no-separa] integras sin separar antes las variables
- C) y² = 2x² · [constante-antes] descartas la constante antes de terminar de integrar
- D) y' = 2/y − 2x·y'/y² · [deriva-en-vez-de-integrar] derivas la ecuación en vez de integrarla

### P35 · dificultad 2 · kc: edo-lineal · borrador
Para dy/dx + 2y = eˣ, el factor integrante es:

- A) e^(2x) · CORRECTA
- B) e^(eˣ) · [factor-con-q] usas el lado derecho en vez del coeficiente de y
- C) 2x · [factor-sin-exponencial] olvidas la exponencial en el factor integrante
- D) 2·eˣ · [factor-mezclado] mezclas el coeficiente de y con el lado derecho

### P36 · dificultad 3 · kc: edo-lineal · borrador
Para dy/dx + (1/x)·y = x, con x > 0, ¿qué factor integrante usas y qué ecuación queda?

- A) μ = x, y queda (x·y)' = x² · CORRECTA
- B) μ = e^(x²/2), y queda (e^(x²/2)·y)' = x·e^(x²/2) · [factor-con-q] usas Q(x) en vez de P(x) para el factor integrante
- C) μ = ln(x), y queda (ln(x)·y)' = x·ln(x) · [factor-sin-exponencial] olvidas la exponencial en el factor integrante
- D) μ = x, y queda x·y = x · [factor-mezclado] multiplicas por el factor pero te saltas la integración

### P37 · dificultad 2 · kc: edo-exponencial · borrador
Una población crece según dP/dt = 0,03·P, con P(0) = 500. ¿Cuál es P(t)?

- A) P(t) = 500·e^(0,03t) · CORRECTA
- B) P(t) = 500 + 0,03t · [integra-directo-ky] resuelves como integración directa sin ver que P está en ambos lados
- C) P(t) = 500·eᵗ + 0,03 · [pierde-k-exponente] sacas la constante del exponente
- D) P(t) = e^(0,03t) + 500 · [constante-sumada] sumas la condición inicial en vez de multiplicar

### P38 · dificultad 3 · kc: edo-exponencial · borrador
Si dy/dx = −2y y y(0) = 3, ¿cuánto vale y(1)?

- A) 3·e^(−2) · CORRECTA
- B) 1 · [integra-directo-ky] resuelves y = 3 − 2x como si fuera integración directa
- C) 3·e^(−1) · [pierde-k-exponente] pierdes la constante k del exponente
- D) e^(−2) + 3 · [constante-sumada] sumas la condición inicial en vez de multiplicar

## series · Series y convergencia

kc: serie-criterio · Elegir y aplicar un criterio de convergencia adecuado
kc: serie-potencias · Interpretar el radio y el intervalo de convergencia
kc: serie-taylor · Construir series de Taylor con derivadas en el centro
mc: criterio-ineficiente · serie-criterio · escoges un criterio más complicado o que no decide cuando uno directo basta
mc: compara-con-divergente · serie-criterio · comparas con una serie que no permite concluir
mc: termino-a-cero · serie-criterio · crees que si el término general tiende a 0 la serie converge
mc: radio-sin-centro · serie-potencias · interpretas el radio sin tener en cuenta el centro
mc: extremos-asumidos · serie-potencias · decides qué pasa en los extremos sin verificarlos
mc: radio-como-puntos · serie-potencias · confundes el radio de convergencia con puntos aislados
mc: taylor-integra · serie-taylor · construyes los coeficientes integrando en vez de derivando
mc: taylor-funcion-equivocada · serie-taylor · usas la serie de otra función conocida
mc: taylor-trunca · serie-taylor · crees que la serie termina después de pocos términos
mc: olvida-factorial · serie-taylor · usas f⁽ⁿ⁾(0) como coeficiente sin dividir entre n!

### P8 · dificultad 2 · kc: serie-criterio
Para determinar si una serie ∑(1/n²) converge, ¿qué criterio es más directo?

- A) Criterio de la integral o criterio p con p = 2 · CORRECTA
- B) Criterio del cociente · [criterio-ineficiente] usas un criterio más complejo cuando el criterio p es suficiente
- C) Criterio de la raíz · [criterio-ineficiente] aplicas un criterio que no es el más eficiente para esta forma
- D) Comparación con 1/n · [compara-con-divergente] comparas con una serie divergente en vez de convergente

### P39 · dificultad 2 · kc: serie-criterio · borrador
¿Qué se puede concluir de ∑ 1/√n?

- A) Diverge, porque es una serie p con p = 1/2 ≤ 1 · CORRECTA
- B) Converge, porque 1/√n tiende a 0 · [termino-a-cero] crees que si el término tiende a 0 la serie converge
- C) Converge, porque el criterio del cociente da límite 1 · [criterio-ineficiente] usas un criterio que aquí no decide y lo interpretas mal
- D) Converge, porque cada término es menor que 1 · [compara-con-divergente] comparas con ∑ 1, que diverge y no permite concluir

### P40 · dificultad 3 · kc: serie-criterio · borrador
¿Converge ∑ n/(n + 1)?

- A) No: el término general tiende a 1, no a 0, así que diverge · CORRECTA
- B) Sí, porque n/(n + 1) < 1 para todo n · [compara-con-divergente] comparas con ∑ 1, que diverge y no permite concluir
- C) Hay que usar el criterio de la raíz para decidir · [criterio-ineficiente] usas un criterio que aquí no decide
- D) No se puede saber: el criterio del término solo sirve cuando el término tiende a 0 · [termino-a-cero] confundes el criterio del término general

### P9 · dificultad 3 · kc: serie-potencias
Una serie de potencias ∑aₙ(x-c)ⁿ tiene radio de convergencia R = 4. ¿Qué puedes afirmar?

- A) Converge absolutamente para |x-c| < 4 · CORRECTA
- B) Converge para todo x en (0, 4) · [radio-sin-centro] interpretas R como intervalo absoluto sin considerar el centro c
- C) Diverge para x = c + 4 siempre · [extremos-asumidos] asumes divergencia en los extremos sin verificar
- D) R = 4 significa que converge solo en 4 puntos · [radio-como-puntos] confundes radio con número de puntos

### P41 · dificultad 2 · kc: serie-potencias · borrador
La serie ∑ (x − 3)ⁿ/2ⁿ tiene radio de convergencia R = 2. ¿Dónde converge con seguridad?

- A) En (1, 5) · CORRECTA
- B) En (−2, 2) · [radio-sin-centro] olvidas que el intervalo va centrado en 3
- C) En [1, 5], incluidos los extremos · [extremos-asumidos] incluyes los extremos sin verificarlos
- D) Solo en x = 1 y en x = 5 · [radio-como-puntos] confundes el radio con puntos aislados

### P42 · dificultad 3 · kc: serie-potencias, serie-criterio · borrador
∑ xⁿ/n tiene R = 1. ¿Qué pasa en x = −1 y en x = 1?

- A) Converge en x = −1 y diverge en x = 1 · CORRECTA
- B) Diverge en los dos, porque en el borde siempre diverge · [extremos-asumidos] decides qué pasa en los extremos sin verificarlos
- C) Converge en los dos, porque 1/n tiende a 0 · [termino-a-cero] crees que si el término tiende a 0 la serie converge
- D) Diverge en los dos, porque R = 1 quiere decir que solo converge en x = 0 · [radio-como-puntos] confundes el radio con puntos aislados

### P10 · dificultad 2 · kc: serie-taylor
Para encontrar la serie de Taylor de f(x) = eˣ centrada en x = 0, necesitas:

- A) Calcular f⁽ⁿ⁾(0) para todo n y usar ∑(f⁽ⁿ⁾(0)/n!)xⁿ · CORRECTA
- B) Integrar eˣ repetidamente · [taylor-integra] confundes derivadas con integrales en la construcción de la serie
- C) Usar la serie de ln(x) · [taylor-funcion-equivocada] confundes eˣ con su función inversa
- D) Solo calcular f'(0) y f''(0) · [taylor-trunca] crees que la serie termina después de dos términos

### P43 · dificultad 2 · kc: serie-taylor · borrador
En la serie de Taylor de sen(x) centrada en 0, el coeficiente de x³ es:

- A) −1/6 · CORRECTA
- B) −1 · [olvida-factorial] usas f'''(0) sin dividir entre 3!
- C) 1/6 · [taylor-funcion-equivocada] usas el signo de otra serie conocida
- D) 0, porque solo cuentan f(0) y f'(0) · [taylor-trunca] crees que la serie termina después de pocos términos

### P44 · dificultad 3 · kc: serie-taylor · borrador
Los primeros términos de la serie de Taylor de ln(1 + x) centrada en 0 son:

- A) x − x²/2 + x³/3 − … · CORRECTA
- B) x − x² + 2x³ − … · [olvida-factorial] usas las derivadas sin dividir entre n!
- C) 1 + x + x²/2 + x³/6 + … · [taylor-funcion-equivocada] usas la serie de eˣ
- D) x − x²/2, y ahí termina · [taylor-trunca] crees que la serie termina después de pocos términos

### P45 · dificultad 2 · kc: serie-taylor · borrador
Para el coeficiente de x² en la serie de Taylor de f centrada en 0, calculas:

- A) f''(0)/2 · CORRECTA
- B) La segunda integral de f evaluada en 0 · [taylor-integra] construyes los coeficientes integrando en vez de derivando
- C) f''(0) · [olvida-factorial] no divides entre 2!
- D) 1/2, igual que en la serie de eˣ · [taylor-funcion-equivocada] usas la serie de otra función conocida

## aplicaciones-integral · Aplicaciones de la integral

kc: app-volumen · Plantear volúmenes de revolución con discos o cascarones
kc: app-arco · Plantear la longitud de arco
kc: app-area · Plantear el área entre curvas
mc: radio-sin-cuadrado · app-volumen · olvidas elevar al cuadrado el radio
mc: omite-pi · app-volumen · omites el factor π o 2π
mc: discos-vs-cascarones · app-volumen · confundes o mezclas los métodos de discos y cascarones
mc: arco-solo-derivada · app-arco · crees que la longitud es la integral de la derivada
mc: arco-f-en-vez-de-fprima · app-arco · usas f(x) en lugar de f'(x) en la fórmula
mc: arco-distancia-vertical · app-arco · usas la diferencia de alturas en vez de la longitud de la curva
mc: area-sin-orden · app-area · restas las curvas en el orden equivocado
mc: area-sin-intersecciones · app-area · usas límites que no son los puntos de corte
mc: area-integra-una · app-area · integras solo una de las curvas

### P11 · dificultad 2 · kc: app-volumen
El volumen de un sólido de revolución al rotar y = f(x) alrededor del eje x entre a y b es:

- A) π∫[f(x)]²dx de a a b · CORRECTA
- B) π∫f(x)dx de a a b · [radio-sin-cuadrado] olvidas elevar al cuadrado el radio
- C) ∫[f(x)]²dx de a a b · [omite-pi] omites el π en la fórmula del volumen
- D) 2π∫xf(x)dx de a a b · [discos-vs-cascarones] confundes método de discos con método de cascarones

### P46 · dificultad 2 · kc: app-volumen · borrador
El volumen al rotar y = √x, entre x = 0 y x = 4, alrededor del eje x es:

- A) 8π · CORRECTA
- B) 16π/3 · [radio-sin-cuadrado] olvidas elevar al cuadrado el radio
- C) 8 · [omite-pi] omites el π en la fórmula del volumen
- D) 2π·∫ de 0 a 4 de x·√x dx · [discos-vs-cascarones] usas cascarones para una rotación alrededor del eje x

### P47 · dificultad 3 · kc: app-volumen · borrador
Rotas la región bajo y = x², entre x = 0 y x = 2, alrededor del eje y. Con cascarones, el volumen es:

- A) 2π·∫ de 0 a 2 de x·x² dx = 8π · CORRECTA
- B) π·∫ de 0 a 2 de (x²)² dx · [discos-vs-cascarones] usas discos alrededor del eje x en vez de cascarones
- C) ∫ de 0 a 2 de x·x² dx = 4 · [omite-pi] omites el factor 2π
- D) 2π·∫ de 0 a 2 de x²·x² dx · [discos-vs-cascarones] mezclas la altura con el radio del cascarón

### P12 · dificultad 3 · kc: app-arco
Para calcular la longitud de arco de y = f(x) de a a b, usas:

- A) ∫√(1 + [f'(x)]²)dx de a a b · CORRECTA
- B) ∫f'(x)dx de a a b · [arco-solo-derivada] crees que la longitud es solo la integral de la derivada
- C) ∫√([f(x)]²)dx de a a b · [arco-f-en-vez-de-fprima] confundes la fórmula usando f(x) en lugar de f'(x)
- D) [f(b) - f(a)] · [arco-distancia-vertical] usas la distancia vertical en lugar de la longitud de curva

### P48 · dificultad 2 · kc: app-arco · borrador
La longitud de y = x^(3/2) entre x = 0 y x = 1 se plantea como:

- A) ∫ de 0 a 1 de √(1 + (9/4)·x) dx · CORRECTA
- B) ∫ de 0 a 1 de (3/2)·√x dx · [arco-solo-derivada] crees que la longitud es la integral de la derivada
- C) ∫ de 0 a 1 de √(1 + x³) dx · [arco-f-en-vez-de-fprima] usas f(x) en lugar de f'(x)
- D) f(1) − f(0) = 1 · [arco-distancia-vertical] usas la diferencia de alturas en vez de la longitud de la curva

### P49 · dificultad 3 · kc: app-arco · borrador
La longitud de la recta y = 2x entre x = 0 y x = 3 es:

- A) 3√5 · CORRECTA
- B) 6, la diferencia de alturas f(3) − f(0) · [arco-distancia-vertical] usas la diferencia de alturas en vez de la longitud de la curva
- C) ∫ de 0 a 3 de 2 dx · [arco-solo-derivada] crees que la longitud es la integral de la derivada
- D) ∫ de 0 a 3 de √(1 + 4x²) dx · [arco-f-en-vez-de-fprima] usas f(x) en lugar de f'(x)

### P50 · dificultad 2 · kc: app-area · borrador
El área entre y = x y y = x², entre sus puntos de corte, es:

- A) ∫ de 0 a 1 de (x − x²) dx = 1/6 · CORRECTA
- B) ∫ de 0 a 1 de (x² − x) dx = −1/6 · [area-sin-orden] restas la curva de arriba a la de abajo
- C) ∫ de 0 a 2 de (x − x²) dx · [area-sin-intersecciones] usas límites que no son los puntos de corte
- D) ∫ de 0 a 1 de x dx = 1/2 · [area-integra-una] integras solo una de las curvas

### P51 · dificultad 3 · kc: app-area · borrador
El área encerrada entre y = 4 − x² y el eje x es:

- A) 32/3 · CORRECTA
- B) −32/3 · [area-sin-orden] restas la parábola al eje en vez de al revés
- C) ∫ de 0 a 4 de (4 − x²) dx · [area-sin-intersecciones] usas límites que no son los puntos de corte
- D) ∫ de −2 a 2 de x² dx = 16/3 · [area-integra-una] integras solo una de las curvas
