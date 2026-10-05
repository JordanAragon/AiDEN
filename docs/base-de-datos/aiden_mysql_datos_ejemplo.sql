-- AiDEN · Datos de ejemplo (los mismos de la app). Ejecutar después de aiden_mysql_esquema.sql.
-- Contraseña de las tres cuentas de ejemplo: aiden123 (guardada como hash bcrypt).
USE aiden;
SET @aiden_usuario_id = NULL;
START TRANSACTION;

INSERT INTO viveros (id, nombre) VALUES
  (1, 'Vivero de ejemplo AiDEN');

INSERT INTO configuracion (vivero_id, temp_min, temp_max, hum_min, hum_max, notificaciones) VALUES
  (1, 18, 27, 55, 80, TRUE);

INSERT INTO personas (id, vivero_id, codigo, nombre, cargo, departamento, contacto, estado) VALUES
  (1, 1, 'PER-001', 'Jordan Aragon', 'Administrador', 'Administración', '310 555 0101', 'Activo'),
  (2, 1, 'PER-002', 'Laura Méndez', 'Supervisor', 'Producción', '310 555 0142', 'Activo'),
  (3, 1, 'PER-003', 'Andrés Rojas', 'Operario', 'Producción', '312 555 0188', 'Activo'),
  (4, 1, 'PER-004', 'Camila Pardo', 'Operario', 'Calidad', '314 555 0127', 'Activo'),
  (5, 1, 'PER-005', 'Julián Gómez', 'Operario', 'Ambiental', '316 555 0104', 'Activo');

INSERT INTO usuarios (id, vivero_id, persona_id, nombre, correo, clave_hash, rol, revisado) VALUES
  (1, 1, 1, 'Jordan Aragon', 'jordanaragon@aiden.com', '$2b$10$jI1SjvefR7MWZRwQT3yuf.KWkV.wMLC0.UIo1p4MRNr70g3MvgQ3m', 'admin', TRUE),
  (2, 1, 2, 'Laura Méndez', 'supervisor@aiden.com', '$2b$10$jI1SjvefR7MWZRwQT3yuf.KWkV.wMLC0.UIo1p4MRNr70g3MvgQ3m', 'supervisor', TRUE),
  (3, 1, 3, 'Andrés Rojas', 'operario@aiden.com', '$2b$10$jI1SjvefR7MWZRwQT3yuf.KWkV.wMLC0.UIo1p4MRNr70g3MvgQ3m', 'operario', TRUE);

INSERT INTO zonas (id, vivero_id, codigo, nombre, tipo, descripcion) VALUES
  (1, 1, 'ZON-1', 'Invernadero 1', 'Invernadero', 'Tomate y pimentón en camas elevadas.'),
  (2, 1, 'ZON-2', 'Invernadero 2', 'Invernadero', 'Hortalizas de hoja en bandeja y mesa.'),
  (3, 1, 'ZON-3', 'Área de germinación', 'Germinación', 'Cuarto cerrado con humedad controlada.'),
  (4, 1, 'ZON-4', 'Umbráculo', 'Umbráculo', 'Malla sombra al 50 % para café y frutales.');

INSERT INTO cultivos (id, vivero_id, nombre, variedad) VALUES
  (1, 1, 'Aguacate', 'Hass injertado'),
  (2, 1, 'Café', 'Castillo'),
  (3, 1, 'Cilantro', ''),
  (4, 1, 'Lechuga', 'Crespa'),
  (5, 1, 'Pimentón', ''),
  (6, 1, 'Tomate', 'Chonto');

