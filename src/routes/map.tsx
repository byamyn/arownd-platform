import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/components/sooqy/MapPage";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "الخريطة — Arownd" },
      { name: "description", content: "خريطة تفاعلية للمحلات القريبة منك في الجزائر." },
    ],
  }),
  component: MapPage,
});
