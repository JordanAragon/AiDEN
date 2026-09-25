import { AlertTriangle } from "lucide-react";

export default function AlertaFormulario({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}
