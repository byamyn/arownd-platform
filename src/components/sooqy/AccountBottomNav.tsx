import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/sooqy/BottomNav";
import { StudioNav } from "@/components/sooqy/StudioNav";
import { useAuth } from "@/lib/auth";
import { fetchMyAccountType } from "@/lib/sooqy";

export function AccountBottomNav({ pathname }: { pathname: string }) {
  const { user, ready } = useAuth();
  const accountType = useQuery({
    queryKey: ["my-account-type", user?.id],
    queryFn: fetchMyAccountType,
    enabled: ready && !!user,
  });
  const isMerchantArea =
    pathname === "/" ||
    pathname === "/explore" ||
    pathname === "/latest" ||
    pathname.startsWith("/stores/");

  if (!ready) return null;
  if (!user) return <BottomNav />;
  if (accountType.isLoading || accountType.isError || !accountType.isSuccess) return null;
  if (accountType.data === "merchant") {
    return isMerchantArea ? <StudioNav /> : null;
  }
  // أبقِ سلوك تنقل شركات التوصيل كما هو؛ لا يشمله تحديث تنقل الحسابات الشخصية والتجارية.
  if (accountType.data === "personal" || accountType.data === "delivery_company") {
    return <BottomNav />;
  }
  return null;
}
