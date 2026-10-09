// src/components/ui/role-multi-select.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RoleOption {
  value: string;
  label: string;
}

interface RoleMultiSelectProps {
  value?: string[]; // mảng role đang chọn
  onChange: (v: string[]) => void;
  options: RoleOption[]; // ✅ truyền từ ngoài vào
  placeholder?: string;
  className?: string;
}

export function RoleMultiSelect({
  value = [],
  onChange,
  options,
  placeholder = "Select roles",
  className,
}: RoleMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Đóng dropdown khi click ra ngoài
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
        className="min-h-[44px] w-full rounded-md border px-3 py-2 flex items-center gap-2 cursor-text focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="flex flex-1 flex-wrap gap-2">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((v) => {
              const opt = options.find((o) => o.value === v);
              return (
                <Badge
                  key={v}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <span className="whitespace-nowrap">{opt?.label ?? v}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
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
        <div className="ml-auto opacity-50">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="transform"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 mt-2 w-full z-50 bg-popover border rounded-md shadow-lg overflow-hidden">
          {/* Search */}
          <div className="px-2 py-2 border-b">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4 opacity-60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role..."
                className="w-full bg-transparent outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No roles
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt.value);
                  }}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/50"
                >
                  <div className="text-sm">{opt.label}</div>
                  {value.includes(opt.value) && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
