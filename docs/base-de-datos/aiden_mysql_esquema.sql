-- =====================================================================
-- AiDEN · Base de datos (MySQL 8.0+)
-- Esquema completo: tablas, relaciones, restricciones, disparadores,
-- procedimientos de las acciones combinadas y vistas de consulta.
--
-- Se abre en MySQL Workbench: File > Open SQL Script y ejecutar (⚡).
-- Diagrama: Database > Reverse Engineer sobre la base `aiden` creada.
-- Datos de ejemplo: aiden_mysql_datos_ejemplo.sql (ejecutar después).
--
-- Convenciones
--   · Todas las tablas llevan vivero_id: una instalación sirve a varios
--     viveros y cada consulta se filtra por vivero.
--   · Las relaciones entre tablas usan llaves compuestas (vivero_id, id)
--     para que un registro nunca apunte a datos de otro vivero.
--   · Nada se borra en cascada: lo que tiene historial se desactiva.
--   · La aplicación fija @aiden_usuario_id al abrir cada conexión para
--     que la auditoría sepa quién hizo el cambio.
-- =====================================================================

DROP DATABASE IF EXISTS aiden;
CREATE DATABASE aiden CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE aiden;

-- ---------------------------------------------------------------------
-- 1. Viveros (cada empresa o finca que usa AiDEN)
-- ---------------------------------------------------------------------
CREATE TABLE viveros (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(120) NOT NULL,
  nit           VARCHAR(20)  NULL,
  municipio     VARCHAR(80)  NULL,
  departamento  VARCHAR(80)  NULL,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_viveros_nit (nit)
) ENGINE=InnoDB COMMENT='Empresa o finca que usa AiDEN';

-- ---------------------------------------------------------------------
-- 2. Personas (personal operativo; no todas tienen cuenta)
-- ---------------------------------------------------------------------
CREATE TABLE personas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  codigo        VARCHAR(20)  NOT NULL COMMENT 'Código visible, p. ej. PER-001',
  nombre        VARCHAR(120) NOT NULL,
  cargo         ENUM('Administrador','Supervisor','Operario') NOT NULL,
  departamento  ENUM('Producción','Calidad','Ambiental','Inventario','Administración') NOT NULL,
  contacto      VARCHAR(40)  NULL COMMENT 'Dato personal: solo visible para administración',
  estado        ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_personas_vivero_id (vivero_id, id),
  UNIQUE KEY uq_personas_codigo (vivero_id, codigo),
  CONSTRAINT fk_personas_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id)
) ENGINE=InnoDB COMMENT='Personal del vivero';

-- ---------------------------------------------------------------------
-- 3. Usuarios (cuentas de acceso y rol)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  persona_id    INT UNSIGNED NULL COMMENT 'Persona del personal que corresponde a la cuenta',
  nombre        VARCHAR(120) NOT NULL,
  correo        VARCHAR(160) NOT NULL,
  clave_hash    VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt o argon2. Nunca la contraseña en texto',
  rol           ENUM('admin','supervisor','operario') NOT NULL DEFAULT 'operario',
  revisado      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Las cuentas del registro público entran como operario hasta que administración las confirma',
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_acceso DATETIME     NULL,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_vivero_id (vivero_id, id),
  UNIQUE KEY uq_usuarios_correo (correo),
  UNIQUE KEY uq_usuarios_persona (persona_id),
  CONSTRAINT fk_usuarios_vivero  FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_usuarios_persona FOREIGN KEY (vivero_id, persona_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT ck_usuarios_correo CHECK (correo LIKE '%_@_%._%')
) ENGINE=InnoDB COMMENT='Cuentas de acceso';

-- ---------------------------------------------------------------------
-- 4. Configuración del vivero (umbrales generales)
-- ---------------------------------------------------------------------
CREATE TABLE configuracion (
  vivero_id     INT UNSIGNED NOT NULL,
  temp_min      DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  temp_max      DECIMAL(5,2) NOT NULL DEFAULT 27.00,
  hum_min       DECIMAL(5,2) NOT NULL DEFAULT 55.00,
  hum_max       DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  luz_min       DECIMAL(10,2) NULL COMMENT 'Lux; vacío = sin umbral',
  luz_max       DECIMAL(10,2) NULL,
  notificaciones BOOLEAN     NOT NULL DEFAULT TRUE,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vivero_id),
  CONSTRAINT fk_configuracion_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT ck_configuracion_temp CHECK (temp_min < temp_max),
  CONSTRAINT ck_configuracion_hum  CHECK (hum_min < hum_max AND hum_min >= 0 AND hum_max <= 100),
  CONSTRAINT ck_configuracion_luz  CHECK (luz_min IS NULL OR luz_max IS NULL OR luz_min < luz_max)
) ENGINE=InnoDB COMMENT='Umbrales ambientales y preferencias del vivero';

-- ---------------------------------------------------------------------
-- 5. Zonas (invernaderos, umbráculos, germinación…)
-- ---------------------------------------------------------------------
CREATE TABLE zonas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  codigo        VARCHAR(20)  NOT NULL COMMENT 'p. ej. ZON-1',
  nombre        VARCHAR(80)  NOT NULL,
  tipo          ENUM('Invernadero','Umbráculo','Germinación','Campo abierto','Otro') NOT NULL DEFAULT 'Otro',
  descripcion   VARCHAR(255) NULL,
  temp_min      DECIMAL(5,2) NULL COMMENT 'Umbrales propios; vacío = usa los de configuracion',
  temp_max      DECIMAL(5,2) NULL,
  hum_min       DECIMAL(5,2) NULL,
  hum_max       DECIMAL(5,2) NULL,
  luz_min       DECIMAL(10,2) NULL,
  luz_max       DECIMAL(10,2) NULL,
  activa        BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Las zonas con historial no se borran: se desactivan',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zonas_vivero_id (vivero_id, id),
  UNIQUE KEY uq_zonas_codigo (vivero_id, codigo),
  UNIQUE KEY uq_zonas_nombre (vivero_id, nombre),
  CONSTRAINT fk_zonas_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT ck_zonas_temp CHECK (temp_min IS NULL OR temp_max IS NULL OR temp_min < temp_max),
  CONSTRAINT ck_zonas_hum  CHECK (hum_min IS NULL OR hum_max IS NULL OR hum_min < hum_max),
  CONSTRAINT ck_zonas_luz  CHECK (luz_min IS NULL OR luz_max IS NULL OR luz_min < luz_max)
) ENGINE=InnoDB COMMENT='Áreas físicas del vivero';

