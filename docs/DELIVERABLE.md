```
Instituto Tecnológico de Sonora
Departamento de Computación y Diseño
```
# 1er Avance de Proyecto

### ALUMNOS:

00000244913 - Jesús Roberto García Armenta
00000247782 - Eliana Monge Cámara
00000245791 - Jonathan Astorga

00000246904 - Francisco Valdez Gastelum
00000181437 - Alonso Donnet Garcia Renteria

HORARIO: 3pm MaJu

MAESTRO: Gilberto Borrego Soto

```
Cd. Obregón, Sonora a 12 de octubre del 2025
```

## Casos de Uso

Administración de Sorteos - Casos de Uso


## Product Backlog - Historias de Usuario

**Rol: Cliente**

Este rol abarca desde un visitante que explora los sorteos hasta un cliente que ha
comprado números.

Autenticación y Gestión de Cuenta

**1. Registro de Usuario:**

```
Como visitante, quiero crear una cuenta con mi nombre y correo electrónico,
para poder participar en los sorteos y gestionar mis compras.
```
**2. Inicio de Sesión:**

```
Como usuario registrado con mi respectivo rol, quiero iniciar sesión con mi
correo y contraseña, para acceder a mi panel personal y ver mis números.
```
**3. Recuperación de Contraseña:**

```
Como usuario, quiero poder solicitar un enlace para restablecer mi contraseña
si la olvido, para recuperar el acceso a mi cuenta.
```
**4. Ver Mi Panel Personal:**

```
Como cliente, quiero acceder a un panel donde pueda ver un resumen de todos
los números para ver que he apartado o pagado, organizados por sorteo.
```
**Interacción con los Sorteos**

**5. Consultar Sorteos:**

```
Como usuario, quiero ver una galería con todos los sorteos activos, mostrando
su imagen, premio y precio, para decidir en cuál participar.
```
**6. Ver Tabla de Números:**

```
Como usuario, quiero ver la tabla completa de números de un sorteo,
diferenciando visualmente los disponibles, apartados y pagados, para saber
cuáles puedo elegir al momento de elegir un sorteo.
```

**7. Apartar Uno o Más Números:**

```
Como cliente, quiero seleccionar los números disponibles que me interesan y
apartarlos a mi nombre, para asegurar mi participación mientras realizo el pago.
```
**8. Registrar Comprobante de Pago:**

```
Como cliente, al momento de comprar mis números y que pagó por
transferencia o depósito, quiero subir una foto o archivo de mi comprobante de
pago, para que el organizador valide mi compra.
```
**9. Pagar Números en Línea:**

```
Como cliente al momento de comprar mis números, quiero tener la opción de
pagar mis números apartados con tarjeta de crédito o débito directamente en el
sitio, para confirmar mi compra de forma instantánea.
```
**10. Liberar Números Apartados:**

```
Como cliente, quiero poder cancelar una reservación que hice, para liberar los
números si ya no deseo participar o si me equivoqué al seleccionarlos siempre y
cuando estos aún no hayan sido pagados.
```
**Rol: Organizador**

Este rol corresponde al administrador del sistema, quien tiene el control total sobre los
sorteos y la gestión de la plataforma.

**Gestión de Sorteos**

**11. Consultar Sorteos:**

```
Como organizador, quiero ver una galería con todos los sorteos activos que yo
publique, mostrando su imagen, premio y precio, para decidir en cuál realizar
cambios si es necesario o solo para ver sus estados.
```
**12. Crear Sorteo:**

```
Como organizador, quiero crear un nuevo sorteo definiendo su nombre, una
imagen representativa, el rango de números, el precio por número, tiempo límite
de apartado, el período de venta y la fecha en que se realizará, para ponerlo a
disposición del público.
```

**13. Modificar Sorteo:**

```
Como organizador, quiero poder editar los detalles de un sorteo ya creado, para
corregir cualquier error o actualizar la información.
```
**14. Eliminar Sorteo:**

```
Como organizador, quiero eliminar un sorteo, para que ya no sea visible para
los usuarios siempre y cuando no exista ningún ticket pagado.
```
**Administración de Números y Pagos**

**Gestionar numeros:**

**15. Ver Estado Detallado de Números:**

```
Como organizador, quiero visualizar la tabla de números de un sorteo y ver
quién apartó o pagó cada uno, para tener un control completo de las ventas.
```
**16. Liberar Números Apartados:**