INSERT INTO lotes (id, vivero_id, codigo, cultivo_id, zona_id, responsable_id, cantidad_inicial, cantidad_actual, etapa, estado, fecha_inicio, fecha_estimada, fecha_cierre, motivo_cierre, notas) VALUES
  (1, 1, 'LT-2026-009', 4, 2, 3, 900, 846, 'Cosecha', 'Cerrado', '2026-08-08', '2026-09-23', '2026-09-25', 'Despachado', 'Despacho completo a Agroinsumos El Tambo.'),
  (2, 1, 'LT-2026-011', 6, 1, 3, 450, 420, 'Cosecha', 'Activo', '2026-07-31', '2026-10-07', NULL, NULL, 'Pedido de 400 plantas para la Asociación Campesina de Timbío.'),
  (3, 1, 'LT-2026-012', 2, 4, 4, 2400, 2310, 'Desarrollo', 'Activo', '2026-05-30', '2026-11-26', NULL, NULL, 'Colinos en bolsa para renovación de cafetales.'),
  (4, 1, 'LT-2026-013', 1, 4, 5, 380, 371, 'Adaptación', 'Activo', '2026-09-01', '2027-03-04', NULL, NULL, NULL),
  (5, 1, 'LT-2026-015', 4, 2, 3, 900, 872, 'Desarrollo', 'Activo', '2026-09-09', '2026-10-19', NULL, NULL, NULL),
  (6, 1, 'LT-2026-016', 5, 1, 5, 300, 281, 'Adaptación', 'Activo', '2026-09-16', '2026-11-22', NULL, NULL, NULL),
  (7, 1, 'LT-2026-017', 3, 3, 4, 640, 640, 'Germinación', 'Activo', '2026-09-29', '2026-11-08', NULL, NULL, NULL);

INSERT INTO tareas (vivero_id, codigo, titulo, descripcion, lote_id, responsable_id, prioridad, estado, modulo, fecha_limite, creada_en, completada_en) VALUES
  (1, 'TSK-001', 'Deshoje y tutorado', 'Retirar hojas basales amarillas y ajustar tutores antes del despacho.', 2, 3, 'Alta', 'Pendiente', 'Producción', '2026-10-04', '2026-10-01 08:00:00', NULL),
  (1, 'TSK-002', 'Riego de mantenimiento', 'Riego por goteo de 12 minutos en las mesas 1 a 4.', 5, 3, 'Media', 'En curso', 'Producción', '2026-10-05', '2026-10-02 08:00:00', NULL),
  (1, 'TSK-003', 'Registrar lectura ambiental de la tarde', 'Tomar temperatura, humedad y luz en el Invernadero 1 a las 3:00 p. m.', NULL, 3, 'Media', 'Pendiente', 'Ambiental', '2026-10-05', '2026-10-02 08:00:00', NULL),
  (1, 'TSK-004', 'Preparar despacho de tomate', 'Contar, seleccionar y empacar 400 plantas en canastillas.', 2, 3, 'Media', 'Pendiente', 'Producción', '2026-10-07', '2026-10-04 08:00:00', NULL),
  (1, 'TSK-005', 'Aplicar fertilizante foliar', 'Dosis de 3 ml por litro con bomba de espalda.', 5, 3, 'Baja', 'Completada', 'Producción', '2026-10-04', '2026-10-01 08:00:00', '2026-10-04 10:40:00'),
  (1, 'TSK-006', 'Retirar bandejas con volcamiento', 'Separar las 3 bandejas afectadas y aplicar fungicida preventivo al resto.', 7, 4, 'Alta', 'Pendiente', 'Calidad', '2026-10-05', '2026-10-02 08:00:00', NULL),
  (1, 'TSK-007', 'Fertilización de colinos', 'Aplicación edáfica según plan de nutrición del mes.', 3, 4, 'Media', 'Pendiente', 'Producción', '2026-10-06', '2026-10-03 08:00:00', NULL),
  (1, 'TSK-008', 'Medir uniformidad de plántulas', 'Medir altura en 20 plantas por bandeja y reportar la dispersión.', 6, 5, 'Alta', 'En curso', 'Calidad', '2026-10-05', '2026-10-02 08:00:00', NULL),
  (1, 'TSK-009', 'Trasplante a bolsa 17×23', 'Trasplantar los injertos prendidos a bolsa definitiva.', 4, 5, 'Media', 'Pendiente', 'Producción', '2026-10-08', '2026-10-05 08:00:00', NULL),
  (1, 'TSK-010', 'Validar lote para despacho', 'Revisar sanidad y altura antes de autorizar la salida.', 2, 2, 'Media', 'Pendiente', 'Calidad', '2026-10-06', '2026-10-03 08:00:00', NULL),
  (1, 'TSK-011', 'Gestionar compra de sustrato', 'El sustrato turba está por debajo del mínimo; cotizar 20 bultos.', NULL, 2, 'Alta', 'Pendiente', 'Inventario', '2026-10-03', '2026-09-30 08:00:00', NULL),
  (1, 'TSK-012', 'Limpieza de bandejas de germinación', 'Lavado y desinfección con hipoclorito.', NULL, 4, 'Baja', 'Completada', 'Producción', '2026-10-02', '2026-09-29 08:00:00', '2026-10-02 15:10:00');

