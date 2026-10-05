"""Convierte los datos de ejemplo de la app (src/datos/semilla.js) en INSERTs para MySQL.

Uso:
  1. Exportar la semilla a JSON con Node (ver README de esta carpeta).
  2. python docs/base-de-datos/herramientas/generar_datos_ejemplo.py semilla.json > docs/base-de-datos/aiden_mysql_datos_ejemplo.sql

Las fechas de la semilla son relativas al día en que se exporta.
"""
import json
import sys

import bcrypt

d = json.load(open(sys.argv[1], encoding="utf-8"))
s = d["semilla"]
V = 1  # vivero de ejemplo


class Vacio(str):
    """Texto vacío que debe guardarse como '' y no como NULL."""


def q(v):
    if isinstance(v, Vacio):
        return "''"
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def insert(tabla, columnas, filas):
    out = [f"INSERT INTO {tabla} ({', '.join(columnas)}) VALUES"]
    out.append(",\n".join("  (" + ", ".join(q(x) for x in f) + ")" for f in filas) + ";\n")
    return "\n".join(out)


def dt(v):  # '2026-10-02T20:49' -> '2026-10-02 20:49:00'
    if not v:
        return None
    v = v.replace("T", " ")
    return v + ":00" if len(v) == 16 else (v + " 08:00:00" if len(v) == 10 else v)


sql = ["-- AiDEN · Datos de ejemplo (los mismos de la app). Ejecutar después de aiden_mysql_esquema.sql.",
       "-- Contraseña de las tres cuentas de ejemplo: aiden123 (guardada como hash bcrypt).",
       "USE aiden;", "SET @aiden_usuario_id = NULL;", "START TRANSACTION;", ""]
sql.append(insert("viveros", ["id", "nombre"], [[V, "Vivero de ejemplo AiDEN"]]))

c = s["configuracion"]
sql.append(insert("configuracion", ["vivero_id", "temp_min", "temp_max", "hum_min", "hum_max", "notificaciones"],
                  [[V, c["tempMin"], c["tempMax"], c["humMin"], c["humMax"], c.get("notificaciones") != "Desactivadas"]]))

per = {p["id"]: i for i, p in enumerate(s["personas"], 1)}
por_nombre = {p["nombre"]: per[p["id"]] for p in s["personas"]}
sql.append(insert("personas", ["id", "vivero_id", "codigo", "nombre", "cargo", "departamento", "contacto", "estado"],
                  [[per[p["id"]], V, p["id"], p["nombre"], p["cargo"], p["departamento"], p.get("contacto"), p["estado"]] for p in s["personas"]]))

cuentas = [("Jordan Aragon", "jordanaragon@aiden.com", "admin", "PER-001"),
           ("Laura Méndez", "supervisor@aiden.com", "supervisor", "PER-002"),
           ("Andrés Rojas", "operario@aiden.com", "operario", "PER-003")]
h = bcrypt.hashpw(b"aiden123", bcrypt.gensalt(rounds=10)).decode()
sql.append(insert("usuarios", ["id", "vivero_id", "persona_id", "nombre", "correo", "clave_hash", "rol", "revisado"],
                  [[i, V, per[pid], n, e, h, r, True] for i, (n, e, r, pid) in enumerate(cuentas, 1)]))

TIPO_ZONA = {"Invernadero": "Invernadero", "Umbráculo": "Umbráculo", "Área de germinación": "Germinación"}
zon = {z["nombre"]: i for i, z in enumerate(s["zonas"], 1)}
sql.append(insert("zonas", ["id", "vivero_id", "codigo", "nombre", "tipo", "descripcion"],
                  [[zon[z["nombre"]], V, z["id"], z["nombre"],
                    next((t for k, t in TIPO_ZONA.items() if z["nombre"].startswith(k)), "Otro"), z.get("descripcion")] for z in s["zonas"]]))

CULTIVOS = {"Aguacate Hass injertado": ("Aguacate", "Hass injertado"), "Café variedad Castillo": ("Café", "Castillo"),
            "Cilantro": ("Cilantro", ""), "Lechuga crespa": ("Lechuga", "Crespa"), "Pimentón": ("Pimentón", ""),
            "Tomate chonto": ("Tomate", "Chonto")}
nombres_cult = sorted({l["cultivo"] for l in s["lotes"]})
cul = {n: i for i, n in enumerate(nombres_cult, 1)}
sql.append(insert("cultivos", ["id", "vivero_id", "nombre", "variedad"],
                  [[cul[n], V, CULTIVOS.get(n, (n, ""))[0], CULTIVOS.get(n, (n, ""))[1] or Vacio("")] for n in nombres_cult]))