```
Como organizador, quiero poder liberar uno o más números que fue apartado,
para ponerlo disponible nuevamente si el cliente no realizó el pago a tiempo o lo
solicitó.
```
**17. Validar Comprobante y Marcar como Pagado:**

```
Como organizador, quiero revisar los comprobantes de pago enviados por los
clientes y, tras validarlos, marcar los números seleccionados por el cliente como
"Pagados" para confirmar su participación.
```
**18. Liberar Números por Vencimiento (Automático):**

```
Como organizador, quiero que el sistema libere automáticamente los números
cuyo tiempo de apartado ha expirado, para no tener que hacerlo manualmente.
```
**Tableros y Reportes**

**19. Ver Tablero de Control del Sorteo:**

```
Como organizador, quiero ver un tablero de control para cada sorteo que
muestre en tiempo real el monto recaudado, el monto pendiente de cobro, el
```

```
número de boletos vendidos, apartados y disponibles, y los días restantes para
el cierre para tener control del sorteo.
```
**20. Generar Reporte de Deudores:**

```
Como organizador, quiero generar un reporte descargable de deudores, que
incluya el nombre del cliente, sus números apartados y el monto total pendiente,
para facilitar el seguimiento de los pagos.
```
**21. Generar Reporte de Estado de Números:**

```
Como organizador, quiero generar un reporte detallado que liste todos los
números de un sorteo con su estado (libre, apartado, pagado) y los datos del
cliente asociado para mejor gestión de los números.
```
**22. Generar Reporte Histórico de Sorteos:**

```
Como organizador, quiero generar un reporte histórico de sorteos finalizados,
que resuma el monto recaudado, la cantidad de números vendidos y los que
quedaron libres, para analizar el rendimiento pasado.
```
**Configuración y Automatización**

**23. Establecer Tiempo Límite de Pago Predeterminado:**

```
Como organizador, quiero poder definir un tiempo límite de pago global que
funcione como valor predeterminado, para que sea el valor por defecto de los
nuevos sorteos, para agilizar la configuración sin perder la capacidad de hacer
excepciones.
```
**24. Configurar Recordatorios de Pago Automáticos:**

```
Como organizador, quiero configurar el tiempo en el cual el sistema envía
recordatorios de pago por correo electrónico a los clientes que tengan números
apartados y cuyo plazo de pago esté por vencer, para incentivar la compra y
reducir mi carga de trabajo.
```

## Priorización del Product Backlog - MOSCOW

**Administración de Sorteos - MOSCOW**

## Tabla de Justificación de Priorización MoSCoW

**Must Have**

```
ID Historia de Usuario Justificación
```
```
HU-1 Registro de Usuario Requisito básico para identificar participantes y permitir transacciones
```
```
HU-2 Inicio de Sesión Autenticación necesaria para acceder a funcionalidades por rol
```

```
ID Historia de Usuario Justificación
```
```
HU-5/11 Consultar Sorteos Sin catálogo visible no hay descubrimiento ni participación posible
```
```
HU-6 Ver Tabla de Números Esencial para que clientes vean disponibilidad antes de apartar
```
```
HU-7 Apartar Números Funcionalidad core del negocio - reservación temporal de números
```
```
HU-8 Registrar Comprobante de Pago Método de pago simple que permite completar transacciones
```
```
HU-12 Crear Sorteo Sin sorteos no existe producto - funcionalidad fundamental
```
```
HU-16 Liberar Números Apartados (Organizador) Crítico para prevenir bloqueo de inventario por apartados no pagados
```
```
HU-17 Validar Comprobante y Marcar como
Pagado
```
```
Completa el flujo de compra y confirma participación en sorteo
```
**Should Have**

```
ID Historia de Usuario Justificación
```
```
HU-4 Panel Personal Cliente Mejora significativa de UX - cliente necesita ver sus participaciones
consolidadas
```
```
HU-10 Liberar Números Apartados (Cliente) Autonomía del usuario para corregir errores sin contactar soporte
```
```
HU-15 Ver Estado Detallado de Números Visibilidad granular para organizador sobre quién apartó/pagó cada número
```
```
HU-19 Ver Tablero de Control Dashboard operacional para tomar decisiones informadas sobre el sorteo
```

**Could Have**

```
ID Historia de Usuario Justificación
```
```
HU-3 Recuperación de Contraseña Mejora UX pero workaround disponible (contactar admin para reset)
```
```
HU-9 Pagar Números en Línea Optimización de conversión - método con comprobante ya funciona
```
```
HU-13 Modificar Sorteo Caso edge poco frecuente - puede recrear sorteo si error antes de publicar
```
```
HU-14 Eliminar Sorteo Caso edge - puede marcar como inactivo o eliminar manualmente en BD
```
**Want to Have**

