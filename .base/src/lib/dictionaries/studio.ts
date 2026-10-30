import type { DictGroup } from "./types";

/** لوحة التاجر — `studio` */
export const studio: DictGroup = {
  ar: {
    // حالات الطلب
    status_pending: "قيد الانتظار",
    status_confirmed: "مؤكد",
    status_shipped: "في الطريق",
    status_delivered: "تم التسليم",
    status_cancelled: "ملغي",
    status_rejected: "مرفوض",
    status_unknown: "غير معروف",

    // إجراءات الطلب
    studio_action_confirm: "تأكيد",
    studio_action_ship: "شحن",
    studio_action_deliver: "تسليم",
    studio_action_cancel: "إلغاء",
    studio_delivery_home: "توصيل للمنزل",
    studio_delivery_store: "استلام من المتجر",
    studio_status_update_failed: "تعذّر تحديث حالة الطلب.",
    studio_needs_action: "يحتاج إجراء",
    studio_no_pending_orders: "لا توجد طلبات تحتاج إجراء.",
  },
  en: {
    status_pending: "Pending",
    status_confirmed: "Confirmed",
    status_shipped: "On the way",
    status_delivered: "Delivered",
    status_cancelled: "Cancelled",
    status_rejected: "Rejected",
    status_unknown: "Unknown",

    studio_action_confirm: "Confirm",
    studio_action_ship: "Ship",
    studio_action_deliver: "Deliver",
    studio_action_cancel: "Cancel",
    studio_delivery_home: "Home delivery",
    studio_delivery_store: "Store pickup",
    studio_status_update_failed: "Could not update the order status.",
    studio_needs_action: "Needs action",
    studio_no_pending_orders: "No orders need action.",
  },
};
