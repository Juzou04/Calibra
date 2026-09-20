---
id: calculo-vectorial
codigo: MATE-1207
nombre: Cálculo Vectorial
libro: Marsden y Tromba, Cálculo Vectorial, 6.ª ed.
contexto: antes del parcial 1
activa: true
longitud: 12
---

Subtemas tomados del cronograma oficial de MATE-1207 (secciones de Marsden entre paréntesis).

## parciales · Derivadas parciales y gradiente

2.3 a 2.6. Errores a cazar: derivar respecto a la variable equivocada, confundir el gradiente con la derivada direccional, y olvidar normalizar el vector de dirección.

### P1 · dificultad 2
Dada f(x,y) = x²y + y³, calcula ∂f/∂x en el punto (2,1).

- A) 4 · CORRECTA
- B) 7 · derivas respecto a y en lugar de x
- C) 4y · olvidas evaluar en el punto dado
- D) 2x + 3y² · calculas el gradiente completo en lugar de la derivada parcial pedida

### P2 · dificultad 2
Para f(x,y) = eˣʸ, el gradiente ∇f en (1,0) es:

- A) (0, 1) · CORRECTA
- B) (1, 0) · confundes las componentes del gradiente
- C) 0 · confundes el gradiente con la derivada direccional en alguna dirección
- D) (e, 1) · derivas pero no evalúas correctamente en el punto

### P3 · dificultad 2
La derivada direccional de f(x,y) = x² + y² en (1,1) en la dirección del vector (3,4) es:

- A) 2 · CORRECTA
- B) 10 · olvidas normalizar el vector de dirección
- C) (2, 2) · confundes la derivada direccional con el gradiente
- D) 2√2 · normalizas pero luego calculas la magnitud del gradiente en lugar del producto punto

## multiples · Integrales dobles y triples

5.1 a 6.3. Errores a cazar: invertir mal el orden de integración, no cambiar los límites al cambiar de variable, y olvidar el jacobiano.

### P4 · dificultad 2
Calcula ∫∫_R xy dA donde R es el rectángulo [0,2] × [0,1]. Al integrar primero respecto a x:

- A) 1 · CORRECTA
- B) 2 · inviertes mal el orden y no ajustas los límites correctamente
- C) 1/2 · integras primero respecto a y pero usas los límites como si fuera respecto a x
- D) 4 · olvidas dividir por los exponentes al integrar

### P5 · dificultad 2
Al convertir ∫∫_R f(x,y) dA a coordenadas polares donde R es el círculo x² + y² ≤ 4, los límites correctos son:

- A) 0 ≤ r ≤ 2, 0 ≤ θ ≤ 2π · CORRECTA
- B) 0 ≤ r ≤ 4, 0 ≤ θ ≤ 2π · no cambias correctamente el límite de r al cambiar de variable
- C) 0 ≤ r ≤ 2, 0 ≤ θ ≤ π · usas solo la mitad del círculo
- D) -2 ≤ r ≤ 2, 0 ≤ θ ≤ 2π · mantienes los límites rectangulares en lugar de adaptarlos a polares

### P6 · dificultad 2
Al calcular ∫∫_R e^(x²+y²) dA sobre el círculo unitario usando coordenadas polares, el elemento de área correcto es:

- A) r dr dθ · CORRECTA
- B) dr dθ · olvidas el jacobiano de la transformación
- C) r² dr dθ · confundes el jacobiano con el argumento de la función
- D) dθ dr · inviertes el orden sin el jacobiano

## linea · Integrales de línea

7.1 a 7.6. Errores a cazar: parametrizar con la orientación contraria, confundir la integral de un campo escalar con la de uno vectorial.

### P7 · dificultad 2
Calcula ∫_C y dx donde C es el segmento de (0,0) a (1,1) parametrizado como r(t) = (t, t) con 0 ≤ t ≤ 1:

- A) 1/2 · CORRECTA
- B) -1/2 · parametrizas con la orientación contraria
- C) 1 · confundes la integral de línea de un campo escalar con la de un campo vectorial
- D) 2 · integras y² en lugar de y

### P8 · dificultad 2
Para calcular ∫_C F·dr donde F = (y, -x) y C es el círculo unitario recorrido en sentido antihorario, la parametrización correcta es:

- A) r(t) = (cos t, sen t), 0 ≤ t ≤ 2π · CORRECTA
- B) r(t) = (sen t, cos t), 0 ≤ t ≤ 2π · parametrizas con orientación horaria
- C) r(t) = (cos t, sen t), 0 ≤ t ≤ π · solo recorres la mitad de la curva
- D) r(t) = (t, √(1-t²)), -1 ≤ t ≤ 1 · usas parametrización no cerrada

### P9 · dificultad 2
Si F = ∇f es un campo conservativo y C es una curva de A a B, entonces ∫_C F·dr es igual a:

- A) f(B) - f(A) · CORRECTA
- B) f(A) - f(B) · inviertes la orientación de la integral
- C) |F| · longitud(C) · confundes la integral de un campo vectorial con la de un campo escalar
- D) 0 · asumes que toda integral sobre un campo conservativo es cero

## teoremas · Green, Stokes y Gauss

8.1 a 8.4. Errores a cazar: aplicar Green a una curva que no es cerrada, equivocar la orientación de la frontera, y usar Gauss donde corresponde Stokes.

### P10 · dificultad 2
El teorema de Green permite calcular ∫_C P dx + Q dy como una integral doble sobre la región D cuando:

- A) C es una curva cerrada simple que encierra D · CORRECTA
- B) C es cualquier curva (no necesariamente cerrada) · aplicas Green a una curva que no es cerrada
- C) C es cerrada con orientación horaria · equivocas la orientación de la frontera
- D) P y Q son constantes · confundes las condiciones de aplicabilidad

### P11 · dificultad 2
Para aplicar el teorema de Stokes a ∫_C F·dr donde C es la frontera de una superficie S:

- A) C debe recorrerse según la regla de la mano derecha respecto a la normal de S · CORRECTA
- B) C debe recorrerse en sentido horario · equivocas la orientación de la frontera
- C) S debe ser una superficie cerrada · usas Gauss donde corresponde Stokes
- D) F debe ser conservativo · confundes las condiciones de Stokes

### P12 · dificultad 2
El teorema de Gauss (divergencia) relaciona ∫∫_S F·n dS con:

- A) ∫∫∫_V div F dV donde S encierra V · CORRECTA
- B) ∫∫_S rot F·n dS · usas Stokes donde corresponde Gauss
- C) ∫_C F·dr donde C es la frontera de S · aplicas teorema incorrecto para superficies cerradas
- D) 0 si F es conservativo · confundes campo conservativo con divergencia nula
