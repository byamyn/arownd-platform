import { Capacitor } from "@capacitor/core";
import { PushNotifications, type ActionPerformed } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PushResult = "unsupported" | "denied" | "requested";

let listenersReady = false;
let registeredDeviceToken: string | null = null;

type Rpc = (name: string, args?: Record<string, string>) => Promise<{ error: Error | null }>;

function callRpc(name: string, args?: Record<string, string>) {
  return (supabase.rpc.bind(supabase) as unknown as Rpc)(name, args);
}

function openNotificationTarget(action: ActionPerformed) {
  const data = action.notification.data as Record<string, unknown> | undefined;
  const orderId = typeof data?.["order_id"] === "string" ? data["order_id"] : null;
  const reservationId =
    typeof data?.["reservation_id"] === "string" ? data["reservation_id"] : null;

  if (orderId) {
    window.location.assign(`/orders/${encodeURIComponent(orderId)}`);
  } else if (reservationId) {
    window.location.assign("/orders");
  } else {
    window.location.assign("/notifications");
  }
}

async function installListeners() {
  if (listenersReady) return;
  listenersReady = true;

  await PushNotifications.addListener("registration", async ({ value }) => {
    registeredDeviceToken = value;
    const platform = Capacitor.getPlatform();
    if (platform !== "android" && platform !== "ios") return;
    const { error } = await callRpc("register_my_push_device", {
      _token: value,
      _platform: platform,
    });
    if (error) {
      console.error("[push] token registration failed", error);
      toast.error("تعذّر ربط إشعارات هذا الجهاز بحسابك.");
    } else {
      toast.success("تم تفعيل إشعارات Arownd على هذا الجهاز.");
    }
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("[push] native registration failed", error);
    toast.error("تعذّر تسجيل الجهاز لاستقبال الإشعارات.");
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    toast.info(notification.title || "Arownd", {
      description: notification.body || "لديك إشعار جديد.",
    });
    window.dispatchEvent(new Event("arownd:push-received"));
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", openNotificationTarget);
}

/** Ask only after the user explicitly enables push from the notifications screen. */
export async function enableNativePush(): Promise<PushResult> {
  if (!Capacitor.isNativePlatform()) return "unsupported";

  await installListeners();
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return "denied";

  if (Capacitor.getPlatform() === "android") {
    await PushNotifications.createChannel({
      id: "arownd_updates",
      name: "تحديثات Arownd",
      description: "تحديثات الطلبات والحجوزات وإشعارات الحساب",
      importance: 4,
      vibration: true,
    });
  }

  await PushNotifications.register();
  return "requested";
}

/** Remove server-side device associations before the user signs out. */
export async function unregisterMyPushDevices(): Promise<void> {
  if (!registeredDeviceToken) return;
  const { error } = await callRpc("unregister_my_push_device", {
    _token: registeredDeviceToken,
  });
  if (error) throw error;
  registeredDeviceToken = null;
}
