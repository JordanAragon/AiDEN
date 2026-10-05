# Componentes

- **De marca:** `IsotipoAiden` (prop `tamano`, prop `placa` para fondos oscuros) y `LogotipoAiden` (prop `alto`), en `src/components/ui/MarcaAiden.jsx`.
- **Kit de interfaz:** `src/components/ui/` (`Boton`, `Campo`, `Modal`, `Panel`, `Pestanas`, `Filtros`, `Insignia`, `Avatar`, `EncabezadoPagina`, `EstadoVacio`, `AlertaFormulario`, `Cifras`, `CargandoVista`, `LimiteError`, `tabla.js`).

Una pantalla nueva reutiliza este kit antes de crear variantes. La identidad se expresa con componentes consistentes, no con estilos aislados por pantalla.

Formas: `rounded-xl` por defecto, `rounded-2xl` en paneles, radio de marca de 18 px. Sombra de marca solo en piezas destacadas; el resto se apoya en bordes.
