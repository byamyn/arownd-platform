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
  if (accountType.isLoading) return null;
  if (accountType.data === "merchant") {
    return isMerchantArea ? <StudioNav /> : null;
  }
  return <BottomNav />;
}
