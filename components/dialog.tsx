"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type DialogField = {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  options?: readonly { value: string; label: string }[];
};

export function Dialog({
  title,
  description,
  fields,
  confirmLabel = "Confirmar",
  danger = false,
  onCancel,
  onSubmit,
}: {
  title: string;
  description: string;
  fields: DialogField[];
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.name, field.value])));

  useEffect(() => {
    setValues(Object.fromEntries(fields.map((field) => [field.name, field.value])));
  }, [fields]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="dialog-title" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p></div>
          <button type="button" className="icon-button !min-h-9 !min-w-9" onClick={onCancel} aria-label="Fechar diálogo"><X size={18} /></button>
        </div>
        <div className="mt-5 space-y-4">{fields.map((field) => <label key={field.name} className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">{field.label}{field.options ? <select autoFocus={field === fields[0]} value={values[field.name] || ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-lilac-500/20">{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input autoFocus={field === fields[0]} value={values[field.name] || ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-lilac-500/20" />}</label>)}</div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancelar</button><button type="submit" className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-lilac-500 hover:bg-lilac-600"}`}>{confirmLabel}</button></div>
      </form>
    </div>
  );
}