INSERT INTO inventario (id, vivero_id, codigo, nombre, categoria, unidad, stock, minimo, precio_unitario) VALUES
  (1, 1, 'INV-001', 'Sustrato turba (bulto 70 L)', 'Sustratos', 'bultos', 18, 25, 48000),
  (2, 1, 'INV-002', 'Bandeja de 128 alvéolos', 'Envases', 'unidades', 146, 60, 2400),
  (3, 1, 'INV-003', 'Bolsa vivero 17×23 cm', 'Envases', 'unidades', 1250, 500, 95),
  (4, 1, 'INV-004', 'Fertilizante foliar NPK', 'Fertilizantes', 'litros', 42, 15, 32000),
  (5, 1, 'INV-005', 'Semilla de tomate chonto', 'Semillas', 'sobres', 3, 4, 18500),
  (6, 1, 'INV-006', 'Fungicida preventivo', 'Fitosanitarios', 'litros', 6, 5, 58000),
  (7, 1, 'INV-007', 'Cal dolomita', 'Fertilizantes', 'kilogramos', 120, 50, 900),
  (8, 1, 'INV-008', 'Tijera de poda', 'Herramientas', 'unidades', 7, 4, 38000);

INSERT INTO movimientos_inventario (id, vivero_id, codigo, insumo_id, tipo, cantidad, valor, fecha, motivo, lote_id, responsable_id) VALUES
  (1, 1, 'MOV-001', 1, 'salida', 3, 144000, '2026-08-08', 'Llenado de bandejas', 1, 3),
  (2, 1, 'MOV-002', 1, 'salida', 2, 96000, '2026-07-31', 'Llenado de bandejas', 2, 3),
  (3, 1, 'MOV-003', 2, 'salida', 4, 9600, '2026-07-31', 'Siembra en bandeja', 2, 3),
  (4, 1, 'MOV-004', 4, 'entrada', 20, 640000, '2026-08-26', 'Compra a Agroinsumos del Cauca', NULL, 2),
  (5, 1, 'MOV-005', 3, 'salida', 380, 36100, '2026-09-01', 'Trasplante de injertos a bolsa', 4, 5),
  (6, 1, 'MOV-006', 1, 'salida', 3, 144000, '2026-09-09', 'Llenado de bandejas', 5, 3),
  (7, 1, 'MOV-007', 3, 'entrada', 1000, 95000, '2026-09-15', 'Compra a Plásticos del Sur', NULL, 2),
  (8, 1, 'MOV-008', 4, 'salida', 6, 192000, '2026-09-23', 'Fertilización de colinos', 3, 4),
  (9, 1, 'MOV-009', 1, 'salida', 1, 48000, '2026-09-29', 'Llenado de bandejas de germinación', 7, 4),
  (10, 1, 'MOV-010', 6, 'salida', 1, 58000, '2026-09-30', 'Control preventivo de volcamiento', 7, 4),
  (11, 1, 'MOV-011', 4, 'salida', 3, 96000, '2026-10-04', 'Fertilización foliar', 5, 3);