```
ID Historia de Usuario Justificación
```
```
HU-18 Liberar Números por Vencimiento
(Automático)
```
```
Automatización que puede hacerse manualmente con HU-16 inicialmente
```
```
HU-20 Generar Reporte de Deudores Analítica no transaccional - query SQL manual suficiente para MVP
```
```
HU-21 Generar Reporte de Estado de Números Información redundante con HU-6 que ya muestra estado visualmente
```
```
HU-22 Generar Reporte Histórico Sin sentido hasta tener múltiples sorteos completados con historial
```
```
HU-23 Establecer Tiempo Límite
Predeterminado
```
```
Valor hardcodeado (48h) funciona - organizador puede sobrescribir por
sorteo
```
```
HU-24 Configurar Recordatorios Automáticos Automatización secundaria - seguimiento puede hacerse manualmente
inicialmente
```

## Estimación del Proyecto por Puntos de Caso de Uso

**Paso 1: Calcular el Peso de los Actores (AW)**

Esto mide la complejidad de quién usa el sistema, la clasificación es específica:

```
● Simple: Otro sistema (API).
```
```
● Medio: Interfaz por línea de comandos.
```
```
● Complejo: Una persona interactuando con una interfaz gráfica.
```
**Aplicado al proyecto:** Tanto el Cliente como el Organizador interactúan con el sistema
a través de una interfaz gráfica (una página web). Por lo tanto, ambos se clasifican
como Complejos.

```
Actor Clasificación (según tu presentación) Peso Total
```
```
Cliente Complejo (interfaz gráfica) 3 3
```
```
Organizador Complejo (interfaz gráfica) 3 3
```
```
Total UAW 6
```
**Paso 2: Calcular el Peso de los Casos de Uso (UUCW)**

Esto mide la complejidad de qué hace el sistema. Se basa en el número de
"transacciones" o pasos de cada gran proceso.

```
● Simple: 3 o menos transacciones.
```
```
● Medio: 4 a 7 transacciones.
```
```
● Complejo: Más de 7 transacciones.
```
**Aplicado al proyecto:** Aquí clasificamos los 5 grandes procesos que ya habíamos
identificado.

```
Caso de Uso (CU) Justificación (Número de
Pasos/Transacciones)
```
```
Clasificaci
ón
```
```
Peso
Fijo
```

```
Gestión de
Cuentas y Perfiles
```
```
Flujos de registro, login, recuperación y
panel. Son alrededor de 4-5 flujos
distintos.
```
```
Medio 10
```
```
Interacción con los
Sorteos
```
```
Ver lista, ver tabla, apartar, cancelar, y el
complejo flujo de pagar en línea. Supera
las 7 transacciones.
```
```
Complejo 15
```
```
Gestión de Sorteos El proceso de "Crear Sorteo" por sí solo
tiene más de 7 campos y reglas, más
modificar y eliminar.
```
```
Medio 10
```
```
Administración de
Números y Pagos
```
```
Ver detalle, validar comprobante, liberar
manual y el proceso automático de
liberación. Son 4-5 flujos.
```
```
Medio 10
```
```
Reportería y
Configuración
```
```
Incluye el tablero, 3 reportes, 2 tipos de
parámetros y recordatorios. Son más de
7 funciones distintas.
```
```
Complejo 15
```
```
Total UUCW 60
```
**Nota Metodológica sobre Granularidad:**

Para la estimación por Puntos de Caso de Uso, se utilizó un enfoque de casos de uso
de alto nivel, agrupando las 24 historias de usuario identificadas en 5 módulos
funcionales principales. Este nivel de granularidad es apropiado para estimaciones
tempranas de proyecto según la metodología UCP de Karner, siempre que todos los
casos de uso mantengan consistencia en su nivel de abstracción, lo cual se cumple en
este análisis. Los módulos representan objetivos funcionales completos del sistema y
permiten una estimación confiable del esfuerzo total del proyecto.


```
Paso 3: Calcular el Total (UUCP)
```
```
Este es el paso final de esta sección. Simplemente se suman los dos resultados
anteriores.
```
```
● Fórmula: UUCP = UAW + UUCW
```
```
● Cálculo para el proyecto: UUCP = 6 (de los Actores) + 60 (de los Casos de
Uso) UUCP = 66
```
```
El resultado para esta sección es 66 UUCP. Este es el número que se usará en los
siguientes pasos con los factores TCF y EF para obtener la estimación final.
```
```
Tabla de Factores Técnicos (TCF):
```
**Facto
r**

