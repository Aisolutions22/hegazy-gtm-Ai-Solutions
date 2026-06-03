import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/_authenticated/analytics")({ component: () => { const { t } = useTranslation(); return <ComingSoon title={t("nav.analytics")} />; } });
