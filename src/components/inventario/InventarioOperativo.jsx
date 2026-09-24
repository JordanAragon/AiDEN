import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDollarSign,
  History,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";

const KEY = "aiden-inventario";
const MOV_KEY = "aiden-movimientos-inventario";
const seed = [
  {
    id: "INV-001",
    nombre: "Sustrato Premium",
    categoria: "Sustratos",
    stock: 18,
    minimo: 25,
    unidad: "unidades",
    precio: 18500,
  },
  {
    id: "INV-002",
    nombre: "Bandeja 128",
    categoria: "Envases",
    stock: 146,
    minimo: 60,
    unidad: "unidades",
    precio: 2400,
  },
  {
    id: "INV-003",
    nombre: "Fertilizante foliar",
    categoria: "Fertilizantes",
    stock: 42,
    minimo: 15,
    unidad: "litros",
    precio: 32000,
  },
  {
    id: "INV-004",
    nombre: "Semilla de tomate",
    categoria: "Semillas",
    stock: 8,
    minimo: 10,
    unidad: "sobres",
    precio: 18500,
  },
];
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = (p) => `${p}-${Date.now().toString(36).toUpperCase()}`;
const money = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
function Modal({ title, onClose, children }) {
  return (
    <section className="aiden-modal-fondo fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <article className="aiden-modal-entrada max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </header>
        <section className="p-5">{children}</section>
      </article>
    </section>
  );
}
function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
function Select({ label, children, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <select
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500"
      >
        {children}
      </select>
    </label>
  );
}
function Kpi({ label, value, detail, icon: Icon, tone = "green" }) {
  const t = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${t[tone]}`}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

export default function InventarioOperativo() {
  const [items, setItems] = useState(() => read(KEY, seed));
  const [movs, setMovs] = useState(() => read(MOV_KEY, []));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const low = items.filter((i) => Number(i.stock) <= Number(i.minimo));
  const total = items.reduce(
    (a, i) => a + Number(i.stock) * Number(i.precio || 0),
    0,
  );
  const cats = [...new Set(items.map((i) => i.categoria))];
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "Todos" || i.categoria === filter) &&
          `${i.nombre} ${i.id}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );
  const save = (data) => {
    setItems(data);
    write(KEY, data);
    window.dispatchEvent(new Event("aiden-data-change"));
  };
  const move = (f) => {
    const amount = Number(f.cantidad);
    const selectedItem = items.find((i) => i.id === f.itemId);
    if (!selectedItem || amount <= 0) return;
    if (f.tipo === "salida" && amount > Number(selectedItem.stock)) return;
    const delta = f.tipo === "entrada" ? amount : -amount;
    save(
      items.map((i) =>
        i.id === selectedItem.id ? { ...i, stock: Number(i.stock) + delta } : i,
      ),
    );
    const next = {
      id: uid("MOV"),
      itemId: selectedItem.id,
      item: selectedItem.nombre,
      tipo: f.tipo,
      cantidad: amount,
      fecha: f.fecha,
      motivo: f.motivo || "Sin motivo",
      lote: f.lote || "",
    };
    const all = [next, ...movs];
    setMovs(all);
    write(MOV_KEY, all);
    setModal(null);
    setSelected(null);
  };
  const create = (f) => {
    save([
      {
        ...f,
        id: uid("INV"),
        stock: Number(f.stock),
        minimo: Number(f.minimo),
        precio: Number(f.precio),
      },
      ...items,
    ]);
    setModal(null);
  };
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / operación
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control de stock con entradas, salidas, alertas de reposición e
            historial de movimientos.
          </p>
        </section>
        <section className="flex gap-2">
          <button
            type="button"
            onClick={() => setModal("move")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-emerald-200"
          >
            <History size={15} />
            Movimiento
          </button>
          <button
            type="button"
            onClick={() => setModal("item")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={16} />
            Nuevo insumo
          </button>
        </section>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Artículos"
          value={items.length}
          detail={`${cats.length} categorías`}
          icon={Package}
        />
        <Kpi
          label="Bajo mínimo"
          value={low.length}
          detail="Reponer cuanto antes"
          icon={AlertTriangle}
          tone={low.length ? "amber" : "green"}
        />
        <Kpi
          label="Valor en stock"
          value={money(total)}
          detail="Existencia × precio"
          icon={CircleDollarSign}
          tone="blue"
        />
        <Kpi
          label="Movimientos"
          value={movs.length}
          detail="Historial registrado"
          icon={History}
        />
      </section>
      {low.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <header className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-700" />
            <h2 className="font-semibold text-amber-900">Cola de reposición</h2>
          </header>
          <section className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {low.map((i) => (
              <button
                type="button"
                key={i.id}
                onClick={() => {
                  setSelected(i);
                  setModal("move");
                }}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-white/70 p-3 text-left hover:bg-white"
              >
                <span>
                  <strong className="block text-sm text-slate-800">
                    {i.nombre}
                  </strong>
                  <small className="text-xs text-slate-500">
                    {i.stock} / mínimo {i.minimo} {i.unidad}
                  </small>
                </span>
                <span className="text-xs font-bold text-amber-700">
                  Reponer
                </span>
              </button>
            ))}
          </section>
        </section>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <section className="relative min-w-56 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar insumo o código..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </section>
          {["Todos", ...cats].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === c ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {c}
            </button>
          ))}
        </header>
        <section className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Insumo",
                  "Categoría",
                  "Stock",
                  "Nivel",
                  "Mínimo",
                  "Valor",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    (Number(i.stock) / Math.max(1, Number(i.minimo) * 2)) * 100,
                  ),
                );
                return (
                  <tr
                    key={i.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(i)}
                        className="text-left"
                      >
                        <p className="text-sm font-semibold text-slate-800 hover:text-emerald-700">
                          {i.nombre}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {i.id}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {i.categoria}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">
                      {i.stock}{" "}
                      <span className="font-normal text-slate-400">
                        {i.unidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-44">
                      <section className="h-2 rounded-full bg-slate-100">
                        <span
                          className={`block h-full rounded-full transition-[width] duration-500 ease-out ${Number(i.stock) <= Number(i.minimo) ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </section>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {i.minimo}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {money(Number(i.stock) * Number(i.precio || 0))}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(i);
                          setModal("move");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <ArrowUpFromLine size={13} />
                        Mover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>
      {selected && modal !== "move" && (
        <Modal title={selected.nombre} onClose={() => setSelected(null)}>
          <section className="grid grid-cols-2 gap-3">
            <Kpi
              label="Stock"
              value={`${selected.stock} ${selected.unidad}`}
              detail={`Mínimo ${selected.minimo}`}
              icon={Package}
            />
            <Kpi
              label="Valor"
              value={money(
                Number(selected.stock) * Number(selected.precio || 0),
              )}
              detail={`${money(selected.precio)} / unidad`}
              icon={CircleDollarSign}
              tone="blue"
            />
          </section>
          <button
            type="button"
            onClick={() => setModal("move")}
            className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
          >
            Registrar movimiento
          </button>
        </Modal>
      )}
      {modal === "move" && (
        <Modal
          title={`Movimiento${selected ? ` · ${selected.nombre}` : ""}`}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
        >
          <MovementForm items={items} initial={selected} onSubmit={move} />
        </Modal>
      )}
      {modal === "item" && (
        <Modal title="Nuevo insumo" onClose={() => setModal(null)}>
          <ItemForm onSubmit={create} />
        </Modal>
      )}
    </section>
  );
}
function MovementForm({ items, initial, onSubmit }) {
  const [f, setF] = useState({
    itemId: initial?.id || items[0]?.id || "",
    tipo: "entrada",
    cantidad: "1",
    fecha: new Date().toISOString().slice(0, 10),
    motivo: "",
    lote: "",
  });
  const current = items.find((i) => i.id === f.itemId);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <Select
        label="Insumo"
        value={f.itemId}
        onChange={(e) => setF({ ...f, itemId: e.target.value })}
      >
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre} · stock {i.stock}
          </option>
        ))}
      </Select>
      <section className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={f.tipo}
          onChange={(e) => setF({ ...f, tipo: e.target.value })}
        >
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </Select>
        <Input
          label={`Cantidad${current ? ` · ${current.unidad}` : ""}`}
          type="number"
          min="1"
          max={f.tipo === "salida" ? current?.stock : undefined}
          value={f.cantidad}
          onChange={(e) => setF({ ...f, cantidad: e.target.value })}
          required
        />
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha"
          type="date"
          value={f.fecha}
          onChange={(e) => setF({ ...f, fecha: e.target.value })}
        />
        <Input
          label="Lote asociado"
          value={f.lote}
          onChange={(e) => setF({ ...f, lote: e.target.value })}
        />
      </section>
      <Input
        label="Motivo"
        value={f.motivo}
        onChange={(e) => setF({ ...f, motivo: e.target.value })}
        placeholder="Compra, consumo, ajuste..."
      />
      <button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">
        Confirmar movimiento
      </button>
    </form>
  );
}
function ItemForm({ onSubmit }) {
  const [f, setF] = useState({
    nombre: "",
    categoria: "Sustratos",
    stock: "",
    minimo: "",
    unidad: "unidades",
    precio: "",
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <Input
        label="Nombre"
        value={f.nombre}
        onChange={(e) => setF({ ...f, nombre: e.target.value })}
        required
      />
      <Select
        label="Categoría"
        value={f.categoria}
        onChange={(e) => setF({ ...f, categoria: e.target.value })}
      >
        <option>Sustratos</option>
        <option>Semillas</option>
        <option>Fertilizantes</option>
        <option>Herramientas</option>
        <option>Envases</option>
      </Select>
      <section className="grid grid-cols-2 gap-3">
        <Input
          label="Stock inicial"
          type="number"
          min="0"
          value={f.stock}
          onChange={(e) => setF({ ...f, stock: e.target.value })}
          required
        />
        <Input
          label="Mínimo"
          type="number"
          min="0"
          value={f.minimo}
          onChange={(e) => setF({ ...f, minimo: e.target.value })}
          required
        />
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Select
          label="Unidad"
          value={f.unidad}
          onChange={(e) => setF({ ...f, unidad: e.target.value })}
        >
          <option>unidades</option>
          <option>litros</option>
          <option>kilogramos</option>
          <option>sobres</option>
        </Select>
        <Input
          label="Precio unitario"
          type="number"
          min="0"
          value={f.precio}
          onChange={(e) => setF({ ...f, precio: e.target.value })}
          required
        />
      </section>
      <button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">
        Crear insumo
      </button>
    </form>
  );
}