```
Descripción Peso Influencia
(0-5)
```
```
Justificación Resultado
(Peso *
Influencia)
```
T1 Sistema
distribuido

```
2 4 El sistema es una aplicación
web (cliente/servidor), por lo
que es distribuido.
```
### 8

T2 Rendimiento 1 3 Queremos que sea rápido,
pero no es un sistema de
transacciones masivas.
Influencia promedio.

### 3

T3 Eficiencia del
usuario final

```
1 4 La interfaz debe ser muy fácil
de usar para los clientes y el
organizador.
```
### 4

T4 Complejidad
del
procesamiento
interno

```
1 2 La lógica (apartar, liberar,
validar) no es
extremadamente compleja.
```
### 2


T5 Reusabilidad
del código

```
1 3 Queremos que el código sea
mantenible a futuro.
Influencia promedio.
```
### 3

T6 Facilidad de
instalación

```
0.5 2 La instalación será en un
servidor web, un proceso
estándar. Poca influencia.
```
### 1

T7 Facilidad de
uso

```
0.5 5 El éxito del sistema depende
de que sea muy fácil de usar
para todos.
```
### 2.

T8 Portabilidad 2 2 Se desarrollará para la web,
por lo que es portable, pero
no es un requisito crítico
cambiar de tecnología.

### 4

T9 Facilidad de
cambio

```
1 3 Es probable que los
requisitos cambien. El
sistema debe ser adaptable.
Influencia promedio.
```
### 3

T10 Concurrencia 1 3 Varios usuarios podrían
intentar apartar números al
mismo tiempo. Debe
manejarse bien.

### 3

T11 Características
de seguridad
especiales

```
1 4 El manejo de cuentas de
usuario y pagos requiere
buena seguridad.
```
### 4

T12 Acceso a
SGBD de
terceros

```
1 0 No aplica, usaremos una
base de datos estándar.
```
### 0


T13 Facilidades de
entrenamiento

```
1 1 El sistema debe ser tan
intuitivo que casi no requiera
entrenamiento.
```
### 1

### SUMATORIA TOTAL 38.

```
Cálculo del Factor de Complejidad Técnica (TCF):
```
```
● Fórmula: TCF = 0.6 + (0.01 * Sumatoria)
```
```
● Tu Sumatoria: 38.
```
```
● Cálculo: TCF = 0.6 + (0.01 * 38.5) = 0.6 + 0.385 = 0.
```
```
Tabla de Factores de Entorno (EF):
```
Factor Descripción Peso **Influencia
(0-5)**

```
Justificación Resultado
(Peso *
Influencia)
```
F1 Familiaridad
con RUP/Agile

```
1.5 3 Asumimos que el equipo
tiene un conocimiento
promedio de la metodología.
```
### 4.

F2 Experiencia en
la aplicación

```
0.5 2 El equipo entiende el
problema de los sorteos,
pero no ha construido este
sistema antes.
```
### 1

F3 Experiencia en
orientación a
objetos

```
1 4 Asumimos que el equipo
tiene buena experiencia en
programación orientada a
objetos.
```
### 4

F4 Capacidades
de análisis

```
0.5 3 El equipo puede analizar los
requisitos de manera
adecuada. Promedio.
```
### 1.


F5 Motivación 1 **4** Es un proyecto propio y útil
para una asociación, la
motivación debería ser alta.

### 4

F6 Requisitos
estables

```
2 2 Es probable que los
requisitos cambien un poco,
no son 100% estables.
```
### 4

F7 Trabajadores a
tiempo parcial

```
-1 5 Todo el equipo (5 personas)
es a tiempo parcial
```
### -

F8 Lenguaje de
programación
complejo

```
-1 0 No se usará un lenguaje
complejo.
```
### 0

### SUMATORIA TOTAL 14

```
Cálculo del Factor de Entorno (EF):
```
```
● Fórmula: EF = 1.4 + (-0.03 * Sumatoria)
```
```
● Tu Sumatoria: 14
```
```
● Cálculo: EF = 1.4 + (-0.03 * 14) = 1.4 - 0.42 = 0.
```
```
Paso 2: Calcular los Puntos de Caso de Uso Ajustados (UCP)
```
```
Ahora combinas el tamaño en bruto (UUCP) con los factores de ajuste que acabas de
calcular.
```
```
● Fórmula: UCP = UUCP * TCF * EF
```
```
● Datos:
```
```
○ UUCP = 60
```
```
○ TCF = 0.
```
```
○ EF = 0.
```

