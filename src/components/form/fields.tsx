"use client";

import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Storefront form controls, as in the checkout design: filled #f4f4f2 fields, 2px radius, 48px tall. */

const control =
  "h-12 w-full min-w-0 rounded-sm border border-transparent bg-secondary px-4 text-[15px] text-foreground transition-colors outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:opacity-60";

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria props tying a control to its Field's error message. */
export const describedBy = (id: string, error?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function SelectInput({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function CheckboxRow({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label
      className={cn("flex cursor-pointer items-start gap-2 text-sm leading-[22px] text-muted-foreground", className)}
    >
      <input type="checkbox" className="mt-[3px] size-4 shrink-0 accent-brand" {...props} />
      <span>{label}</span>
    </label>
  );
}

/** A selectable row (shipping or payment method): filled when checked. */
export function RadioCard({
  checked,
  className,
  children,
  ...props
}: ComponentProps<"input"> & { checked: boolean; children: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-sm border p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/30",
        checked ? "border-transparent bg-secondary" : "border-border bg-card hover:bg-surface",
        className,
      )}
    >
      <input type="radio" checked={checked} className="mt-[3px] size-4 shrink-0 accent-brand outline-none" {...props} />
      {children}
    </label>
  );
}

/** A password field with a show/hide toggle. */
export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  ...props
}: ComponentProps<"input"> & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={cn(control, "pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}

/** The full-width black submit button used by storefront forms. */
export function SubmitButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="submit"
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:bg-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
}
