import { useQuery } from "@tanstack/react-query";
import { fetchCommunes } from "@/lib/sooqy";
import { cn } from "@/lib/utils";

export const communesQuery = (wilayaId: number | null) => ({
  queryKey: ["communes", wilayaId],
  queryFn: () => fetchCommunes(wilayaId),
  enabled: wilayaId != null,
  staleTime: 5 * 60 * 1000,
});

export function CommuneSelect({
  value,
  onChange,
  wilayaId,
  allLabel = "كل البلديات",
  className,
  required,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  wilayaId: number | null;
  allLabel?: string | null;
  className?: string;
  required?: boolean;
}) {
  const { data = [] } = useQuery(communesQuery(wilayaId));
  return (
    <select
      value={value ?? ""}
      required={required}
      aria-label="اختيار البلدية"
      disabled={!wilayaId}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 focus:border-primary focus:ring-2 focus:ring-primary/10",
        className,
      )}
    >
      {allLabel !== null ? (
        <option value="">{allLabel}</option>
      ) : (
        <option value="" disabled>
          اختر البلدية
        </option>
      )}
      {data.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