```
● Cálculo: UCP = 60 * 0.985 * 0.98 = 57.9 ≈ 58
```
Redondeamos al número entero más cercano. El tamaño final y ajustado de tu proyecto
es de **58 UCP**.

**Paso 3: Determinar el Esfuerzo y la Duración del Proyecto**

```
● Determinar el Factor de Productividad:
```
```
○ La regla dice: "Contar factores F1-F6 con influencia < 3"
```
```
■ De los cuales tienen 2 (F2=2, F6=2).
```
```
○ "y factores F7-F8 con influencia > 3"
```
```
■ De los cuales se tiene 1 (F7=5).
```
```
○ Total = 3. Un total de 3 corresponde a un factor de 28 horas/hombre por
UCP.
```
```
● Calcular el Esfuerzo Total en Horas:
```
```
○ Fórmula: Esfuerzo = UCP * Factor de Productividad
```
```
○ Cálculo: Esfuerzo = 58 UCP * 28 horas/UCP = 1,624 horas
```
```
● Calcular la Duración Final en Semanas:
```
```
○ Fórmula: Duración = Esfuerzo Total / Capacidad del Equipo por Semana
```
```
○ Cálculo: Duración = 1,624 horas / 100 horas/semana = 16.24 semanas =
17 semanas
```

## Definición del Primer Sprint

El primer ciclo de desarrollo (Sprint 1) tendrá una duración de 3 semanas. Basado en la
estimación de la velocidad del equipo de aproximadamente 18 puntos de historia por
sprint, se ha seleccionado el siguiente conjunto de funcionalidades para construir el
esqueleto funcional del sistema.

**Objetivo del Sprint 1:**

```
"Al final del sprint, un organizador podrá registrarse en el sistema, iniciar
sesión, crear un sorteo completamente funcional y publicarlo. Cualquier
visitante podrá consultar la lista de sorteos disponibles y ver la tabla
detallada de números con sus estados (disponible, apartado, pagado)."
```
**Sprint Backlog #1: A continuación, se presentan las historias de usuario
seleccionadas para este sprint:**

```
● HU-01: Registro de Usuario
```
```
● HU-02: Inicio de Sesión
```
```
● HU-05: Consultar Lista de Sorteos
```
```
● HU-06: Ver Tabla de Números
```
```
● HU-12: Crear Sorteo
```
**Detalle de Historias de Usuario del Sprint 1**

Dado que se ha optado por la gestión ágil a través de Historias de Usuario, a
continuación se detallan los Criterios de Aceptación para cada elemento del Sprint
Backlog utilizando el formato de Desarrollo Guiado por el Comportamiento (BDD).

**HU-01: Registro de Usuario**

**Como** visitante, **quiero** crear una cuenta con mi nombre y correo electrónico, **para**
poder participar como organizador en el sistema de sorteos.

**Criterios de Aceptación:**

**Escenario 1: Registro exitoso**

- **Dado que** soy un visitante en la página de registro,


- **cuando** completo el formulario con nombre, correo electrónico válido y
    contraseña,
- **entonces** el sistema crea mi cuenta, me muestra un mensaje de confirmación
    "Registro exitoso" y me redirige a la página de inicio de sesión.

**Escenario 2: Intento de registro con correo duplicado**

- **Dado que** estoy en la página de registro,
- **cuando** ingreso un correo electrónico que ya está registrado en el sistema,
- **entonces** el sistema no crea la cuenta y me muestra un mensaje de error "Este
    correo ya está registrado".

**Escenario 3: Intento de registro con datos incompletos**

- **Dado que** estoy en la página de registro,
- **cuando** intento enviar el formulario sin completar uno o más campos obligatorios
    (nombre, correo o contraseña),
- **entonces** el sistema no crea la cuenta y me muestra mensajes de error junto a
    cada campo vacío indicando "Este campo es obligatorio".

**Escenario 4: Validación de formato de correo**

- **Dado que** estoy en la página de registro,
- **cuando** ingreso un correo con formato inválido (sin @, sin dominio, etc.),
- **entonces** el sistema me muestra un mensaje de error "Formato de correo
    electrónico inválido" y no permite enviar el formulario.

**HU-02: Inicio de Sesión**

