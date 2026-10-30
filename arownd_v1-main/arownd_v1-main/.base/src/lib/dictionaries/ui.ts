import type { DictGroup } from "./types";

/** المكوّنات المشتركة — تظهر في كل الشاشات */
export const ui: DictGroup = {
  ar: {
    aria_main_nav: "التنقل الرئيسي",
    aria_back: "رجوع",
    aria_switch_lang: "تغيير اللغة إلى الإنجليزية",
    aria_switch_lang_en: "Change language to Arabic",
    aria_close: "إغلاق",
    aria_clear_search: "مسح البحث",
    aria_decrease_qty: "إنقاص الكمية",
    aria_increase_qty: "زيادة الكمية",
    aria_favorite_add: "إضافة إلى المفضلة",
    aria_favorite_remove: "إزالة من المفضلة",
    aria_prev: "السابق",
    aria_next: "التالي",
    aria_category_breadcrumb: "مسار التصنيف",

    action_retry: "إعادة المحاولة",
    action_retrying: "جارٍ المحاولة…",
    action_see_all: "عرض الكل",
    action_confirm: "تأكيد",
    action_cancel: "إلغاء",
    action_busy: "جارٍ التنفيذ...",
    action_soon: "قريبًا",
    action_coming_soon_toast: "هذه الميزة ستتاح قريبًا",

    view_products: "المنتجات",
    view_stores: "المتاجر",
    view_map: "الخريطة",

    search_placeholder: "ابحث عن سلعة أو متجر…",

    stock_out: "نفد من المخزون",
    multiple_stores: "متاجر متعددة",

    offline_banner: "لا يوجد اتصال بالإنترنت — ستتم التحديث تلقائيًا بعد عودة الشبكة",
    directions_aria: "الاتجاهات إلى المتجر",

    breadcrumb_home: "الرئيسية",
    category_all: "الكل",

    pickup_within: "الاستلام خلال",
    order_on_way: "طلبك في الطريق 🚚",
    order_confirmed: "طلبك مؤكد ✅",
    track_now: "تتبّع الآن",
    bag_items_count: "{count} سلعة في سلة التسوق — أكمل الطلب",

    // PWA
    pwa_update_ready: "يتوفر تحديث جديد للتطبيق",
    pwa_update_now: "تحديث",
    pwa_install_hint: "ثبّت SOOQY على جهازك للوصول السريع",
    pwa_install_cta: "تثبيت",

    // الأخطاء
    error_unexpected_title: "حدث خطأ غير متوقع",
    error_unexpected_hint: "أعد فتح التطبيق. إذا تكررت المشكلة، أرسل لنا التفاصيل من سجل التشخيص.",
    error_bag_storage_failed: "تعذّر حفظ السلة على هذا الجهاز. سلتك محفوظة في الذاكرة فقط وقد تضيع عند إعادة التحميل.",
  },
  en: {
    aria_main_nav: "Main navigation",
    aria_back: "Back",
    aria_switch_lang: "تغيير اللغة إلى الإنجليزية",
    aria_switch_lang_en: "Change language to Arabic",
    aria_close: "Close",
    aria_clear_search: "Clear search",
    aria_decrease_qty: "Decrease quantity",
    aria_increase_qty: "Increase quantity",
    aria_favorite_add: "Add to favorites",
    aria_favorite_remove: "Remove from favorites",
    aria_prev: "Previous",
    aria_next: "Next",
    aria_category_breadcrumb: "Category breadcrumb",

    action_retry: "Retry",
    action_retrying: "Retrying…",
    action_see_all: "See all",
    action_confirm: "Confirm",
    action_cancel: "Cancel",
    action_busy: "Working…",
    action_soon: "Soon",
    action_coming_soon_toast: "This feature is coming soon",

    view_products: "Products",
    view_stores: "Stores",
    view_map: "Map",

    search_placeholder: "Search for a product or store…",

    stock_out: "Out of stock",
    multiple_stores: "Multiple stores",

    offline_banner: "No internet connection — updates will resume automatically",
    directions_aria: "Directions to the store",

    breadcrumb_home: "Home",
    category_all: "All",

    pickup_within: "Pickup within",
    order_on_way: "Your order is on the way 🚚",
    order_confirmed: "Your order is confirmed ✅",
    track_now: "Track now",
    bag_items_count: "{count} items in your bag — complete the order",

    pwa_update_ready: "A new app update is available",
    pwa_update_now: "Update",
    pwa_install_hint: "Install SOOQY on your device for quick access",
    pwa_install_cta: "Install",

    error_unexpected_title: "An unexpected error occurred",
    error_unexpected_hint: "Reopen the app. If the problem persists, send us the details from the diagnostic log.",
    error_bag_storage_failed: "Could not save your bag on this device. It is kept in memory only and may be lost on reload.",
  },
};
