import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "./map";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "الخريطة — Arownd" },
      { name: "description", content: "اكتشف المتاجر القريبة منك على خريطة Arownd التفاعلية." },
    ],
  }),
  component: MapPage,
});
