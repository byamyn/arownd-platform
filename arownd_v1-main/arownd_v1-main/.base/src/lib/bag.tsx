import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BagItem } from "./sooqy";
import { useTranslation } from "./i18n";

type BagCtx = {
  items: BagItem[];
  count: number;
  add: (item: BagItem) => void;
  setQty: (offerId: string, qty: number) => void;
  remove: (offerId: string) => void;
  clear: () => void;
};

const Ctx = createContext<BagCtx | null>(null);
const KEY = "sooqy:bag";
/** حدث داخل النافذة: يُبَث عند تغيّر السلة من تبويب آخر. */
const SYNC_EVENT = "sooqy:bag-sync";

function readStorage(): BagItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as BagItem[];
  } catch {
    // تخزين تالف أو غير متاح (وضع خاص) — نبدأ بسلة فارغة بدل إسقاط التطبيق.
    return [];
  }
}

export function BagProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<BagItem[]>([]);
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    setItems(readStorage());
  }, []);

  // مزامنة بين التبويبات: تعديل في تبويب يظهر في الآخر فورًا.
  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<BagItem[] | undefined>).detail;
      setItems(detail ? detail : readStorage());
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onSync);
    };
  }, []);

  const persist = useCallback((next: BagItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setStorageFailed(false);
    } catch {
      // الحصة ممتلئة أو التخزين معطّل — نُبقي السلة في الذاكرة بدل إسقاط التطبيق.
      setStorageFailed(true);
    }
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: next }));
    } catch {
      /* تجاهل — المزامنة تحسين وليس شرطًا */
    }
  }, []);

  const value = useMemo<BagCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      add: (item) => {
        const existing = items.find((i) => i.offerId === item.offerId);
        persist(
          existing
            ? items.map((i) =>
                i.offerId === item.offerId
                  ? {
                      ...i,
                      quantity: Math.min(10, i.quantity + item.quantity),
                      options: item.options,
                      // نُحدّث لقطة السعر بأحدث قيمة معروفة.
                      price: item.price ?? i.price,
                      name: item.name ?? i.name,
                      productId: item.productId ?? i.productId,
                    }
                  : i,
              )
            : [...items, item],
        );
      },
      setQty: (offerId, qty) =>
        persist(
          items.map((i) =>
            i.offerId === offerId ? { ...i, quantity: Math.max(1, Math.min(10, qty)) } : i,
          ),
        ),
      remove: (offerId) => persist(items.filter((i) => i.offerId !== offerId)),
      clear: () => persist([]),
    }),
    [items, persist],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {storageFailed && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-24 z-50 mx-auto w-full max-w-2xl px-4"
        >
          <p className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-center text-xs font-semibold text-danger">
            {t("error_bag_storage_failed")}
          </p>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useBag() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBag outside BagProvider");
  return v;
}
