import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared screen structure, based on 6.2 Objetivos de calidad.
 * Keep actions, permissions and document exports in the consuming module.
 *
 * New modules should compose ModulePage > ModuleHeader + ModuleToolbar
 * (optional) + ModuleContent. Use ModulePanel for tables and the shared
 * ui controls for forms: primary blue, outline secondary, semantic status
 * colors, text-sm body copy and text-xs only for secondary metadata.
 * Keep long tables in a positioned overflow-x-auto container so hidden
 * accessible labels cannot escape the horizontal scroll region.
 */
export function ModulePage({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="module-page" className={cn("flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100", className)} {...props} />;
}

type ModuleHeaderProps = {
  clause?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ModuleHeader({ clause, title, description, actions, className }: ModuleHeaderProps) {
  return (
    <header data-slot="module-header" className={cn("flex min-w-0 flex-col gap-5 rounded-t-2xl border-b border-slate-100 bg-slate-50/40 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8 dark:border-slate-800 dark:bg-slate-950/20", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          {clause && <span>{clause} </span>}
          <span className="text-blue-600 dark:text-blue-400">{title}</span>
        </h1>
        {description && <div className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</div>}
      </div>
      {actions && <div data-slot="module-actions" className="flex max-w-full flex-wrap items-center gap-3 lg:max-w-[50%] lg:justify-end [&>button]:max-w-full [&>button]:whitespace-normal [&>button]:text-left">{actions}</div>}
    </header>
  );
}

export function ModuleToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="module-toolbar" className={cn("flex min-w-0 flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/20", className)} {...props} />;
}

export function ModuleContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="module-content" className={cn("min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:pb-10", className)} {...props} />;
}

export function ModulePanel({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="module-panel" className={cn("min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)} {...props} />;
}
