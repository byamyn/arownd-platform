import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/components/sooqy/MapPage";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "الخريطة — Arownd" },
      { name: "description", content: "اكتشف المتاجر القريبة منك على خريطة Arownd التفاعلية." },
    ],
  }),
  component: MapPage,
});
