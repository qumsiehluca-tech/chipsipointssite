"use client";

import { useEffect, useRef, useState } from "react";

export type ActionOption = { value: string; label: string };

/**
 * A dropdown whose list is exactly as wide as the field and wraps long text.
 * A native <select> sizes its popup to the longest option, which pushes the
 * long action names off the edge of the screen.
 */
export default function ActionSelect({
  value,
  options,
  onChange
}: {
  value: string;
  options: ActionOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 border-b border-gold/25 px-1 py-3 text-left text-parchment hover:border-gold/60 focus:outline-none focus:border-gold transition-colors"
      >
        <span className="min-w-0 break-words">{current?.label ?? "Select an action"}</span>
        <span aria-hidden className="shrink-0 text-gold/70 leading-6">
          ▾
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto border border-gold/30 bg-lodge shadow-xl"
        >
          {options.map((o, i) => (
            <li key={`${i}-${o.value}`} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm break-words hover:bg-gold/10 hover:text-goldBright transition-colors ${
                  o.value === value ? "text-goldBright" : "text-parchment"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
