export type NativeRegistrationIntent = "customer" | "merchant" | "delivery";

export type NativeAuthCallback = {
  code: string;
  reset: boolean;
  intent?: NativeRegistrationIntent;
  redirect?: string;
};

function safeRelativePath(value: string | null): string | undefined {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.includes("\\")
  ) {
    return undefined;
  }
  return value;
}

/**
 * Accept only the app's registered auth callback URL.
 * Never navigate to arbitrary URLs supplied by an external deep link.
 */
export function parseNativeAuthCallback(rawUrl: string): NativeAuthCallback | null {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "com.arownd.app:" ||
      url.hostname !== "auth" ||
      url.pathname !== "/callback"
    ) {
      return null;
    }

    const code = url.searchParams.get("code");
    if (!code || code.length > 2048) return null;

    const rawIntent = url.searchParams.get("intent");
    const intent: NativeRegistrationIntent | undefined =
      rawIntent === "customer" || rawIntent === "merchant" || rawIntent === "delivery"
        ? rawIntent
        : undefined;

    return {
      code,
      reset: ["1", "true"].includes(url.searchParams.get("reset") ?? ""),
      intent,
      redirect: safeRelativePath(url.searchParams.get("redirect")),
    };
  } catch {
    return null;
  }
}
