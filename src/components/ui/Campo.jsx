import { useId } from "react";

const CONTROL =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 aria-[invalid=true]:border-red-400 read-only:bg-slate-50 read-only:text-slate-500";

function Envoltura({ id, etiqueta, ayuda, error, opcional, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium text-slate-600">
        <span>{etiqueta}</span>
        {opcional && <span className="text-xs font-normal text-slate-500">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="mt-1 text-xs text-slate-500">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

function aria(id, ayuda, error) {
  return {
    id,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined,
  };
}

export function Entrada({ etiqueta, ayuda, error, opcional, className, ...props }) {
  const id = useId();
  return (
    <Envoltura id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} className={className}>
      <input className={CONTROL} {...aria(id, ayuda, error)} {...props} />
    </Envoltura>
  );
}

export function Seleccion({ etiqueta, ayuda, error, opcional, className, children, ...props }) {
  const id = useId();
  return (
    <Envoltura id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} className={className}>
      <select className={CONTROL} {...aria(id, ayuda, error)} {...props}>
        {children}
      </select>
    </Envoltura>
  );
}

export function AreaTexto({ etiqueta, ayuda, error, opcional, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <Envoltura id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} className={className}>
      <textarea rows={rows} className={`${CONTROL} resize-y`} {...aria(id, ayuda, error)} {...props} />
    </Envoltura>
  );
}

export function Casilla({ etiqueta, descripcion, className = "", ...props }) {
  const id = useId();
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-700" {...props} />
      <label htmlFor={id} className="text-sm text-slate-600">
        <span className="font-medium text-slate-700">{etiqueta}</span>
        {descripcion && <span className="mt-0.5 block text-xs text-slate-500">{descripcion}</span>}
      </label>
    </div>
  );
}

export function Selector({ className = "", ...props }) {
  return <select className={`rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 ${className}`} {...props} />;
}
