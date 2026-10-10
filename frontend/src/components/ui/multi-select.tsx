"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value?: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = "Chọn đối tượng...",
  searchPlaceholder = "Tìm kiếm đối tượng...",
  emptyMessage = "Không tìm thấy kết quả",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeTag = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div className={cn("relative", className || "")} ref={containerRef}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((s) => !s);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="flex flex-1 flex-wrap gap-1.5 items-center">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((v) => {
              const opt = options.find((o) => o.value === v);
              return (
                <Badge
                  key={v}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
                >
                  <span className="whitespace-nowrap">{opt?.label ?? v}</span>
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(v);
                    }}
                  />
                </Badge>
              );
            })
          )}
        </div>
        <div className="ml-auto opacity-50 shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 mt-1 w-full z-[9999] bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 border rounded-md bg-background">
              <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full py-1.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt) => {
                const isChecked = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer hover:bg-accent text-sm transition-colors select-none"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggle(opt.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1 font-normal">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
