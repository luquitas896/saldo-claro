# Saldo Claro

Aplicación de escritorio para registrar ingresos y gastos, organizar categorías, consultar presupuestos y seguir metas de ahorro.

## Archivos del repositorio

- `SaldoClaro-Proyecto.zip`: código fuente completo, diagramas y recursos del proyecto.
- `Informe-Saldo-Claro.docx`: informe académico editable.
- `Informe-Saldo-Claro.pdf`: versión para lectura e impresión (88 páginas).
- Instalador Windows: publicado en la sección **Releases**.

## Descargar e instalar

Descargá `Saldo Claro Setup 1.0.0.exe` desde **Releases**. El instalador es para Windows x64. El código fuente puede extraerse del ZIP y ejecutarse siguiendo el README incluido.

## Alcance

Saldo Claro funciona localmente con Electron, HTML, CSS y JavaScript. Conserva los datos en el perfil local de Windows y ofrece exportación CSV y respaldo/restauración JSON. No incluye servidor, MongoDB, sincronización ni cifrado automático de los datos locales.

La aplicación retoma aprendizajes de CRUD, validaciones, filtros y separación de responsabilidades trabajados en el SGA, pero no reutiliza su código fuente.
