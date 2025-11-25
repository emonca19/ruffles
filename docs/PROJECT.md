# Sistema de administración de sorteos

Una asociación civil necesita hacer varias actividades mensualmente para financiarse. Una de esas actividades es la
organización de sorteos de diversos artículos o servicios. Estos sorteos se organizan de una manera convencional,
definiendo una numeración de manera inicial que se vacía en una tabla de Word y se ofrecen los números a través de
diferentes medios, como Whatsapp, Facebook, etc. Esta manera de operar tiene varios problemas:

1. Los que desean comprar un número para el sorteo, no tienen una manera de saber a ciencia cierta los números
    libres
2. La persona organizadora del sorteo tiene que estar publicando constantemente la tabla de números para que los
    interesados sepan que números están libres
3. La persona organizadora debe estar registrando las personas que apartan o pagan los números, entre otros
    problemas.

Todos estos problemas complican la gestión de los sorteos y hasta puede hacer que se pierdan registros de pagos o se
registren número aún no pagados. Por todo lo anterior se requiere un sistema que cumpla con los siguientes
requerimientos:

- Sorteos
    o Tener capacidad de crear sorteos, agregando una imagen representativa, definiendo lo siguiente: rango de
       números, precio del número, período que durará la venta de números, la fecha en la que se realizará sorteo,
       entre otros.
    o Los sorteos creados se podrían modificar o borrar.
    o Tener una manera de ver los números disponibles por sorteo.
- Números
    o Tener una manera de apartar uno o más números de un sorteo. El apartado tendrá un tiempo límite que
       podría ser configurable de manera global o por sorteo.
    o Tener una manera de liberar números apartados.
    o Enviar cada cierto tiempo (configurable) recordatorios de pago vía correo electrónico a quienes tengan
       boletos apartados.
- Pagos
    o Permitir registrar un comprobante de pago para uno o mas números de un sorteo.
    o Tener una manera de marcar como pagado uno o varios números apartados, una vez teniendo el respectivo
       comprobante de pago.
    o Permitir pagar en línea para uno o más números de un sorteo.
- Tablero de control y reportes
    o Tener un tablero de control por sorteo en donde se aprecie el monto recaudado actualmente, monto por
       recaudar (de boletos apartados), número de boletos vendidos, apartados y por vender, días restantes para
       terminar el período de venta.
    o Reporte de deudores que incluya los números apartados y el monto deudor.
    o Reporte de números apartados, vendidos y libres
    o Reporte histórico de sorteos que incluya fechas del sorteo, nombre, monto recaudado, monto pendiente,
       cantidad de números vendidos, cantidad de números que quedaron sin pagar, cantidad de números que
       quedaron libres.
- Autenticación
    o Como cliente
    o Como organizador de sorteo