**Como** usuario registrado con mi respectivo rol, **quiero** iniciar sesión con mi correo y
contraseña, **para** acceder a mi panel personal según mi perfil (organizador o cliente).

**Criterios de Aceptación:**

**Escenario 1: Inicio de sesión exitoso como organizador**

- **Dado que** soy un organizador con una cuenta existente y estoy en la página de
    login,
- **cuando** ingreso mi correo y contraseña correctos y presiono "Ingresar",


- **entonces** soy redirigido al panel de control del organizador mostrando mis
    sorteos.

**Escenario 2: Credenciales incorrectas**

- **Dado que** estoy en la página de login,
- **cuando** ingreso un correo o contraseña incorrectos y presiono "Ingresar",
- **entonces** permanezco en la página de login y veo un mensaje de error
    "Credenciales inválidas. Por favor verifica tu correo y contraseña".

**Escenario 3: Campos vacíos**

- **Dado que** estoy en la página de login,
- **cuando** intento iniciar sesión dejando el correo o la contraseña vacíos,
- **entonces** el sistema me muestra un mensaje de error "Todos los campos son
    obligatorios" y no procesa el inicio de sesión.

**HU-05: Consultar Sorteos**

**Como** usuario, **quiero** ver una galería con todos los sorteos activos, mostrando su
imagen, premio y precio, **para** decidir en cuál participar o gestionar.

**Criterios de Aceptación:**

**Escenario 1: Visitante ve sorteos activos**

- **Dado que** soy un visitante (no autenticado) en la página principal del sistema,
- **cuando** la página carga,
- **entonces** veo una galería mostrando todos los sorteos activos con su imagen,
    nombre del premio y precio por número.

**Escenario 2: No hay sorteos disponibles para visitantes**

- **Dado que** soy un visitante en la página principal y no existen sorteos activos en
    el sistema,
- **cuando** la página carga,
- **entonces** veo un mensaje claro que dice "No hay sorteos disponibles en este
    momento. Vuelve pronto para participar".

**Escenario 3: Organizador ve sus sorteos**


- **Dado que** soy un organizador autenticado con sorteos publicados,
- **cuando** accedo a la sección "Mis Sorteos",
- **entonces** veo una galería mostrando todos mis sorteos con su imagen, nombre
    del premio, precio y estado (activo/finalizado).

**Escenario 4: Organizador sin sorteos creados**

- **Dado que** soy un organizador autenticado sin sorteos en el sistema,
- **cuando** accedo a la sección "Mis Sorteos",
- **entonces** veo el mensaje "No has creado sorteos aún" y un botón destacado
    "Crear Nuevo Sorteo" que me permite comenzar.

**HU-06: Ver Tabla de Números**

**Como** usuario, **quiero** ver la tabla completa de números de un sorteo, diferenciando
visualmente los disponibles, apartados y pagados, **para** saber cuáles puedo elegir al
momento de consultar un sorteo.

**Criterios de Aceptación:**

**Escenario 1: Visualización de tabla de sorteo activo**

- **Dado que** soy un usuario que ha seleccionado un sorteo de la galería,
- **cuando** la página de detalles del sorteo carga,
- **entonces** veo una cuadrícula ordenada mostrando todos los números del sorteo
    donde:
       - Los números disponibles tienen fondo verde y son clicables,
       - Los números apartados tienen fondo amarillo con icono de reloj,
       - Los números pagados tienen fondo azul y muestran texto "Vendido",
       - y puedo identificar claramente el estado de cada número.

**Escenario 2: Visualización desde perspectiva de organizador**

- **Dado que** soy un organizador visualizando la tabla de uno de mis sorteos,
- **cuando** la página de detalles carga,
- **entonces** además de ver los estados de los números, puedo ver información
    adicional como el nombre del cliente asociado a números apartados o pagados
    (visible solo para organizador).


**Escenario 3: Tabla de sorteo sin números vendidos**

- **Dado que** soy un usuario visualizando un sorteo recién creado,
- **cuando** accedo a la tabla de números,
- **entonces** veo todos los números con estado "Disponible" (fondo verde)
    indicando que el sorteo está completamente disponible para participar.

**HU-12: Crear Sorteo**

**Como** organizador, **quiero** crear un nuevo sorteo definiendo su nombre, imagen, rango
de números, precio, tiempo límite de apartado, período de venta y fecha de realización,
**para** ponerlo a disposición del público.

**Criterios de Aceptación:**

**Escenario 1: Creación exitosa del sorteo**

