"use client";

import { useEffect, useRef, useState } from "react";
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
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.value])),
  );
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setValues(
      Object.fromEntries(fields.map((field) => [field.name, field.value])),
    );
  }, [fields]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    focusable[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Tab" && focusable.length > 1) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex max-h-[100dvh] items-center justify-center overflow-y-auto bg-black/35 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        ref={dialogRef}
        role={danger ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h2>
            <p
              id="dialog-description"
              className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            className="icon-button !min-h-10 !min-w-10"
            onClick={onCancel}
            aria-label="Fechar diálogo"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {fields.map((field) => (
            <label
              key={field.name}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              {field.label}
              {field.options ? (
                <select
                  autoFocus={field === fields[0]}
                  value={values[field.name] || ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-lilac-500/20"
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus={field === fields[0]}
                  value={values[field.name] || ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-lilac-500/20"
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 sm:flex-none dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white sm:flex-none ${danger ? "bg-red-500 hover:bg-red-600" : "bg-lilac-500 hover:bg-lilac-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
