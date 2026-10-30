import React from "react";
import { Sentry } from "../utils/sentry";
import { useTranslation } from "@/lib/i18n";

export const AppErrorBoundary = Sentry.ErrorBoundary;

export const ErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#F8FAFC",
        fontFamily: "inherit",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          {t("error_unexpected_title")}
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>{t("error_unexpected_hint")}</p>
      </div>
    </div>
  );
};