- **Dado que** soy un organizador autenticado en la sección "Crear Sorteo",
- **cuando** completo todos los campos obligatorios (nombre del sorteo, imagen,
    número inicial, número final, precio por número, fecha de inicio de ventas, fecha
    de cierre de ventas, fecha del sorteo) y presiono "Guardar",
- **entonces** el sistema crea el sorteo, me muestra un mensaje de confirmación
    "Sorteo creado exitosamente" y soy redirigido a "Mis Sorteos" donde puedo ver
    el sorteo recién creado.

**Escenario 2: Intento de crear sorteo con campos obligatorios vacíos**

- **Dado que** soy un organizador en el formulario de creación de sorteo,
- **cuando** intento guardar el sorteo sin completar uno o más campos obligatorios,
- **entonces** el sistema no crea el sorteo y me muestra mensajes de error junto a
    cada campo vacío indicando "Este campo es obligatorio".

**Escenario 3: Validación de rango de números inválido**

- **Dado que** estoy creando un sorteo,
- **cuando** ingreso un rango donde el número final es menor o igual al número
    inicial (ej: inicio 100, fin 50),
- **entonces** el sistema me muestra un mensaje de error "El número final debe ser
    mayor que el número inicial" y no permite crear el sorteo.


**Escenario 4: Validación de fechas inválidas**

- **Dado que** estoy creando un sorteo,
- **cuando** ingreso una fecha de sorteo que es anterior a la fecha de cierre de
    ventas,
- **entonces** el sistema me muestra un mensaje de error "La fecha del sorteo debe
    ser posterior a la fecha de cierre de ventas" y no permite crear el sorteo.

**Escenario 5: Validación de precio por número**

- **Dado que** estoy creando un sorteo,
- **cuando** ingreso un precio igual o menor a cero o con formato inválido,
- **entonces** el sistema me muestra un mensaje de error "El precio debe ser mayor
    a cero" y no permite crear el sorteo.

**Resumen del Sprint Backlog #1**

```
ID Historia de
Usuario
```
```
Prioridad Complejidad
Estimada
```
```
HU-01 Registro de Usuario Must Have Media
```
```
HU-02 Inicio de Sesión Must Have Media
```
```
HU-05 Consultar Lista de
Sorteos
```
```
Must Have Baja
```
```
HU-06 Ver Tabla de
Números
```
```
Must Have Media
```
```
HU-12 Crear Sorteo Must Have Alta
```
**Total de historias:** 5 historias de usuario
**Duración del Sprint:** 3 semanas
**Resultado esperado:** Sistema funcional que permite gestión básica de sorteos desde
el registro hasta la visualización pública.


**Estimación del Sprint Backlog - Planning Poker**

**Técnica de Estimación Seleccionada: Planning Poker**

Para la estimación de las historias de usuario del Sprint 1, el equipo utilizó la técnica de
**Planning Poker** , una metodología ágil colaborativa que promueve la participación de
todos los miembros del equipo y facilita el consenso a través de discusiones
estructuradas.

**Fundamento de la Técnica**

Planning Poker es una técnica de estimación basada en consenso que utiliza la
secuencia de Fibonacci (1, 2, 3, 5, 8, 13, 21...) para asignar puntos de historia a cada
tarea del backlog. Esta secuencia refleja la incertidumbre creciente a medida que
aumenta la complejidad de las tareas, evitando estimaciones demasiado precisas que
podrían generar falsas expectativas.

**Proceso de Estimación Realizado**

