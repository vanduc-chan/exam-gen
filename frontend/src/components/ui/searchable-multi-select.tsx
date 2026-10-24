"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search as SearchIcon, X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface SearchableMultiOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableMultiSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  options: SearchableMultiOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableMultiSelect({
  values = [],
  onChange,
  options,
  placeholder = "Chọn nhiều...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả",
  className,
  disabled = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const matchLabel = o.label.toLowerCase().includes(q);
    const matchSubLabel = o.subLabel ? o.subLabel.toLowerCase().includes(q) : false;
    return matchLabel || matchSubLabel;
  });

  const selectedSet = new Set(values);

  const toggleOption = (val: string) => {
    if (selectedSet.has(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredVals = filtered.map((o) => o.value);
    const combined = Array.from(new Set([...values, ...filteredVals]));
    onChange(combined);
  };

  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filtered.map((o) => o.value));
    onChange(values.filter((v) => !filteredSet.has(v)));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedOptions = options.filter((o) => selectedSet.has(o.value));

  return (
    <div className={cn("relative w-full", className || "")} ref={containerRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "min-h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
          disabled && "opacity-50 cursor-not-allowed bg-muted"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : selectedOptions.length <= 2 ? (
            selectedOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="text-xs font-normal bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
              >
                <span>{opt.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="hover:text-destructive cursor-pointer ml-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.value);
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-xs font-medium bg-primary/15 text-primary border-primary/30"
              >
                Đã chọn {selectedOptions.length} đối tượng
              </Badge>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                ({selectedOptions.map((o) => o.label).join(", ")})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors mr-1"
              title="Xóa tất cả lựa chọn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "transform rotate-180"
            )}
          />
        </div>
      </div>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute left-0 mt-1 w-full z-[9999] bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Search bar & Quick actions */}
          <div className="p-2 border-b bg-muted/20 space-y-2">
            <div className="flex items-center gap-2 px-2.5 py-1 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
              <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
              <span>{filtered.length} đối tượng</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-primary hover:underline font-medium"
                >
                  Chọn tất cả
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selectedSet.has(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors select-none",
                      isSelected
                        ? "bg-accent/70 text-accent-foreground font-medium"
                        : "hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Controlled via parent row click
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0 pointer-events-none"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-xs text-muted-foreground truncate">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
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