lot = {l["lote"]: i for i, l in enumerate(sorted(s["lotes"], key=lambda x: x["lote"]), 1)}
sql.append(insert("lotes", ["id", "vivero_id", "codigo", "cultivo_id", "zona_id", "responsable_id", "cantidad_inicial", "cantidad_actual",
                            "etapa", "estado", "fecha_inicio", "fecha_estimada", "fecha_cierre", "motivo_cierre", "notas"],
                  [[lot[l["lote"]], V, l["lote"], cul[l["cultivo"]], zon[l["ubicacion"]], per[l["responsableId"]], l["cantidadInicial"],
                    l["cantidad"], l["etapa"], l["estado"], l["fecha"], l.get("fechaEstimada"), l.get("cierre"), l.get("motivoCierre"), l.get("notas")]
                   for l in sorted(s["lotes"], key=lambda x: x["lote"])]))

sql.append(insert("tareas", ["vivero_id", "codigo", "titulo", "descripcion", "lote_id", "responsable_id", "prioridad", "estado", "modulo",
                             "fecha_limite", "creada_en", "completada_en"],
                  [[V, t["id"], t["titulo"], t.get("descripcion"), lot.get(t.get("lote")), per[t["responsableId"]], t["prioridad"], t["estado"],
                    t["modulo"], t["fecha"], dt(t.get("creada")), dt(t.get("completada"))] for t in s["tareas"]]))

inv = {i["id"]: n for n, i in enumerate(s["inventario"], 1)}
sql.append(insert("inventario", ["id", "vivero_id", "codigo", "nombre", "categoria", "unidad", "stock", "minimo", "precio_unitario"],
                  [[inv[i["id"]], V, i["id"], i["nombre"], i["categoria"], i["unidad"], i["stock"], i["minimo"], i["precio"]] for i in s["inventario"]]))

mov = {m["id"]: n for n, m in enumerate(s["movimientos"], 1)}
sql.append(insert("movimientos_inventario", ["id", "vivero_id", "codigo", "insumo_id", "tipo", "cantidad", "valor", "fecha", "motivo", "lote_id", "responsable_id"],
                  [[mov[m["id"]], V, m["id"], inv[m["itemId"]], m["tipo"], m["cantidad"], m.get("valor") or 0, m["fecha"], m.get("motivo") or m["tipo"].capitalize(),
                    lot.get(m.get("lote")) if m["tipo"] == "salida" else None, per.get(m.get("responsableId"))] for m in s["movimientos"]]))

sql.append(insert("costos", ["vivero_id", "codigo", "tipo", "concepto", "categoria", "valor", "fecha", "lote_id", "origen", "movimiento_id"],
                  [[V, k["id"], k["tipo"], k["concepto"], k["categoria"], k["valor"], k["fecha"], lot.get(k.get("lote")),
                    k.get("origen") or "manual", mov.get(k.get("movimientoId"))] for k in s["costos"]]))

sql.append(insert("incidencias", ["vivero_id", "codigo", "lote_id", "prioridad", "descripcion", "responsable_id", "reportado_por_id", "estado",
                                  "accion_correctiva", "fecha_reporte", "fecha_cierre"],
                  [[V, i["codigo"], lot[i["lote"]], i["prioridad"], i["descripcion"], per[i["responsableId"]], per.get(i.get("reportadoPor")),
                    i["estado"], i.get("accion"), i["fecha"], i.get("cierre") if i["estado"] == "Cerrada" else None] for i in s["calidad"]]))

sql.append(insert("lecturas_ambientales", ["vivero_id", "zona_id", "fecha_hora", "temperatura", "humedad", "iluminacion", "origen", "registrado_por_id"],
                  [[V, zon[a["zona"]], dt(a["fecha"]), a["temperatura"], a["humedad"], a.get("iluminacion"), "manual", por_nombre.get(a.get("registradoPor"))]
                   for a in s["ambiental"]]))

sql.append(insert("eventos_trazabilidad", ["vivero_id", "codigo", "lote_id", "tipo", "fecha_hora", "responsable_id", "detalle", "origen"],
                  [[V, e["id"], lot[e["lote"]], e["evento"], dt(e["fecha"]), per.get(e.get("responsableId")), e["detalle"], e["origen"]]
                   for e in sorted(s["trazabilidad"], key=lambda x: x["id"])]))

sql.append("COMMIT;")
print("\n".join(sql))
