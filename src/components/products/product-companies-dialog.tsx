import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useProductCompanies } from "@/hooks/use-company-products";

export function ProductCompaniesDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: {
  productId: string | null;
  productName?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const { data: rows = [] } = useProductCompanies(open ? productId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("products.companiesUsing")}
            {productName ? ` — ${productName}` : ""}
          </DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <EmptyState icon={Building2} title={t("common.empty")} compact />
        ) : (
          <div className="divide-y rounded-md border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3">
                <Link
                  to="/companies/$id"
                  params={{ id: r.company?.id ?? "" }}
                  onClick={() => onOpenChange(false)}
                  className="font-medium hover:underline"
                >
                  {r.company?.name ?? "—"}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {r.company?.sector ? (ar ? r.company.sector.name_ar : r.company.sector.name_en) : "—"}
                  </span>
                  {r.company?.type && (
                    <Badge variant={r.company.type === "customer" ? "default" : "secondary"}>
                      {t(`companies.types.${r.company.type}`)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
