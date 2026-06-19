"use client";
import { useState, useMemo, useEffect } from "react";

export interface PickerOption {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeColor?: "default" | "destructive" | "accent" | "primary";
}

interface Props {
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function PickerModal({
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  searchPlaceholder = "Поиск...",
  emptyText = "Ничего не найдено",
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.subtitle?.toLowerCase().includes(query)
    );
  }, [options, search]);
  
  const badgeColors = {
    default: "bg-muted text-muted-foreground",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-accent/10 text-accent",
    primary: "bg-primary/10 text-primary",
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-card w-full max-w-md max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl">
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Поиск (если опций больше 3) */}
        {options.length > 3 && (
          <div className="px-4 py-2 border-b border-border shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        )}
        
        {/* Список */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredOptions.length > 0 ? (
            <div className="p-2">
              {filteredOptions.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelect(opt.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-secondary/50 active:scale-[0.99] border border-transparent"
                    }`}
                  >
                    {opt.icon && (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0">
                        {opt.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isSelected ? "text-primary" : ""}`}>
                        {opt.label}
                      </p>
                      {opt.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {opt.subtitle}
                        </p>
                      )}
                    </div>
                    {opt.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeColors[opt.badgeColor || "default"]}`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {emptyText}
            </div>
          )}
        </div>
        
        {/* Нижняя кнопка отмены */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}