INSERT INTO costos (vivero_id, codigo, tipo, concepto, categoria, valor, fecha, lote_id, origen, movimiento_id) VALUES
  (1, 'CST-I01', 'gasto', 'Sustrato turba (bulto 70 L) (3 bultos)', 'Insumos', 144000, '2026-08-08', 1, 'inventario', 1),
  (1, 'CST-I02', 'gasto', 'Sustrato turba (bulto 70 L) (2 bultos)', 'Insumos', 96000, '2026-07-31', 2, 'inventario', 2),
  (1, 'CST-I03', 'gasto', 'Bandeja de 128 alvéolos (4 unidades)', 'Insumos', 9600, '2026-07-31', 2, 'inventario', 3),
  (1, 'CST-I04', 'gasto', 'Bolsa vivero 17×23 cm (380 unidades)', 'Insumos', 36100, '2026-09-01', 4, 'inventario', 5),
  (1, 'CST-I05', 'gasto', 'Sustrato turba (bulto 70 L) (3 bultos)', 'Insumos', 144000, '2026-09-09', 5, 'inventario', 6),
  (1, 'CST-I06', 'gasto', 'Fertilizante foliar NPK (6 litros)', 'Insumos', 192000, '2026-09-23', 3, 'inventario', 8),
  (1, 'CST-I07', 'gasto', 'Sustrato turba (bulto 70 L) (1 bultos)', 'Insumos', 48000, '2026-09-29', 7, 'inventario', 9),
  (1, 'CST-I08', 'gasto', 'Fungicida preventivo (1 litros)', 'Insumos', 58000, '2026-09-30', 7, 'inventario', 10),
  (1, 'CST-I09', 'gasto', 'Fertilizante foliar NPK (3 litros)', 'Insumos', 96000, '2026-10-04', 5, 'inventario', 11),
  (1, 'CST-001', 'gasto', 'Mezcla de sustrato y bolsas para colinos', 'Insumos', 540000, '2026-05-30', 3, 'manual', NULL),
  (1, 'CST-002', 'gasto', 'Jornales de llenado y siembra de café', 'Mano de obra', 620000, '2026-06-07', 3, 'manual', NULL),
  (1, 'CST-003', 'gasto', 'Patrones e injertación de aguacate', 'Mano de obra', 1140000, '2026-08-30', 4, 'manual', NULL),
  (1, 'CST-004', 'gasto', 'Jornales de siembra y tutorado', 'Mano de obra', 180000, '2026-08-06', 2, 'manual', NULL),
  (1, 'CST-005', 'gasto', 'Jornales de siembra', 'Mano de obra', 120000, '2026-08-10', 1, 'manual', NULL),
  (1, 'CST-006', 'gasto', 'Jornales de siembra', 'Mano de obra', 90000, '2026-09-10', 5, 'manual', NULL),
  (1, 'CST-007', 'gasto', 'Semilla y siembra de pimentón', 'Insumos', 108000, '2026-09-16', 6, 'manual', NULL),
  (1, 'CST-008', 'gasto', 'Energía y agua del mes', 'Servicios', 420000, '2026-07-02', NULL, 'manual', NULL),
  (1, 'CST-009', 'gasto', 'Energía y agua del mes', 'Servicios', 435000, '2026-08-01', NULL, 'manual', NULL),
  (1, 'CST-010', 'gasto', 'Energía y agua del mes', 'Servicios', 448000, '2026-08-31', NULL, 'manual', NULL),
  (1, 'CST-011', 'gasto', 'Energía y agua del mes', 'Servicios', 452000, '2026-09-30', NULL, 'manual', NULL),
  (1, 'CST-012', 'gasto', 'Transporte de insumos desde Popayán', 'Transporte', 85000, '2026-08-26', NULL, 'manual', NULL),
  (1, 'CST-013', 'gasto', 'Reparación de la bomba de riego', 'Mantenimiento', 260000, '2026-09-20', NULL, 'manual', NULL),
  (1, 'CST-014', 'ingreso', 'Venta de 846 plántulas de lechuga', 'Venta de plantas', 380700, '2026-09-25', 1, 'manual', NULL),
  (1, 'CST-015', 'ingreso', 'Anticipo por colinos de café', 'Anticipo', 600000, '2026-09-20', 3, 'manual', NULL),
  (1, 'CST-016', 'ingreso', 'Venta de excedente de plántulas', 'Venta de plantas', 210000, '2026-08-22', NULL, 'manual', NULL),
  (1, 'CST-017', 'ingreso', 'Venta de colinos de temporada anterior', 'Venta de plantas', 1450000, '2026-07-09', NULL, 'manual', NULL),
  (1, 'CST-018', 'ingreso', 'Anticipo pedido de tomate', 'Anticipo', 150000, '2026-09-27', 2, 'manual', NULL);

