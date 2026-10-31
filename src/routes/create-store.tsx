import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  becomeMerchant,
  fetchMyStore,
  merchantCreateStore,
} from "@/lib/sooqy";
import { PageHeader } from "@/components/sooqy/page-header";
import { ErrorState } from "@/components/sooqy/error-state";
import { MerchantOnboarding, type StoreForm, defaultStoreForm } from "@/components/sooqy/merchant-onboarding";

export const Route = createFileRoute("/create-store")({
  head: () => ({ meta: [{ title: "أنشئ متجرك — Arownd" }] }),
  component: CreateStorePage,
});

function CreateStorePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<StoreForm>(defaultStoreForm());
  // من لديه متجر بالفعل لا يُنشئ آخر بالخطأ — نوجّهه إلى الاستوديو
  const myStore = useQuery({ queryKey: ["my-store"], queryFn: fetchMyStore, enabled: !!user });
  useEffect(() => {
    if (myStore.data) void navigate({ to: "/studio", replace: true });
  }, [myStore.data, navigate]);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
        <PageHeader title="أصبح تاجر" back="/settings" />
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-body text-muted-foreground">يرجى تسجيل الدخول لإنشاء متجر</p>
          <Link to="/auth" search={{ redirect: "/create-store" }} className="btn-primary mt-4 w-full">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  if (myStore.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="جارٍ التحقق من المتجر">
        <span className="size-8 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
      </div>
    );
  }

  if (myStore.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-6">
        <PageHeader title="أصبح تاجر" back="/settings" />
        <ErrorState
          scope="create-store:existing-store"
          error={myStore.error}
          onRetry={() => myStore.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="أصبح تاجر" subtitle="أنشئ متجرك على Arownd" back="/settings" />
      <MerchantOnboarding
        onSubmit={async (input) => {
          await becomeMerchant();
          await merchantCreateStore(input);
          await qc.invalidateQueries({ queryKey: ["my-store"] });
          await qc.invalidateQueries({ queryKey: ["my-roles"] });
          navigate({ to: "/studio" });
        }}
        form={form}
        setForm={setForm}
      />
    </div>
  );
}