-- ---------------------------------------------------------------------
-- 6. Cultivos (catálogo para reportes por especie y variedad)
-- ---------------------------------------------------------------------
CREATE TABLE cultivos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  nombre        VARCHAR(80)  NOT NULL COMMENT 'Especie o nombre común, p. ej. Tomate',
  variedad      VARCHAR(80)  NOT NULL DEFAULT '' COMMENT 'p. ej. Chonto; vacío si no aplica',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cultivos_vivero_id (vivero_id, id),
  UNIQUE KEY uq_cultivos_nombre (vivero_id, nombre, variedad),
  CONSTRAINT fk_cultivos_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id)
) ENGINE=InnoDB COMMENT='Especies y variedades que produce el vivero';

-- ---------------------------------------------------------------------
-- 7. Lotes (núcleo de producción)
-- ---------------------------------------------------------------------
CREATE TABLE lotes (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id        INT UNSIGNED NOT NULL,
  codigo           VARCHAR(20)  NOT NULL COMMENT 'p. ej. LT-2026-011',
  cultivo_id       INT UNSIGNED NOT NULL,
  zona_id          INT UNSIGNED NOT NULL,
  responsable_id   INT UNSIGNED NOT NULL,
  cantidad_inicial INT UNSIGNED NOT NULL,
  cantidad_actual  INT UNSIGNED NOT NULL COMMENT 'Plantas vivas',
  etapa            ENUM('Germinación','Adaptación','Desarrollo','Cosecha') NOT NULL DEFAULT 'Germinación',
  estado           ENUM('Activo','Cerrado') NOT NULL DEFAULT 'Activo',
  fecha_inicio     DATE NOT NULL,
  fecha_estimada   DATE NULL COMMENT 'Salida estimada',
  fecha_cierre     DATE NULL,
  motivo_cierre    ENUM('Despachado','Descartado') NULL,
  notas            TEXT NULL,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lotes_vivero_id (vivero_id, id),
  UNIQUE KEY uq_lotes_codigo (vivero_id, codigo),
  KEY ix_lotes_estado_etapa (vivero_id, estado, etapa),
  CONSTRAINT fk_lotes_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_lotes_cultivo     FOREIGN KEY (vivero_id, cultivo_id) REFERENCES cultivos (vivero_id, id),
  CONSTRAINT fk_lotes_zona        FOREIGN KEY (vivero_id, zona_id) REFERENCES zonas (vivero_id, id),
  CONSTRAINT fk_lotes_responsable FOREIGN KEY (vivero_id, responsable_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT ck_lotes_cantidad    CHECK (cantidad_inicial > 0 AND cantidad_actual <= cantidad_inicial),
  CONSTRAINT ck_lotes_fechas      CHECK (fecha_estimada IS NULL OR fecha_estimada >= fecha_inicio),
  CONSTRAINT ck_lotes_cierre      CHECK (
    (estado = 'Activo'  AND fecha_cierre IS NULL AND motivo_cierre IS NULL) OR
    (estado = 'Cerrado' AND fecha_cierre IS NOT NULL AND motivo_cierre IS NOT NULL AND fecha_cierre >= fecha_inicio))
) ENGINE=InnoDB COMMENT='Lotes de producción';

-- ---------------------------------------------------------------------
-- 8. Tareas
-- ---------------------------------------------------------------------
CREATE TABLE tareas (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id      INT UNSIGNED NOT NULL,
  codigo         VARCHAR(20)  NOT NULL COMMENT 'p. ej. TSK-001',
  titulo         VARCHAR(160) NOT NULL,
  descripcion    TEXT NULL,
  lote_id        INT UNSIGNED NULL,
  responsable_id INT UNSIGNED NOT NULL,
  creada_por_id  INT UNSIGNED NULL COMMENT 'Usuario que la asignó',
  prioridad      ENUM('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
  estado         ENUM('Pendiente','En curso','Completada') NOT NULL DEFAULT 'Pendiente',
  modulo         ENUM('Producción','Ambiental','Calidad','Inventario','Trazabilidad') NOT NULL DEFAULT 'Producción',
  fecha_limite   DATE NOT NULL,
  creada_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completada_en  DATETIME NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tareas_vivero_id (vivero_id, id),
  UNIQUE KEY uq_tareas_codigo (vivero_id, codigo),
  KEY ix_tareas_responsable (vivero_id, responsable_id, estado),
  KEY ix_tareas_fecha (vivero_id, estado, fecha_limite),
  CONSTRAINT fk_tareas_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_tareas_lote        FOREIGN KEY (vivero_id, lote_id) REFERENCES lotes (vivero_id, id),
  CONSTRAINT fk_tareas_responsable FOREIGN KEY (vivero_id, responsable_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT fk_tareas_creada_por  FOREIGN KEY (vivero_id, creada_por_id) REFERENCES usuarios (vivero_id, id),
  CONSTRAINT ck_tareas_completada  CHECK ((estado = 'Completada') = (completada_en IS NOT NULL))
) ENGINE=InnoDB COMMENT='Trabajo asignado al personal';

-- ---------------------------------------------------------------------
-- 9. Inventario (insumos y existencias)
-- ---------------------------------------------------------------------
CREATE TABLE inventario (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id       INT UNSIGNED NOT NULL,
  codigo          VARCHAR(20)  NOT NULL COMMENT 'p. ej. INV-001',
  nombre          VARCHAR(120) NOT NULL,
  categoria       ENUM('Sustratos','Semillas','Fertilizantes','Fitosanitarios','Envases','Herramientas') NOT NULL,
  unidad          ENUM('unidades','bultos','litros','kilogramos','sobres') NOT NULL,
  stock           DECIMAL(12,2) NOT NULL DEFAULT 0,
  minimo          DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Por debajo de este valor, el insumo va a la cola de reposición',
  precio_unitario DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Pesos colombianos',
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventario_vivero_id (vivero_id, id),
  UNIQUE KEY uq_inventario_codigo (vivero_id, codigo),
  UNIQUE KEY uq_inventario_nombre (vivero_id, nombre),
  CONSTRAINT fk_inventario_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT ck_inventario_valores CHECK (stock >= 0 AND minimo >= 0 AND precio_unitario >= 0)
) ENGINE=InnoDB COMMENT='Insumos del vivero';

-- ---------------------------------------------------------------------
-- 10. Movimientos de inventario
-- ---------------------------------------------------------------------
CREATE TABLE movimientos_inventario (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id      INT UNSIGNED NOT NULL,
  codigo         VARCHAR(20)  NOT NULL COMMENT 'p. ej. MOV-001',
  insumo_id      INT UNSIGNED NOT NULL,
  tipo           ENUM('entrada','salida') NOT NULL,
  cantidad       DECIMAL(12,2) NOT NULL,
  valor          DECIMAL(14,2) NOT NULL COMMENT 'cantidad × precio del momento; no cambia si después cambia el precio',
  fecha          DATE NOT NULL,
  motivo         VARCHAR(160) NOT NULL,
  lote_id        INT UNSIGNED NULL COMMENT 'Lote que consumió el insumo (solo salidas)',
  responsable_id INT UNSIGNED NULL,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_movimientos_vivero_id (vivero_id, id),
  UNIQUE KEY uq_movimientos_codigo (vivero_id, codigo),
  KEY ix_movimientos_insumo (vivero_id, insumo_id, fecha),
  CONSTRAINT fk_movimientos_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_movimientos_insumo      FOREIGN KEY (vivero_id, insumo_id) REFERENCES inventario (vivero_id, id),
  CONSTRAINT fk_movimientos_lote        FOREIGN KEY (vivero_id, lote_id) REFERENCES lotes (vivero_id, id),
  CONSTRAINT fk_movimientos_responsable FOREIGN KEY (vivero_id, responsable_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT ck_movimientos_cantidad    CHECK (cantidad > 0 AND valor >= 0),
  CONSTRAINT ck_movimientos_lote        CHECK (tipo = 'salida' OR lote_id IS NULL)
) ENGINE=InnoDB COMMENT='Entradas y salidas de insumos';

-- ---------------------------------------------------------------------
-- 11. Costos (gastos e ingresos)
-- ---------------------------------------------------------------------
CREATE TABLE costos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id      INT UNSIGNED NOT NULL,
  codigo         VARCHAR(20)  NOT NULL COMMENT 'p. ej. CST-001',
  tipo           ENUM('gasto','ingreso') NOT NULL,
  concepto       VARCHAR(200) NOT NULL,
  categoria      ENUM('Insumos','Mano de obra','Transporte','Servicios','Mantenimiento','Otros',
                      'Venta de plantas','Anticipo','Otros ingresos') NOT NULL,
  valor          DECIMAL(14,2) NOT NULL COMMENT 'Pesos colombianos',
  fecha          DATE NOT NULL,
  lote_id        INT UNSIGNED NULL,
  origen         ENUM('manual','inventario') NOT NULL DEFAULT 'manual',
  movimiento_id  INT UNSIGNED NULL COMMENT 'Movimiento de inventario que generó el costo',
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_costos_vivero_id (vivero_id, id),
  UNIQUE KEY uq_costos_codigo (vivero_id, codigo),
  UNIQUE KEY uq_costos_movimiento (movimiento_id) COMMENT 'Un solo costo por movimiento',
  KEY ix_costos_periodo (vivero_id, fecha, tipo),
  KEY ix_costos_lote (vivero_id, lote_id),
  CONSTRAINT fk_costos_vivero     FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_costos_lote       FOREIGN KEY (vivero_id, lote_id) REFERENCES lotes (vivero_id, id),
  CONSTRAINT fk_costos_movimiento FOREIGN KEY (vivero_id, movimiento_id) REFERENCES movimientos_inventario (vivero_id, id),
  CONSTRAINT ck_costos_valor      CHECK (valor > 0),
  CONSTRAINT ck_costos_origen     CHECK ((origen = 'inventario') = (movimiento_id IS NOT NULL)),
  CONSTRAINT ck_costos_categoria  CHECK (
    (tipo = 'gasto'   AND categoria IN ('Insumos','Mano de obra','Transporte','Servicios','Mantenimiento','Otros')) OR
    (tipo = 'ingreso' AND categoria IN ('Venta de plantas','Anticipo','Otros ingresos')))
) ENGINE=InnoDB COMMENT='Gastos e ingresos';

-- ---------------------------------------------------------------------
-- 12. Incidencias (calidad y fitosanidad)
-- ---------------------------------------------------------------------
CREATE TABLE incidencias (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id        INT UNSIGNED NOT NULL,
  codigo           VARCHAR(20)  NOT NULL COMMENT 'p. ej. INC-031',
  lote_id          INT UNSIGNED NOT NULL,
  prioridad        ENUM('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
  descripcion      TEXT NOT NULL,
  responsable_id   INT UNSIGNED NOT NULL,
  reportado_por_id INT UNSIGNED NULL,
  estado           ENUM('Abierta','En revisión','Cerrada') NOT NULL DEFAULT 'Abierta',
  accion_correctiva TEXT NULL,
  fecha_reporte    DATE NOT NULL,
  fecha_cierre     DATE NULL,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_incidencias_vivero_id (vivero_id, id),
  UNIQUE KEY uq_incidencias_codigo (vivero_id, codigo),
  KEY ix_incidencias_estado (vivero_id, estado, prioridad),
  CONSTRAINT fk_incidencias_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_incidencias_lote        FOREIGN KEY (vivero_id, lote_id) REFERENCES lotes (vivero_id, id),
  CONSTRAINT fk_incidencias_responsable FOREIGN KEY (vivero_id, responsable_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT fk_incidencias_reporta     FOREIGN KEY (vivero_id, reportado_por_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT ck_incidencias_cierre CHECK (
    (estado <> 'Cerrada' AND fecha_cierre IS NULL) OR
    (estado = 'Cerrada' AND fecha_cierre IS NOT NULL AND fecha_cierre >= fecha_reporte
                        AND accion_correctiva IS NOT NULL AND CHAR_LENGTH(TRIM(accion_correctiva)) > 0))
) ENGINE=InnoDB COMMENT='Problemas de calidad y fitosanitarios. Solo se cierran con acción correctiva';

-- ---------------------------------------------------------------------
-- 13. Dispositivos (sensores; vacía hasta conectar sensores)
-- ---------------------------------------------------------------------
CREATE TABLE dispositivos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  zona_id       INT UNSIGNED NOT NULL,
  nombre        VARCHAR(80)  NOT NULL,
  tipo          ENUM('Temperatura','Humedad','Iluminación','Multisensor') NOT NULL DEFAULT 'Multisensor',
  identificador VARCHAR(80)  NOT NULL COMMENT 'Serial o ID del fabricante',
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dispositivos_vivero_id (vivero_id, id),
  UNIQUE KEY uq_dispositivos_identificador (vivero_id, identificador),
  CONSTRAINT fk_dispositivos_vivero FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_dispositivos_zona   FOREIGN KEY (vivero_id, zona_id) REFERENCES zonas (vivero_id, id)
) ENGINE=InnoDB COMMENT='Sensores ambientales';

-- ---------------------------------------------------------------------
-- 14. Lecturas ambientales (la tabla que más crece)
-- ---------------------------------------------------------------------
CREATE TABLE lecturas_ambientales (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id        INT UNSIGNED NOT NULL,
  zona_id          INT UNSIGNED NOT NULL,
  fecha_hora       DATETIME NOT NULL,
  temperatura      DECIMAL(5,2) NOT NULL COMMENT '°C',
  humedad          DECIMAL(5,2) NOT NULL COMMENT '% humedad relativa',
  iluminacion      DECIMAL(10,2) NULL COMMENT 'Lux',
  origen           ENUM('manual','sensor') NOT NULL DEFAULT 'manual',
  dispositivo_id   INT UNSIGNED NULL,
  registrado_por_id INT UNSIGNED NULL COMMENT 'Persona que registró la lectura manual',
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_lecturas_zona_fecha (vivero_id, zona_id, fecha_hora),
  CONSTRAINT fk_lecturas_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_lecturas_zona        FOREIGN KEY (vivero_id, zona_id) REFERENCES zonas (vivero_id, id),
  CONSTRAINT fk_lecturas_dispositivo FOREIGN KEY (vivero_id, dispositivo_id) REFERENCES dispositivos (vivero_id, id),
  CONSTRAINT fk_lecturas_persona     FOREIGN KEY (vivero_id, registrado_por_id) REFERENCES personas (vivero_id, id),
  CONSTRAINT ck_lecturas_rangos CHECK (temperatura BETWEEN -20 AND 70 AND humedad BETWEEN 0 AND 100
                                       AND (iluminacion IS NULL OR iluminacion >= 0)),
  CONSTRAINT ck_lecturas_origen CHECK (origen = 'manual' OR dispositivo_id IS NOT NULL)
) ENGINE=InnoDB COMMENT='Temperatura, humedad e iluminación por zona';

-- ---------------------------------------------------------------------
-- 15. Eventos de trazabilidad (historia del lote; solo se agregan)
-- ---------------------------------------------------------------------
CREATE TABLE eventos_trazabilidad (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id      INT UNSIGNED NOT NULL,
  codigo         VARCHAR(20)  NOT NULL COMMENT 'p. ej. TRZ-001',
  lote_id        INT UNSIGNED NOT NULL,
  tipo           ENUM('Registro de lote','Cambio de etapa','Riego','Fertilización','Aplicación fitosanitaria',
                      'Trasplante','Inspección','Consumo de insumo','Incidencia','Cierre de incidencia',
                      'Tarea completada','Despacho','Traslado','Observación') NOT NULL,
  fecha_hora     DATETIME NOT NULL,
  responsable_id INT UNSIGNED NULL,
  detalle        TEXT NOT NULL,
  origen         ENUM('Producción','Inventario','Calidad','Ambiental','Personal','Costos','Manual') NOT NULL,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_eventos_codigo (vivero_id, codigo),
  KEY ix_eventos_lote (vivero_id, lote_id, fecha_hora),
  CONSTRAINT fk_eventos_vivero      FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_eventos_lote        FOREIGN KEY (vivero_id, lote_id) REFERENCES lotes (vivero_id, id),
  CONSTRAINT fk_eventos_responsable FOREIGN KEY (vivero_id, responsable_id) REFERENCES personas (vivero_id, id)
) ENGINE=InnoDB COMMENT='Línea de vida de cada lote. No se edita ni se borra';

-- ---------------------------------------------------------------------
-- 16. Notificaciones leídas (las notificaciones se calculan; aquí solo
--     se guarda cuáles ya vio cada usuario)
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones_leidas (
  usuario_id    INT UNSIGNED NOT NULL,
  clave         VARCHAR(120) NOT NULL COMMENT 'Identificador de la notificación calculada, p. ej. ambiental-ZON-2-2026-10-05',
  leida_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, clave),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB COMMENT='Estado de lectura de notificaciones por usuario';

-- ---------------------------------------------------------------------
-- 17. Auditoría (cambios sensibles; solo se agregan)
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vivero_id     INT UNSIGNED NOT NULL,
  usuario_id    INT UNSIGNED NULL COMMENT 'Quién hizo el cambio (@aiden_usuario_id)',
  accion        ENUM('crear','editar','borrar','iniciar sesión','otro') NOT NULL,
  tabla         VARCHAR(64)  NOT NULL,
  registro_id   VARCHAR(40)  NOT NULL,
  descripcion   VARCHAR(255) NOT NULL,
  datos_antes   JSON NULL,
  datos_despues JSON NULL,
  ip            VARCHAR(45)  NULL,
  fecha_hora    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_auditoria_fecha (vivero_id, fecha_hora),
  KEY ix_auditoria_registro (tabla, registro_id),
  CONSTRAINT fk_auditoria_vivero  FOREIGN KEY (vivero_id) REFERENCES viveros (id),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB COMMENT='Registro de acciones sensibles: roles, configuración, borrados';


-- =====================================================================
-- DISPARADORES
-- =====================================================================
DELIMITER $$

-- Historiales: no se editan ni se borran ---------------------------------
CREATE TRIGGER trg_eventos_no_editar BEFORE UPDATE ON eventos_trazabilidad FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La trazabilidad no se edita: registra un evento nuevo.';
END$$

CREATE TRIGGER trg_eventos_no_borrar BEFORE DELETE ON eventos_trazabilidad FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La trazabilidad no se borra.';
END$$

CREATE TRIGGER trg_auditoria_no_editar BEFORE UPDATE ON auditoria FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La auditoría no se edita.';
END$$

CREATE TRIGGER trg_auditoria_no_borrar BEFORE DELETE ON auditoria FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La auditoría no se borra.';
END$$

-- Costos que vienen de inventario: solo cambian a través del movimiento --
CREATE TRIGGER trg_costos_inventario_editar BEFORE UPDATE ON costos FOR EACH ROW
BEGIN
  IF OLD.origen = 'inventario' AND COALESCE(@aiden_desde_procedimiento, 0) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este costo viene de un movimiento de inventario: se cambia desde Inventario.';
  END IF;
END$$

CREATE TRIGGER trg_costos_inventario_borrar BEFORE DELETE ON costos FOR EACH ROW
BEGIN
  IF OLD.origen = 'inventario' AND COALESCE(@aiden_desde_procedimiento, 0) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este costo viene de un movimiento de inventario: se cambia desde Inventario.';
  END IF;
END$$

-- Lotes cerrados no vuelven a abrirse ni cambian de etapa ---------------
CREATE TRIGGER trg_lotes_cerrado BEFORE UPDATE ON lotes FOR EACH ROW
BEGIN
  IF OLD.estado = 'Cerrado' AND (NEW.estado <> 'Cerrado' OR NEW.etapa <> OLD.etapa OR NEW.cantidad_actual <> OLD.cantidad_actual) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote está cerrado.';
  END IF;
END$$

-- Tareas abiertas: no se asignan a lotes cerrados ni a personas inactivas
CREATE TRIGGER trg_tareas_validar_ins BEFORE INSERT ON tareas FOR EACH ROW
BEGIN
  IF NEW.estado <> 'Completada' AND NEW.lote_id IS NOT NULL AND (SELECT estado FROM lotes WHERE id = NEW.lote_id) = 'Cerrado' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se asignan tareas a un lote cerrado.';
  END IF;
  IF NEW.estado <> 'Completada' AND (SELECT estado FROM personas WHERE id = NEW.responsable_id) <> 'Activo' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El responsable está inactivo.';
  END IF;
END$$

-- Personas: para desactivar a alguien hay que reasignar sus tareas ------
CREATE TRIGGER trg_personas_desactivar BEFORE UPDATE ON personas FOR EACH ROW
BEGIN
  IF OLD.estado = 'Activo' AND NEW.estado = 'Inactivo'
     AND EXISTS (SELECT 1 FROM tareas WHERE responsable_id = OLD.id AND estado <> 'Completada') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reasigna sus tareas abiertas antes de desactivar a esta persona.';
  END IF;
END$$

-- Auditoría automática de cambios sensibles ------------------------------
CREATE TRIGGER trg_usuarios_auditar_ins AFTER INSERT ON usuarios FOR EACH ROW
BEGIN
  INSERT INTO auditoria (vivero_id, usuario_id, accion, tabla, registro_id, descripcion, datos_despues)
  VALUES (NEW.vivero_id, @aiden_usuario_id, 'crear', 'usuarios', NEW.id, CONCAT('Cuenta creada: ', NEW.correo),
          JSON_OBJECT('rol', NEW.rol, 'revisado', NEW.revisado, 'activo', NEW.activo));
END$$

CREATE TRIGGER trg_usuarios_auditar_upd AFTER UPDATE ON usuarios FOR EACH ROW
BEGIN
  IF NOT (OLD.rol <=> NEW.rol) OR NOT (OLD.revisado <=> NEW.revisado) OR NOT (OLD.activo <=> NEW.activo)
     OR NOT (OLD.clave_hash <=> NEW.clave_hash) THEN
    INSERT INTO auditoria (vivero_id, usuario_id, accion, tabla, registro_id, descripcion, datos_antes, datos_despues)
    VALUES (NEW.vivero_id, @aiden_usuario_id, 'editar', 'usuarios', NEW.id,
            CONCAT('Cambio de acceso: ', NEW.correo, IF(NOT (OLD.clave_hash <=> NEW.clave_hash), ' (contraseña cambiada)', '')),
            JSON_OBJECT('rol', OLD.rol, 'revisado', OLD.revisado, 'activo', OLD.activo),
            JSON_OBJECT('rol', NEW.rol, 'revisado', NEW.revisado, 'activo', NEW.activo));
  END IF;
END$$

CREATE TRIGGER trg_configuracion_auditar AFTER UPDATE ON configuracion FOR EACH ROW
BEGIN
  INSERT INTO auditoria (vivero_id, usuario_id, accion, tabla, registro_id, descripcion, datos_antes, datos_despues)
  VALUES (NEW.vivero_id, @aiden_usuario_id, 'editar', 'configuracion', NEW.vivero_id, 'Umbrales o notificaciones modificados',
          JSON_OBJECT('temp_min', OLD.temp_min, 'temp_max', OLD.temp_max, 'hum_min', OLD.hum_min, 'hum_max', OLD.hum_max,
                      'luz_min', OLD.luz_min, 'luz_max', OLD.luz_max, 'notificaciones', OLD.notificaciones),
          JSON_OBJECT('temp_min', NEW.temp_min, 'temp_max', NEW.temp_max, 'hum_min', NEW.hum_min, 'hum_max', NEW.hum_max,
                      'luz_min', NEW.luz_min, 'luz_max', NEW.luz_max, 'notificaciones', NEW.notificaciones));
END$$

CREATE TRIGGER trg_costos_auditar_del AFTER DELETE ON costos FOR EACH ROW
BEGIN
  INSERT INTO auditoria (vivero_id, usuario_id, accion, tabla, registro_id, descripcion, datos_antes)
  VALUES (OLD.vivero_id, @aiden_usuario_id, 'borrar', 'costos', OLD.codigo, CONCAT('Costo eliminado: ', OLD.concepto),
          JSON_OBJECT('tipo', OLD.tipo, 'valor', OLD.valor, 'fecha', OLD.fecha, 'lote_id', OLD.lote_id));
END$$

CREATE TRIGGER trg_tareas_auditar_del AFTER DELETE ON tareas FOR EACH ROW
BEGIN
  INSERT INTO auditoria (vivero_id, usuario_id, accion, tabla, registro_id, descripcion, datos_antes)
  VALUES (OLD.vivero_id, @aiden_usuario_id, 'borrar', 'tareas', OLD.codigo, CONCAT('Tarea eliminada: ', OLD.titulo),
          JSON_OBJECT('estado', OLD.estado, 'responsable_id', OLD.responsable_id, 'lote_id', OLD.lote_id));
END$$

DELIMITER ;


-- =====================================================================
-- PROCEDIMIENTOS: acciones que tocan varias tablas a la vez.
-- Todo o nada: si una parte falla, no queda nada a medias.
-- =====================================================================
DELIMITER $$

-- Siguiente código visible (PREFIJO-001, PREFIJO-002…) a partir del mayor número usado
CREATE FUNCTION fn_codigo(p_prefijo VARCHAR(10), p_mayor INT UNSIGNED) RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
  RETURN CONCAT(p_prefijo, '-', LPAD(COALESCE(p_mayor, 0) + 1, 3, '0'));
END$$

-- Registrar entrada o salida de inventario ------------------------------
-- Actualiza el stock, guarda el movimiento con su valor del momento y,
-- si es una salida hacia un lote, deja el evento en la trazabilidad y
-- (opcional) carga el costo al lote.
CREATE PROCEDURE sp_registrar_movimiento(
  IN  p_vivero_id      INT UNSIGNED,
  IN  p_insumo_id      INT UNSIGNED,
  IN  p_tipo           VARCHAR(10),
  IN  p_cantidad       DECIMAL(12,2),
  IN  p_fecha          DATE,
  IN  p_motivo         VARCHAR(160),
  IN  p_lote_id        INT UNSIGNED,
  IN  p_responsable_id INT UNSIGNED,
  IN  p_cargar_costo   BOOLEAN,
  OUT p_movimiento_id  INT UNSIGNED)
BEGIN
  DECLARE v_stock DECIMAL(12,2);
  DECLARE v_precio DECIMAL(14,2);
  DECLARE v_nombre VARCHAR(120);
  DECLARE v_unidad VARCHAR(20);
  DECLARE v_valor DECIMAL(14,2);
  DECLARE v_estado_lote VARCHAR(10);
  DECLARE v_codigo VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN SET @aiden_desde_procedimiento = 0; ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT stock, precio_unitario, nombre, unidad INTO v_stock, v_precio, v_nombre, v_unidad
    FROM inventario WHERE id = p_insumo_id AND vivero_id = p_vivero_id FOR UPDATE;
  IF v_nombre IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El insumo no existe en este vivero.'; END IF;
  IF p_tipo NOT IN ('entrada','salida') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Elige si es entrada o salida.'; END IF;
  IF p_tipo = 'salida' AND p_cantidad > v_stock THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay suficiente stock para esa salida.';
  END IF;
  IF p_lote_id IS NOT NULL THEN
    SELECT estado INTO v_estado_lote FROM lotes WHERE id = p_lote_id AND vivero_id = p_vivero_id;
    IF v_estado_lote IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote no existe en este vivero.'; END IF;
    IF v_estado_lote = 'Cerrado' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote está cerrado.'; END IF;
  END IF;

  SET v_valor = ROUND(p_cantidad * v_precio, 2);
  UPDATE inventario SET stock = stock + IF(p_tipo = 'entrada', p_cantidad, -p_cantidad) WHERE id = p_insumo_id;

  SELECT fn_codigo('MOV', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM movimientos_inventario WHERE vivero_id = p_vivero_id AND codigo REGEXP '^MOV-[0-9]+$';
  INSERT INTO movimientos_inventario (vivero_id, codigo, insumo_id, tipo, cantidad, valor, fecha, motivo, lote_id, responsable_id)
  VALUES (p_vivero_id, v_codigo, p_insumo_id, p_tipo, p_cantidad, v_valor, p_fecha,
          COALESCE(NULLIF(TRIM(p_motivo), ''), IF(p_tipo = 'entrada', 'Entrada', 'Salida')),
          IF(p_tipo = 'salida', p_lote_id, NULL), p_responsable_id);
  SET p_movimiento_id = LAST_INSERT_ID();

  IF p_tipo = 'salida' AND p_lote_id IS NOT NULL THEN
    SELECT fn_codigo('TRZ', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM eventos_trazabilidad WHERE vivero_id = p_vivero_id AND codigo REGEXP '^TRZ-[0-9]+$';
    INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen)
    VALUES (p_vivero_id, v_codigo, p_lote_id, 'Consumo de insumo', TIMESTAMP(p_fecha, CURTIME()), p_responsable_id,
            CONCAT('Salida de ', TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM p_cantidad)), ' ', v_unidad, ' de ', v_nombre,
                   IF(p_cargar_costo AND v_valor > 0, CONCAT(' (', FORMAT(v_valor, 0, 'es_CO'), ' cargados al lote)'), ''), '.'),
            'Inventario');
    IF p_cargar_costo AND v_valor > 0 THEN
      SELECT fn_codigo('CST', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM costos WHERE vivero_id = p_vivero_id AND codigo REGEXP '^CST-[0-9]+$';
      INSERT INTO costos (vivero_id, codigo, tipo, concepto, categoria, valor, fecha, lote_id, origen, movimiento_id)
      VALUES (p_vivero_id, v_codigo, 'gasto', CONCAT(v_nombre, ' (', TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM p_cantidad)), ' ', v_unidad, ')'),
              'Insumos', v_valor, p_fecha, p_lote_id, 'inventario', p_movimiento_id);
    END IF;
  END IF;
  COMMIT;
END$$

-- Avanzar etapa de un lote ----------------------------------------------
CREATE PROCEDURE sp_avanzar_etapa(IN p_vivero_id INT UNSIGNED, IN p_lote_id INT UNSIGNED, IN p_responsable_id INT UNSIGNED)
BEGIN
  DECLARE v_etapa VARCHAR(20);
  DECLARE v_nueva VARCHAR(20);
  DECLARE v_estado VARCHAR(10);
  DECLARE v_vivas INT UNSIGNED;
  DECLARE v_iniciales INT UNSIGNED;
  DECLARE v_codigo VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT etapa, estado, cantidad_actual, cantidad_inicial INTO v_etapa, v_estado, v_vivas, v_iniciales
    FROM lotes WHERE id = p_lote_id AND vivero_id = p_vivero_id FOR UPDATE;
  IF v_estado IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote no existe en este vivero.'; END IF;
  IF v_estado = 'Cerrado' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote está cerrado.'; END IF;
  SET v_nueva = CASE v_etapa WHEN 'Germinación' THEN 'Adaptación' WHEN 'Adaptación' THEN 'Desarrollo'
                             WHEN 'Desarrollo' THEN 'Cosecha' ELSE NULL END;
  IF v_nueva IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote ya está en Cosecha. Ciérralo cuando se despache.';
  END IF;
  UPDATE lotes SET etapa = v_nueva WHERE id = p_lote_id;
  SELECT fn_codigo('TRZ', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM eventos_trazabilidad WHERE vivero_id = p_vivero_id AND codigo REGEXP '^TRZ-[0-9]+$';
  INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen)
  VALUES (p_vivero_id, v_codigo, p_lote_id, 'Cambio de etapa', NOW(), p_responsable_id,
          CONCAT('Pasa de ', v_etapa, ' a ', v_nueva, '. ', v_vivas, ' plantas vivas de ', v_iniciales, '.'), 'Producción');
  COMMIT;
END$$

-- Cerrar un lote (despachado o descartado) ------------------------------
CREATE PROCEDURE sp_cerrar_lote(IN p_vivero_id INT UNSIGNED, IN p_lote_id INT UNSIGNED, IN p_motivo VARCHAR(12),
                                IN p_nota TEXT, IN p_responsable_id INT UNSIGNED)
BEGIN
  DECLARE v_estado VARCHAR(10);
  DECLARE v_vivas INT UNSIGNED;
  DECLARE v_codigo VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT estado, cantidad_actual INTO v_estado, v_vivas FROM lotes WHERE id = p_lote_id AND vivero_id = p_vivero_id FOR UPDATE;
  IF v_estado IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote no existe en este vivero.'; END IF;
  IF v_estado = 'Cerrado' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote ya está cerrado.'; END IF;
  IF p_motivo NOT IN ('Despachado','Descartado') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Elige si el lote se despachó o se descartó.';
  END IF;
  UPDATE lotes SET estado = 'Cerrado', fecha_cierre = CURDATE(), motivo_cierre = p_motivo,
                   notas = COALESCE(NULLIF(TRIM(p_nota), ''), notas)
   WHERE id = p_lote_id;
  SELECT fn_codigo('TRZ', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM eventos_trazabilidad WHERE vivero_id = p_vivero_id AND codigo REGEXP '^TRZ-[0-9]+$';
  INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen)
  VALUES (p_vivero_id, v_codigo, p_lote_id, IF(p_motivo = 'Despachado', 'Despacho', 'Observación'), NOW(), p_responsable_id,
          CONCAT('Lote cerrado (', LOWER(p_motivo), ') con ', v_vivas, ' plantas.', IF(NULLIF(TRIM(p_nota), '') IS NULL, '', CONCAT(' ', TRIM(p_nota)))),
          'Producción');
  COMMIT;
END$$

-- Cerrar una incidencia con su acción correctiva ------------------------
CREATE PROCEDURE sp_cerrar_incidencia(IN p_vivero_id INT UNSIGNED, IN p_incidencia_id INT UNSIGNED,
                                      IN p_accion TEXT, IN p_responsable_id INT UNSIGNED)
BEGIN
  DECLARE v_estado VARCHAR(12);
  DECLARE v_lote INT UNSIGNED;
  DECLARE v_codigo_inc VARCHAR(20);
  DECLARE v_codigo VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT estado, lote_id, codigo INTO v_estado, v_lote, v_codigo_inc
    FROM incidencias WHERE id = p_incidencia_id AND vivero_id = p_vivero_id FOR UPDATE;
  IF v_estado IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La incidencia no existe en este vivero.'; END IF;
  IF v_estado = 'Cerrada' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La incidencia ya está cerrada.'; END IF;
  IF CHAR_LENGTH(TRIM(COALESCE(p_accion, ''))) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Documenta la acción correctiva antes de cerrar.';
  END IF;
  UPDATE incidencias SET estado = 'Cerrada', accion_correctiva = TRIM(p_accion), fecha_cierre = CURDATE()
   WHERE id = p_incidencia_id;
  SELECT fn_codigo('TRZ', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM eventos_trazabilidad WHERE vivero_id = p_vivero_id AND codigo REGEXP '^TRZ-[0-9]+$';
  INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen)
  VALUES (p_vivero_id, v_codigo, v_lote, 'Cierre de incidencia', NOW(), p_responsable_id,
          CONCAT(v_codigo_inc, ' cerrada. Acción: ', TRIM(p_accion)), 'Calidad');
  COMMIT;
END$$

-- Completar una tarea (y dejarlo en la historia del lote) ---------------
CREATE PROCEDURE sp_completar_tarea(IN p_vivero_id INT UNSIGNED, IN p_tarea_id INT UNSIGNED, IN p_nota TEXT)
BEGIN
  DECLARE v_estado VARCHAR(12);
  DECLARE v_lote INT UNSIGNED;
  DECLARE v_titulo VARCHAR(160);
  DECLARE v_responsable INT UNSIGNED;
  DECLARE v_codigo VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT estado, lote_id, titulo, responsable_id INTO v_estado, v_lote, v_titulo, v_responsable
    FROM tareas WHERE id = p_tarea_id AND vivero_id = p_vivero_id FOR UPDATE;
  IF v_estado IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La tarea no existe en este vivero.'; END IF;
  IF v_estado = 'Completada' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La tarea ya está completada.'; END IF;
  UPDATE tareas SET estado = 'Completada', completada_en = NOW() WHERE id = p_tarea_id;
  IF v_lote IS NOT NULL THEN
    SELECT fn_codigo('TRZ', MAX(CAST(SUBSTRING_INDEX(codigo, '-', -1) AS UNSIGNED))) INTO v_codigo
      FROM eventos_trazabilidad WHERE vivero_id = p_vivero_id AND codigo REGEXP '^TRZ-[0-9]+$';
    INSERT INTO eventos_trazabilidad (vivero_id, codigo, lote_id, tipo, fecha_hora, responsable_id, detalle, origen)
    VALUES (p_vivero_id, v_codigo, v_lote, 'Tarea completada', NOW(), v_responsable,
            CONCAT(v_titulo, IF(NULLIF(TRIM(p_nota), '') IS NULL, '.', CONCAT('. ', TRIM(p_nota)))), 'Personal');
  END IF;
  COMMIT;
END$$

DELIMITER ;


-- =====================================================================
-- VISTAS (lo que calculan hoy los tableros y reportes)
-- =====================================================================

-- Resumen por lote: supervivencia, costo total y costo por planta viva
CREATE VIEW v_lotes_resumen AS
SELECT l.vivero_id, l.id AS lote_id, l.codigo, CONCAT_WS(' ', c.nombre, NULLIF(c.variedad, '')) AS cultivo,
       z.nombre AS zona, p.nombre AS responsable, l.etapa, l.estado,
       l.cantidad_inicial, l.cantidad_actual,
       ROUND(100 * l.cantidad_actual / l.cantidad_inicial, 1) AS supervivencia_pct,
       l.fecha_inicio, l.fecha_estimada,
       COALESCE(SUM(CASE WHEN k.tipo = 'gasto' THEN k.valor END), 0)   AS gastos,
       COALESCE(SUM(CASE WHEN k.tipo = 'ingreso' THEN k.valor END), 0) AS ingresos,
       ROUND(COALESCE(SUM(CASE WHEN k.tipo = 'gasto' THEN k.valor END), 0) / NULLIF(l.cantidad_actual, 0), 0) AS costo_por_planta
  FROM lotes l
  JOIN cultivos c ON c.id = l.cultivo_id
  JOIN zonas z    ON z.id = l.zona_id
  JOIN personas p ON p.id = l.responsable_id
  LEFT JOIN costos k ON k.lote_id = l.id
 GROUP BY l.id;

-- Cola de reposición de inventario
CREATE VIEW v_insumos_por_reponer AS
SELECT vivero_id, id AS insumo_id, codigo, nombre, categoria, unidad, stock, minimo,
       (minimo - stock) AS faltante, precio_unitario
  FROM inventario
 WHERE activo AND stock <= minimo;

-- Última lectura de cada zona con su estado frente a los umbrales
CREATE VIEW v_ultima_lectura_zona AS
SELECT z.vivero_id, z.id AS zona_id, z.nombre AS zona, la.fecha_hora, la.temperatura, la.humedad, la.iluminacion,
       COALESCE(z.temp_min, cf.temp_min) AS temp_min, COALESCE(z.temp_max, cf.temp_max) AS temp_max,
       COALESCE(z.hum_min, cf.hum_min)   AS hum_min,  COALESCE(z.hum_max, cf.hum_max)   AS hum_max,
       CASE
         WHEN la.id IS NULL THEN 'Sin lecturas'
         WHEN la.temperatura > COALESCE(z.temp_max, cf.temp_max) THEN 'Temperatura alta'
         WHEN la.temperatura < COALESCE(z.temp_min, cf.temp_min) THEN 'Temperatura baja'
         WHEN la.humedad > COALESCE(z.hum_max, cf.hum_max) THEN 'Humedad alta'
         WHEN la.humedad < COALESCE(z.hum_min, cf.hum_min) THEN 'Humedad baja'
         ELSE 'En rango'
       END AS estado
  FROM zonas z
  JOIN configuracion cf ON cf.vivero_id = z.vivero_id
  LEFT JOIN lecturas_ambientales la
         ON la.id = (SELECT l2.id FROM lecturas_ambientales l2
                      WHERE l2.zona_id = z.id ORDER BY l2.fecha_hora DESC, l2.id DESC LIMIT 1)
 WHERE z.activa;

-- Carga de trabajo por persona
CREATE VIEW v_carga_personal AS
SELECT p.vivero_id, p.id AS persona_id, p.nombre, p.cargo, p.estado,
       COUNT(CASE WHEN t.estado <> 'Completada' THEN 1 END) AS tareas_abiertas,
       COUNT(CASE WHEN t.estado <> 'Completada' AND t.fecha_limite < CURDATE() THEN 1 END) AS tareas_vencidas,
       (SELECT COUNT(*) FROM lotes l WHERE l.responsable_id = p.id AND l.estado = 'Activo') AS lotes_activos
  FROM personas p
  LEFT JOIN tareas t ON t.responsable_id = p.id
 GROUP BY p.id;

-- Incidencias abiertas o en revisión, con su lote
CREATE VIEW v_incidencias_abiertas AS
SELECT i.vivero_id, i.id AS incidencia_id, i.codigo, l.codigo AS lote, i.prioridad, i.estado, i.descripcion,
       p.nombre AS responsable, i.fecha_reporte, DATEDIFF(CURDATE(), i.fecha_reporte) AS dias_abierta
  FROM incidencias i
  JOIN lotes l    ON l.id = i.lote_id
  JOIN personas p ON p.id = i.responsable_id
 WHERE i.estado <> 'Cerrada';

-- Resultado por mes (gastos, ingresos y balance)
CREATE VIEW v_resultado_mensual AS
SELECT vivero_id, DATE_FORMAT(fecha, '%Y-%m') AS mes,
       SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END)   AS gastos,
       SUM(CASE WHEN tipo = 'ingreso' THEN valor ELSE 0 END) AS ingresos,
       SUM(CASE WHEN tipo = 'ingreso' THEN valor ELSE -valor END) AS balance
  FROM costos
 GROUP BY vivero_id, DATE_FORMAT(fecha, '%Y-%m');
