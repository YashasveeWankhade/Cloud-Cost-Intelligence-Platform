import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
            "border border-white/10 bg-white/[0.04] backdrop-blur-sm",
            "hover:shadow-[0_2px_16px_rgba(99,102,241,0.08)]",
            "hover:-translate-y-0.5 will-change-transform",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            item.hasPersistentHover &&
              "shadow-[0_2px_12px_rgba(99,102,241,0.06)] -translate-y-0.5"
          )}
        >
          {/* Dot-grid overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            {/* Icon + status row */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 group-hover:bg-white/[0.15] transition-all duration-300">
                {item.icon}
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/10 text-gray-300 transition-colors duration-300 group-hover:bg-white/[0.18]">
                {item.status ?? "Active"}
              </span>
            </div>

            {/* Title + description */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-gray-100 tracking-tight text-[14px]">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Tags + CTA row */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-wrap gap-1.5">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[11px] text-gray-400 transition-all duration-200 hover:bg-white/[0.14]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.cta ?? "Explore →"}
              </span>
            </div>
          </div>

          {/* Gradient border glow */}
          <div
            className={cn(
              "absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent via-indigo-500/10 to-transparent transition-opacity duration-300",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
