import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="font-semibold">{t("common.comingSoon")}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t("common.comingSoonDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