INSERT INTO incidencias (vivero_id, codigo, lote_id, prioridad, descripcion, responsable_id, reportado_por_id, estado, accion_correctiva, fecha_reporte, fecha_cierre) VALUES
  (1, 'INC-028', 5, 'Baja', 'Bandejas deterioradas en la mesa 3', 3, 3, 'Cerrada', 'Se reemplazaron 12 bandejas y se trasplantaron las plántulas afectadas.', '2026-09-15', '2026-09-17'),
  (1, 'INC-030', 6, 'Media', 'Crecimiento irregular entre bandejas del mismo lote', 5, 5, 'En revisión', 'Revisar la uniformidad del riego por goteo y del sustrato.', '2026-10-02', NULL),
  (1, 'INC-031', 2, 'Alta', 'Hojas amarillas en el tercio inferior de las plantas', 3, 3, 'Abierta', NULL, '2026-10-04', NULL),
  (1, 'INC-032', 7, 'Alta', 'Volcamiento (damping-off) en 3 bandejas', 4, 4, 'Abierta', 'Retirar bandejas afectadas y aplicar fungicida preventivo.', '2026-10-05', NULL);

INSERT INTO lecturas_ambientales (vivero_id, zona_id, fecha_hora, temperatura, humedad, iluminacion, origen, registrado_por_id) VALUES
  (1, 1, '2026-10-02 21:49:00', 20.8, 69, 0, 'manual', NULL),
  (1, 1, '2026-10-03 01:49:00', 19.4, 71, 0, 'manual', NULL),
  (1, 1, '2026-10-03 05:49:00', 21.6, 69, 0, 'manual', 5),
  (1, 1, '2026-10-03 09:49:00', 24.6, 63, 7926, 'manual', NULL),
  (1, 1, '2026-10-03 13:49:00', 26.1, 58, 8464, 'manual', NULL),
  (1, 1, '2026-10-03 17:49:00', 24.4, 62, 677, 'manual', 5),
  (1, 1, '2026-10-03 21:49:00', 21.8, 69, 0, 'manual', NULL),
  (1, 1, '2026-10-04 01:49:00', 19.1, 72, 0, 'manual', NULL),
  (1, 1, '2026-10-04 05:49:00', 21.4, 70, 0, 'manual', 5),
  (1, 1, '2026-10-04 09:49:00', 24.6, 63, 7831, 'manual', NULL),
  (1, 1, '2026-10-04 13:49:00', 26.2, 60, 8184, 'manual', NULL),
  (1, 1, '2026-10-04 17:49:00', 24.5, 63, 727, 'manual', 5),
  (1, 1, '2026-10-04 21:49:00', 20.9, 69, 0, 'manual', NULL),
  (1, 1, '2026-10-05 01:49:00', 20.1, 73, 0, 'manual', NULL),
  (1, 1, '2026-10-05 05:49:00', 20.7, 70, 0, 'manual', 5),
  (1, 1, '2026-10-05 09:49:00', 25.1, 62, 8098, 'manual', NULL),
  (1, 1, '2026-10-05 13:49:00', 25.8, 60, 8502, 'manual', NULL),
  (1, 1, '2026-10-05 17:49:00', 25.4, 61, 508, 'manual', 5),
  (1, 2, '2026-10-02 21:37:00', 22.4, 64, 0, 'manual', NULL),
  (1, 2, '2026-10-03 01:37:00', 20.7, 70, 0, 'manual', NULL),
  (1, 2, '2026-10-03 05:37:00', 22.1, 65, 0, 'manual', 5),
  (1, 2, '2026-10-03 09:37:00', 25.7, 61, 7391, 'manual', NULL),
  (1, 2, '2026-10-03 13:37:00', 28.4, 57, 8402, 'manual', NULL),
  (1, 2, '2026-10-03 17:37:00', 26.4, 60, 974, 'manual', 5),
  (1, 2, '2026-10-03 21:37:00', 22.7, 66, 0, 'manual', NULL),
  (1, 2, '2026-10-04 01:37:00', 20.4, 71, 0, 'manual', NULL),
  (1, 2, '2026-10-04 05:37:00', 22.4, 67, 0, 'manual', 5),
  (1, 2, '2026-10-04 09:37:00', 26.5, 60, 7302, 'manual', NULL),
  (1, 2, '2026-10-04 13:37:00', 28.3, 55, 8070, 'manual', NULL),
  (1, 2, '2026-10-04 17:37:00', 26.3, 59, 933, 'manual', 5),
  (1, 2, '2026-10-04 21:37:00', 23.6, 66, 0, 'manual', NULL),
  (1, 2, '2026-10-05 01:37:00', 20.3, 68, 0, 'manual', NULL),
  (1, 2, '2026-10-05 05:37:00', 22.9, 67, 0, 'manual', 5),
  (1, 2, '2026-10-05 09:37:00', 26.2, 60, 7459, 'manual', NULL),
  (1, 2, '2026-10-05 13:37:00', 28.3, 57, 8263, 'manual', NULL),
  (1, 2, '2026-10-05 17:37:00', 29.6, 58, 1276, 'manual', 5),
  (1, 3, '2026-10-02 21:23:00', 21.2, 78, 0, 'manual', NULL),
  (1, 3, '2026-10-03 01:23:00', 21.6, 83, 0, 'manual', NULL),
  (1, 3, '2026-10-03 05:23:00', 21.7, 77, 0, 'manual', 5),
  (1, 3, '2026-10-03 09:23:00', 22.9, 70, 2532, 'manual', NULL),
  (1, 3, '2026-10-03 13:23:00', 23.5, 66, 3080, 'manual', NULL),
  (1, 3, '2026-10-03 17:23:00', 23.3, 69, 906, 'manual', 5),
  (1, 3, '2026-10-03 21:23:00', 21.9, 78, 0, 'manual', NULL),
  (1, 3, '2026-10-04 01:23:00', 20.8, 80, 0, 'manual', NULL),
  (1, 3, '2026-10-04 05:23:00', 21.4, 78, 0, 'manual', 5),
  (1, 3, '2026-10-04 09:23:00', 22.5, 73, 2649, 'manual', NULL),
  (1, 3, '2026-10-04 13:23:00', 23.2, 67, 3154, 'manual', NULL),
  (1, 3, '2026-10-04 17:23:00', 22.6, 69, 892, 'manual', 5),
  (1, 3, '2026-10-04 21:23:00', 22, 75, 0, 'manual', NULL),
  (1, 3, '2026-10-05 01:23:00', 21.3, 82, 0, 'manual', NULL),
  (1, 3, '2026-10-05 05:23:00', 21.1, 77, 0, 'manual', 5),
  (1, 3, '2026-10-05 09:23:00', 22.5, 73, 2745, 'manual', NULL),
  (1, 3, '2026-10-05 13:23:00', 23.4, 66, 3134, 'manual', NULL),
  (1, 3, '2026-10-05 17:23:00', 23.2, 71, 557, 'manual', 5),
  (1, 4, '2026-10-02 21:19:00', 18.8, 73, 0, 'manual', NULL),
  (1, 4, '2026-10-03 01:19:00', 18, 79, 0, 'manual', NULL),
  (1, 4, '2026-10-03 05:19:00', 18.9, 77, 0, 'manual', 5),
  (1, 4, '2026-10-03 09:19:00', 21.9, 70, 4462, 'manual', NULL),
  (1, 4, '2026-10-03 13:19:00', 23.1, 65, 5201, 'manual', NULL),
  (1, 4, '2026-10-03 17:19:00', 21.8, 66, 1038, 'manual', 5),
  (1, 4, '2026-10-03 21:19:00', 19.6, 73, 0, 'manual', NULL),
  (1, 4, '2026-10-04 01:19:00', 17.2, 79, 0, 'manual', NULL),
  (1, 4, '2026-10-04 05:19:00', 18.8, 74, 0, 'manual', 5),
  (1, 4, '2026-10-04 09:19:00', 21, 67, 4181, 'manual', NULL),
  (1, 4, '2026-10-04 13:19:00', 23.6, 65, 5391, 'manual', NULL),
  (1, 4, '2026-10-04 17:19:00', 22.7, 65, 1260, 'manual', 5),
  (1, 4, '2026-10-04 21:19:00', 19.2, 72, 0, 'manual', NULL),
  (1, 4, '2026-10-05 01:19:00', 17.8, 80, 0, 'manual', NULL),
  (1, 4, '2026-10-05 05:19:00', 18.1, 75, 0, 'manual', 5),
  (1, 4, '2026-10-05 09:19:00', 21.9, 67, 4374, 'manual', NULL),
  (1, 4, '2026-10-05 13:19:00', 23.9, 63, 5196, 'manual', NULL),
  (1, 4, '2026-10-05 17:19:00', 22.5, 68, 1246, 'manual', 5);

INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen) VALUES
  (1, 'TRZ-001', 3, 'Registro de lote', '2026-05-30 08:00:00', 2, 'Lote creado: 2.400 colinos de café Castillo en Umbráculo.', 'Producción'),
  (1, 'TRZ-002', 3, 'Cambio de etapa', '2026-06-27 09:15:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-003', 3, 'Cambio de etapa', '2026-07-27 09:30:00', 2, 'Pasa de Adaptación a Desarrollo.', 'Producción'),
  (1, 'TRZ-004', 3, 'Consumo de insumo', '2026-09-23 07:40:00', 4, 'Salida de 6 litros de Fertilizante foliar NPK.', 'Inventario'),
  (1, 'TRZ-005', 3, 'Riego', '2026-10-03 06:50:00', 4, 'Riego por aspersión de 20 minutos.', 'Manual'),
  (1, 'TRZ-010', 2, 'Registro de lote', '2026-07-31 08:10:00', 2, 'Lote creado: 450 plantas de tomate chonto en Invernadero 1.', 'Producción'),
  (1, 'TRZ-011', 2, 'Consumo de insumo', '2026-07-31 09:00:00', 3, 'Salida de 2 bultos de sustrato y 4 bandejas.', 'Inventario'),
  (1, 'TRZ-012', 2, 'Cambio de etapa', '2026-08-12 10:00:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-013', 2, 'Cambio de etapa', '2026-08-28 10:20:00', 2, 'Pasa de Adaptación a Desarrollo.', 'Producción'),
  (1, 'TRZ-014', 2, 'Fertilización', '2026-09-15 07:30:00', 3, 'Aplicación edáfica de NPK en todas las camas.', 'Manual'),
  (1, 'TRZ-015', 2, 'Cambio de etapa', '2026-10-01 11:00:00', 2, 'Pasa de Desarrollo a Cosecha. 420 plantas vivas de 450.', 'Producción'),
  (1, 'TRZ-016', 2, 'Incidencia', '2026-10-04 08:45:00', 3, 'INC-031 · Hojas amarillas en el tercio inferior de las plantas.', 'Calidad'),
  (1, 'TRZ-020', 1, 'Registro de lote', '2026-08-08 08:00:00', 2, 'Lote creado: 900 plántulas de lechuga crespa en Invernadero 2.', 'Producción'),
  (1, 'TRZ-021', 1, 'Cambio de etapa', '2026-08-18 09:00:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-022', 1, 'Cambio de etapa', '2026-08-31 09:00:00', 2, 'Pasa de Adaptación a Desarrollo.', 'Producción'),
  (1, 'TRZ-023', 1, 'Cambio de etapa', '2026-09-21 09:00:00', 2, 'Pasa de Desarrollo a Cosecha.', 'Producción'),
  (1, 'TRZ-024', 1, 'Despacho', '2026-09-25 14:30:00', 2, 'Lote cerrado: 846 plantas despachadas a Agroinsumos El Tambo.', 'Producción'),
  (1, 'TRZ-030', 4, 'Registro de lote', '2026-09-01 08:00:00', 2, 'Lote creado: 380 injertos de aguacate Hass en Umbráculo.', 'Producción'),
  (1, 'TRZ-031', 4, 'Trasplante', '2026-09-01 10:30:00', 5, 'Injertos trasplantados a bolsa 17×23.', 'Manual'),
  (1, 'TRZ-032', 4, 'Cambio de etapa', '2026-09-15 09:00:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-033', 4, 'Inspección', '2026-09-28 11:15:00', 5, 'Prendimiento del 97,6 %: 9 injertos perdidos.', 'Manual'),
  (1, 'TRZ-040', 5, 'Registro de lote', '2026-09-09 08:00:00', 2, 'Lote creado: 900 plántulas de lechuga crespa en Invernadero 2.', 'Producción'),
  (1, 'TRZ-041', 5, 'Cambio de etapa', '2026-09-17 09:00:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-042', 5, 'Incidencia', '2026-09-15 16:00:00', 3, 'INC-028 · Bandejas deterioradas en la mesa 3.', 'Calidad'),
  (1, 'TRZ-043', 5, 'Cierre de incidencia', '2026-09-17 12:00:00', 2, 'INC-028 cerrada: se reemplazaron 12 bandejas.', 'Calidad'),
  (1, 'TRZ-044', 5, 'Cambio de etapa', '2026-09-27 09:00:00', 2, 'Pasa de Adaptación a Desarrollo.', 'Producción'),
  (1, 'TRZ-045', 5, 'Tarea completada', '2026-10-04 10:40:00', 3, 'Aplicar fertilizante foliar: dosis de 3 ml por litro.', 'Personal'),
  (1, 'TRZ-050', 6, 'Registro de lote', '2026-09-16 08:00:00', 2, 'Lote creado: 300 plantas de pimentón en Invernadero 1.', 'Producción'),
  (1, 'TRZ-051', 6, 'Cambio de etapa', '2026-09-26 09:00:00', 2, 'Pasa de Germinación a Adaptación.', 'Producción'),
  (1, 'TRZ-052', 6, 'Incidencia', '2026-10-02 15:20:00', 5, 'INC-030 · Crecimiento irregular entre bandejas del mismo lote.', 'Calidad'),
  (1, 'TRZ-060', 7, 'Registro de lote', '2026-09-29 07:30:00', 2, 'Lote creado: 640 semillas de cilantro en Área de germinación.', 'Producción'),
  (1, 'TRZ-061', 7, 'Consumo de insumo', '2026-09-29 08:00:00', 4, 'Salida de 1 bulto de sustrato turba.', 'Inventario'),
  (1, 'TRZ-062', 7, 'Aplicación fitosanitaria', '2026-09-30 07:00:00', 4, 'Fungicida preventivo en todas las bandejas.', 'Inventario'),
  (1, 'TRZ-063', 7, 'Incidencia', '2026-10-05 07:20:00', 4, 'INC-032 · Volcamiento (damping-off) en 3 bandejas.', 'Calidad');

COMMIT;
