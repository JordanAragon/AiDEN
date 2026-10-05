-- Pruebas de las reglas de la base AiDEN. Ejecutar después de cargar esquema y datos de ejemplo.
-- Cada bloque imprime lo que pasó; los errores esperados se capturan con procedimientos de prueba.
USE aiden;
SET @aiden_usuario_id = 1;

DROP PROCEDURE IF EXISTS _esperar_error;
DELIMITER $$
CREATE PROCEDURE _esperar_error(IN p_nombre VARCHAR(120), IN p_sql TEXT)
BEGIN
  DECLARE v_msg TEXT DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN GET DIAGNOSTICS CONDITION 1 v_msg = MESSAGE_TEXT; END;
  SET @s = p_sql; PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  SELECT p_nombre AS prueba, IF(v_msg IS NULL, 'FALLA: no bloqueó', CONCAT('OK · ', v_msg)) AS resultado;
END$$
DELIMITER ;

CALL _esperar_error('stock negativo', "UPDATE inventario SET stock = -1 WHERE id = 1");
CALL _esperar_error('cerrar incidencia sin acción', "UPDATE incidencias SET estado='Cerrada', fecha_cierre=CURDATE(), accion_correctiva=NULL WHERE estado='Abierta' LIMIT 1");
CALL _esperar_error('editar trazabilidad', "UPDATE eventos_trazabilidad SET detalle='x' WHERE id = 1");
CALL _esperar_error('borrar trazabilidad', "DELETE FROM eventos_trazabilidad WHERE id = 1");
CALL _esperar_error('editar costo de inventario', "UPDATE costos SET valor = 1 WHERE origen='inventario' LIMIT 1");
CALL _esperar_error('borrar insumo con movimientos', "DELETE FROM inventario WHERE id = 1");
CALL _esperar_error('borrar zona con lotes', "DELETE FROM zonas WHERE id = 1");
CALL _esperar_error('reabrir lote cerrado', "UPDATE lotes SET estado='Activo', fecha_cierre=NULL, motivo_cierre=NULL WHERE estado='Cerrado'");
CALL _esperar_error('categoría de ingreso en un gasto', "INSERT INTO costos (vivero_id,codigo,tipo,concepto,categoria,valor,fecha) VALUES (1,'CST-T1','gasto','x','Anticipo',100,CURDATE())");
CALL _esperar_error('humedad fuera de rango', "INSERT INTO lecturas_ambientales (vivero_id,zona_id,fecha_hora,temperatura,humedad) VALUES (1,1,NOW(),20,120)");
CALL _esperar_error('desactivar persona con tareas abiertas', "UPDATE personas SET estado='Inactivo' WHERE id = 3");
CALL _esperar_error('tarea en lote cerrado', "INSERT INTO tareas (vivero_id,codigo,titulo,lote_id,responsable_id,fecha_limite) SELECT 1,'TSK-T1','x',id,3,CURDATE() FROM lotes WHERE estado='Cerrado' LIMIT 1");
CALL _esperar_error('salida mayor al stock', "CALL sp_registrar_movimiento(1, 1, 'salida', 99999, CURDATE(), 'prueba', NULL, 3, FALSE, @m)");
CALL _esperar_error('avanzar lote en Cosecha', "CALL sp_avanzar_etapa(1, (SELECT id FROM lotes WHERE etapa='Cosecha' AND estado='Activo' LIMIT 1), 2)");

-- Flujo completo: salida de insumo cargada a un lote
SELECT stock INTO @antes FROM inventario WHERE id = 2;
SELECT id INTO @lote FROM lotes WHERE estado='Activo' AND etapa='Germinación' LIMIT 1;
CALL sp_registrar_movimiento(1, 2, 'salida', 1, CURDATE(), 'Prueba de flujo', @lote, 3, TRUE, @mov);
SELECT 'salida con costo' AS prueba,
       IF((SELECT stock FROM inventario WHERE id = 2) = @antes - 1
          AND (SELECT COUNT(*) FROM costos WHERE movimiento_id = @mov) = 1
          AND (SELECT COUNT(*) FROM eventos_trazabilidad WHERE lote_id = @lote AND tipo='Consumo de insumo' AND detalle LIKE '%cargados al lote%') >= 1,
          'OK · stock, costo y trazabilidad en una sola transacción', 'FALLA') AS resultado;

CALL sp_avanzar_etapa(1, @lote, 2);
SELECT 'avanzar etapa' AS prueba, IF((SELECT etapa FROM lotes WHERE id=@lote)='Adaptación', 'OK · pasa a Adaptación con evento', 'FALLA') AS resultado;

SELECT id INTO @inc FROM incidencias WHERE estado='Abierta' LIMIT 1;
CALL sp_cerrar_incidencia(1, @inc, 'Se aplicó fungicida y se retiraron bandejas afectadas.', 4);
SELECT 'cerrar incidencia' AS prueba, IF((SELECT estado FROM incidencias WHERE id=@inc)='Cerrada', 'OK · cerrada con acción y evento', 'FALLA') AS resultado;

SELECT id INTO @t FROM tareas WHERE estado='Pendiente' AND lote_id IS NOT NULL LIMIT 1;
CALL sp_completar_tarea(1, @t, NULL);
SELECT 'completar tarea' AS prueba, IF((SELECT estado FROM tareas WHERE id=@t)='Completada', 'OK · completada con evento', 'FALLA') AS resultado;

SELECT id INTO @lc FROM lotes WHERE estado='Activo' AND etapa='Cosecha' LIMIT 1;
CALL sp_cerrar_lote(1, @lc, 'Despachado', 'Prueba de cierre', 2);
SELECT 'cerrar lote' AS prueba, IF((SELECT estado FROM lotes WHERE id=@lc)='Cerrado', 'OK · cerrado con despacho', 'FALLA') AS resultado;

UPDATE usuarios SET rol='supervisor' WHERE id = 3;
SELECT 'auditoría de rol' AS prueba, IF((SELECT COUNT(*) FROM auditoria WHERE tabla='usuarios' AND accion='editar')=1, 'OK · cambio de rol auditado', 'FALLA') AS resultado;

DROP PROCEDURE _esperar_error;