El equipo llevó a cabo la sesión de Planning Poker utilizando la plataforma en línea
**Planning Poker Online** (https://planningpokeronline.com/), siguiendo el siguiente
proceso :

1. **Presentación de Historia** : Cada historia de usuario fue presentada y discutida
    por el equipo para asegurar comprensión completa de los requisitos y criterios
    de aceptación.
2. **Votación Simultánea** : Los 5 miembros del equipo (Jonathan, Roberto García,
    Alonso Donnet, Eliana y Paquito) seleccionaron simultáneamente una carta
    representando su estimación de complejidad.
3. **Discusión y Consenso** : Cuando surgieron diferencias en las estimaciones, los
    miembros con valores más altos y más bajos justificaron sus puntos de vista,
    promoviendo una discusión técnica que enriqueció la comprensión colectiva.
4. **Re-votación** : El proceso se repitió hasta alcanzar consenso o convergencia en
    las estimaciones.


**Resultados de la Estimación**

```
ID Historia de
Usuario
```
```
Estimación (Story
Points)
```
```
Complejidad
```
```
HU-01 Registro de Usuario 3 Media
```
```
HU-02 Inicio de Sesión 3 Media
```
```
HU-05 Consultar Lista de
Sorteos
```
```
3 Baja-Media
```
```
HU-06 Ver Tabla de
Números
```
```
5 Media-Alta
```
```
HU-12 Crear Sorteo 3 Media
```
```
TOTAL SPRINT 1 17 puntos
```
**Análisis de las Estimaciones**

**HU-01: Registro de Usuario (3 puntos)**

**Consenso alcanzado** : El equipo convergió en 3 puntos tras discusión inicial.

**Justificación** : Incluye validación de formularios, encriptación de contraseñas,
verificación de correo duplicado y manejo de errores. Es una funcionalidad estándar
con complejidad moderada.

**HU-02: Inicio de Sesión (3 puntos)**

**Consenso alcanzado** : Votación inicial mostró variación (votaciones entre 2-5), pero
tras discusión el equipo convergió en 3 puntos.

**Justificación** : Requiere autenticación segura, gestión de sesiones, manejo de tokens y
validación de credenciales. Similar en complejidad a HU-01.

**HU-05: Consultar Lista de Sorteos (3 puntos)**

**Consenso alcanzado** : El equipo alcanzó acuerdo con promedio de 3.8, redondeado a
3 puntos.


**Justificación** : Vista de galería con datos básicos, filtrado por estado (activo/inactivo), y
manejo de casos sin sorteos disponibles. Principalmente frontend con queries simples
a base de datos.

**HU-06: Ver Tabla de Números (5 puntos)**

**Consenso alcanzado** : Estimación más alta del sprint, el equipo identificó mayor
complejidad.

**Justificación** : Requiere renderizado eficiente de grillas grandes (potencialmente
cientos de números), diferenciación visual por estado, optimización de performance, y
lógica condicional para mostrar información según rol de usuario (cliente vs
organizador). Es la historia técnicamente más demandante del sprint.

**HU-12: Crear Sorteo (3 puntos)**

**Consenso alcanzado** : El equipo convergió en 2.8 puntos, redondeado a 3.

**Justificación** : Formulario extenso con múltiples validaciones (fechas, rangos
numéricos, precios), carga de imágenes, y creación de registros en base de datos.
Aunque tiene muchos campos, la lógica es relativamente directa sin complejidad
algorítmica significativa.

**Capacidad del Sprint**

**Puntos comprometidos** : 17 puntos de historia

**Duración del sprint** : 3 semanas (15 días hábiles)

**Equipo** : 5 desarrolladores trabajando 4 horas/día

**Capacidad total** : 5 personas × 4 horas/día × 5 días/semana × 3 semanas = 300 horas

**Ratio estimado** : 300 horas ÷ 17 puntos ≈ **17.6 horas por punto de historia**

Este ratio es conservador y apropiado para un equipo realizando su primer sprint,
considerando tiempo de setup inicial, definición de arquitectura, y curva de aprendizaje.

**Evidencias de la Sesión de Planning Poker**

Las siguientes imágenes documentan el proceso de estimación colaborativa realizado
por el equipo:


**Imagen 1** : Sesión de votación para HU-02 (Inicio de Sesión), mostrando votaciones
iniciales de 3-5 puntos con consenso final en 3 puntos.

**Imagen 2** : Sesión de votación para HU-05 (Consultar Sorteos), con promedio de 3.8
puntos y consenso en 3 puntos.


**Imagen 3** : Sesión de votación para HU-01 (Registro de Usuario), donde se alcanzó
consenso en 3 puntos con participación del equipo completo.

**Imagen 4** : Sesión de votación para HU-12 (Crear Sorteo), mostrando convergencia en
2.8 puntos (3 puntos finales).


Todas las sesiones fueron realizadas utilizando Planning Poker Online, con
participación activa de los 5 miembros del equipo (Jonathan, Roberto García, Alonso
Donnet, Eliana y Paquito), siguiendo las mejores prácticas de estimación ágil.

**Conclusión de la Estimación**

El Sprint 1 con 17 puntos de historia representa una carga de trabajo realista y
alcanzable para el equipo, estableciendo una base sólida para el desarrollo del MVP
del sistema de administración de sorteos. La técnica de Planning Poker facilitó la
identificación temprana de complejidades técnicas (especialmente en HU-06) y
promovió un entendimiento compartido de los requisitos entre todos los miembros del
equipo.


