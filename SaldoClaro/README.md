# Saldo Claro

Aplicación de escritorio para registrar ingresos y gastos, organizar categorías, definir presupuestos mensuales y seguir metas de ahorro. La versión inicial funciona sin conexión y conserva los datos en el almacenamiento local de la aplicación.

## Requisitos para ejecutar desde el código

- Windows 10 u 11 de 64 bits.
- Node.js 22 o superior.
- npm.

## Inicio en PowerShell

Desde la carpeta del proyecto:

```powershell
npm.cmd install
npm.cmd start
```

La primera apertura crea datos de demostración ficticios. Se pueden borrar desde **Ajustes y respaldo**. Los datos reales se guardan en el perfil local de la aplicación.

## Crear instalador de Windows

```powershell
npm.cmd install
npm.cmd run dist
```

El instalador se genera en `release/` y ofrece instalación por usuario y elección de carpeta.

## Arquitectura

- `main.js`: crea la ventana de Electron, configura aislamiento y restringe navegación.
- `index.html`: estructura semántica de la interfaz y política de seguridad de contenido.
- `styles.css`: estilos de escritorio y adaptación a pantallas menores.
- `app.js`: navegación, validaciones, operaciones CRUD, cálculos, visualizaciones, respaldo y persistencia.
- `package.json`: comandos y opciones de empaquetado.
- `diagramas/`: arquitectura, modelo lógico de datos, flujo operativo y casos de uso.

## Diagramas

Los diagramas describen la versión realmente entregada. El modelo usa cuatro colecciones locales (`movements`, `categories`, `budgets` y `goals`); no incluye servidor, MongoDB ni sincronización.

La persistencia es local mediante `localStorage`. No hay servidor, autenticación ni sincronización con MongoDB en esta versión. El diseño lógico separa el estado (colecciones), las operaciones de dominio y la presentación, siguiendo la separación de responsabilidades estudiada en el SGA. La conexión API/MongoDB puede ser una evolución posterior; no se declara implementada.

## Datos

Los importes se guardan en centavos enteros para que las sumas no dependan de fracciones binarias de punto flotante. Las fechas se conservan como `AAAA-MM-DD`. El archivo JSON de respaldo contiene la versión del formato y las colecciones de movimientos, categorías, presupuestos y metas.

Esquema abreviado:

```text
Movimiento { id, type, amount, date, categoryId, description }
Categoría  { id, name, icon, color }
Presupuesto { id, categoryId, month, amount }
Meta       { id, name, target, saved, dueDate, icon }
```

## Alcance y límites

- Los presupuestos y reportes se calculan por mes calendario.
- Los aportes a metas actualizan el total ahorrado de la meta; no crean un movimiento de gasto.
- Los archivos de respaldo son portables y deben protegerse porque contienen información financiera personal.
- Borrar los datos del perfil de la aplicación o del almacenamiento local sin respaldo puede causar pérdida de información.
- No reemplaza asesoramiento contable, bancario ni financiero.

## Relación con los materiales de referencia

La aplicación conserva la idea de administración local de datos y la distribución de interfaz y lógica de la versión de Cuenta Clara del usuario, pero usa nombre, contenido, estructura y código propios. Del SGA retoma como referencia académica el trabajo por entidades, operaciones CRUD, validación de formularios, búsquedas y separación entre presentación y lógica. No reutiliza código fuente del SGA.
