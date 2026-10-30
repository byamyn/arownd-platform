import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchWilayas } from "@/lib/sooqy";
import { cn } from "@/lib/utils";

export const wilayasQuery = { queryKey: ["wilayas"], queryFn: fetchWilayas, staleTime: Infinity };

/** زر اختيار الولاية — تصميم جديد فاخر */
export function WilayaButton({
  value, onChange, className, allLabel = "كل الولايات",
}: {
  value: number | null; onChange: (v: number | null) => void;
  className?: string; allLabel?: string;
}) {
  const { data = [] } = useQuery(wilayasQuery);
  const current = data.find(w => w.id === value);
  const label = value == null ? allLabel : (current?.name_ar ?? String(value).padStart(2,"0"));
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handleMouseDown); };
  }, [isOpen]);

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as Node;
    if (buttonRef.current && !buttonRef.current.contains(target) && dropdownRef.current && !dropdownRef.current.contains(target)) {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    if (isOpen && listRef.current) {
      const selected = listRef.current.querySelector("[data-selected]");
      if (selected) selected.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    let left = Math.max(0, Math.min(rect.left, vw - 288 - 16));
    setDropdownStyle({ position: "absolute", top: "100%", marginTop: 6, left, zIndex: 50 });
  }, [isOpen]);

  const handleSelect = (wilayaId: number | null) => {
    onChange(wilayaId);
    setIsOpen(false);
  };

  const button = (
    <div
      ref={buttonRef}
      className={cn(
        "relative inline-flex h-10 w-auto items-center rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 active:bg-neutral-200 focus-within:ring-2 focus-within:ring-primary/30",
        className,
      )}
    >
      <span className="flex items-center gap-2 ps-6">
        <MapPin className="size-4 shrink-0 text-accent-ink" />
        <span className="max-w-[5rem] truncate">{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </span>
      <button
        type="button"
        aria-label="اختيار الولاية"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute inset-0 h-full w-full cursor-pointer"
      />
    </div>
  );

  if (!isOpen) return button;

  const dropdown = (
    <ul
      ref={(el) => {
        listRef.current = el;
        dropdownRef.current = el;
      }}
      role="listbox"
      aria-label="قائمة الولايات"
      style={dropdownStyle}
      className="min-w-[18rem] max-h-60 overflow-auto rounded-xl border border-border bg-card text-sm shadow-lg animate-fade-up"
      onMouseDown={(e) => e.stopPropagation()} // Prevent click-outside from closing when clicking inside dropdown
    >
      <li
        role="option"
        aria-selected={value == null}
        data-selected={value == null}
        onMouseDown={() => handleSelect(null)} // Use onMouseDown to fire before document mousedown
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 transition cursor-pointer",
          value == null ? "bg-primary-soft text-accent-ink font-semibold" : "hover:bg-neutral-100",
        )}
      >
        {value == null && <Check className="size-4 shrink-0 text-accent-ink" />}
        <span>{allLabel}</span>
      </li>
      {data.map((w) => (
        <li
          key={w.id}
          role="option"
          aria-selected={value === w.id}
          data-selected={value === w.id}
          onMouseDown={() => handleSelect(w.id)} // Use onMouseDown to fire before document mousedown
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 transition cursor-pointer",
            value === w.id ? "bg-primary-soft text-accent-ink font-semibold" : "hover:bg-neutral-100",
          )}
        >
          {value === w.id && <Check className="size-4 shrink-0 text-accent-ink" />}
          <span className="text-muted-foreground w-6 text-center">{String(w.id).padStart(2, "0")}</span>
          <span>{w.name_ar}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {button}
      {dropdown}
    </>
  );
}

export function WilayaSelect({ value, onChange, allLabel = "كل الولايات", className, required }: {
  value: number | null; onChange: (v: number | null) => void;
  allLabel?: string | null; className?: string; required?: boolean;
}) {
  const { data = [] } = useQuery(wilayasQuery);
  return (
    <select value={value ?? ""} required={required} aria-label="اختيار الولاية"
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      className={cn("h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-all appearance-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10", className)}>
      {allLabel !== null ? <option value="">{allLabel}</option> : <option value="" disabled>اختر الولاية</option>}
      {data.map(w => <option key={w.id} value={w.id}>{String(w.id).padStart(2,"0")} - {w.name_ar}</option>)}
    </select>
  );
}