export const ICP_DIMENSIONS = [
  { key: "sector_fit", column: "icp_sector_fit", max: 25 },
  { key: "consumption", column: "icp_consumption", max: 20 },
  { key: "frequency", column: "icp_frequency", max: 15 },
  { key: "profitability", column: "icp_profitability", max: 20 },
  { key: "strategic", column: "icp_strategic", max: 10 },
  { key: "accessibility", column: "icp_accessibility", max: 10 },
] as const;

export type IcpDimensionKey = (typeof ICP_DIMENSIONS)[number]["key"];

export type IcpScores = Record<(typeof ICP_DIMENSIONS)[number]["column"], number>;

export function computeIcpTotal(s: Partial<IcpScores>): number {
  return ICP_DIMENSIONS.reduce((sum, d) => sum + (Number(s[d.column]) || 0), 0);
}

export type IcpTier = "A" | "B" | "C" | "low";

export function tierFromScore(score: number): IcpTier {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 50) return "C";
  return "low";
}

export function tierColor(tier: IcpTier): string {
  switch (tier) {
    case "A": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "B": return "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30";
    case "C": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
