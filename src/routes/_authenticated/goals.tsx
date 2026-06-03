import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar, CartesianGrid, Cell, Legend, Line, ComposedChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

const revData = [
  { name: "اليوم 15", revenue: 6, profit: 1 },
  { name: "اليوم 30", revenue: 9, profit: 1.6 },
  { name: "اليوم 45", revenue: 12, profit: 2.2 },
  { name: "اليوم 60", revenue: 14, profit: 2.7 },
  { name: "اليوم 75", revenue: 17, profit: 3.2 },
  { name: "اليوم 90", revenue: 20, profit: 3.8 },
];
const icpData = [
  { name: "الواجهات الذكية", value: 35, color: "#0284c7" },
  { name: "EV Enclosures", value: 25, color: "#38bdf8" },
  { name: "الطاقة الشمسية", value: 20, color: "#16a34a" },
  { name: "التصدير", value: 20, color: "#f59e0b" },
];

function GoalsPage() {
  const [tab, setTab] = useState<"vision" | "roadmap" | "expansion" | "dashboard">("vision");
  const [phase, setPhase] = useState<"engine" | "risk">("engine");

  const tabs = [
    { id: "vision", label: "الرؤية" },
    { id: "roadmap", label: "مشروع 90 يوماً" },
    { id: "expansion", label: "استراتيجية التوسع" },
    { id: "dashboard", label: "لوحة القيادة" },
  ] as const;

  return (
    <div>
      <PageHeader title="الأهداف وخارطة الطريق" description="Hegazy GTM OS 2026 — الاستراتيجية التنفيذية" />

      <div className="flex gap-2 border-b mb-6 overflow-x-auto">
        {tabs.map((tt) => (
          <button
            key={tt.id}
            onClick={() => setTab(tt.id)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
              tab === tt.id ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tt.label}
          </button>
        ))}
      </div>

      {tab === "vision" && (
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">التحول التشغيلي لعام 2026</h2>
            <p className="text-muted-foreground">
              منصة موحدة تربط الاستراتيجية، المبيعات، الربحية، والتنفيذ. إجابات فورية للأسئلة الأربعة المحورية لتمكين الإدارة من اتخاذ قرارات دقيقة مدعومة بالبيانات.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📍", title: "أين نحن الآن؟", desc: "تتبع الإيرادات، الأرباح، والهوامش (YTD) فورياً." },
              { icon: "🎯", title: "ما أفضل الفرص؟", desc: "تحليل مسار المبيعات وتحديد أسرع الصفقات وأعلاها ربحية." },
              { icon: "⚠️", title: "ما أهم المخاطر؟", desc: "رصد تآكل الهوامش وتركز العملاء استباقياً." },
              { icon: "⚡", title: "ما الذي يجب فعله اليوم؟", desc: "توجيه الفريق نحو أهم المهام والفرص والمواعيد الحرجة." },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition">
                <div className="text-3xl mb-2">{c.icon}</div>
                <h3 className="font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "roadmap" && (
        <section className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">خريطة طريق 90 يوماً (GTM Implementation)</h2>
            <p className="text-muted-foreground text-sm mt-2">من مرحلة التأسيس إلى مرحلة الحصاد.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="text-xs text-primary font-bold mb-1">الخطوة الأولى (اليوم 1 - 15)</div>
              <h3 className="text-lg font-bold mb-3">تهيئة النظام وتحديد الـ ICP</h3>
              <ul className="space-y-2 text-sm list-disc pe-5">
                <li>توحيد قاعدة بيانات العملاء (Single Source of Truth).</li>
                <li>رسم مصفوفة الأرباح الحالية وتحديد نقطة الانطلاق (Baseline).</li>
                <li>إطلاق وتدريب الإدارة على Executive Dashboard.</li>
                <li className="font-bold text-foreground">المخرج: وضوح الرؤية وإعداد منصة العمل.</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="text-xs text-primary font-bold mb-1">الخطوة الأخيرة (اليوم 75 - 90)</div>
              <h3 className="text-lg font-bold mb-3">أتمتة القرار والتوسع الموجه</h3>
              <ul className="space-y-2 text-sm list-disc pe-5">
                <li>مراجعة الأداء مقابل Core KPIs المستهدفة.</li>
                <li>تفعيل Risk Center للتحذير المبكر من تآكل الأرباح.</li>
                <li>تسليم لوحات القيادة للـ Owner بصلاحيات المراقبة اللحظية.</li>
                <li className="font-bold text-foreground">المخرج: جهاز مبيعات يعمل بشكل منهجي.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-bold mb-4">الخطوات المرحلية في المشروع</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setPhase("engine")} className={`px-3 py-1.5 text-sm rounded-md ${phase === "engine" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                اليوم 16-45: محرك المبيعات
              </button>
              <button onClick={() => setPhase("risk")} className={`px-3 py-1.5 text-sm rounded-md ${phase === "risk" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                اليوم 46-74: مركز المخاطر والأهداف
              </button>
            </div>
            {phase === "engine" ? (
              <div>
                <h4 className="font-bold mb-2">تفعيل وحدات الفرص والمهام</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  تحويل استراتيجية النمو إلى مهام يومية. تفعيل Module 14: Calendar وربط كل ممثل مبيعات بأهداف الـ 90 يوماً. التركيز على تحسين معدل التحويل.
                </p>
                <div className="text-xs text-primary space-y-1">
                  <div>■ Module: Tasks & Opportunities</div>
                  <div>■ Target: Increase Conversion by 15%</div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-bold mb-2">تأمين الهوامش وإدارة المخاطر</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  تشغيل Module 16: Risk Center. تصنيف المخاطر (Low, Medium, High) لتركز العملاء أو الفرص المتعثرة. إعداد التنبيهات الذكية لمنع تسرب الإيرادات.
                </p>
                <div className="text-xs text-primary space-y-1">
                  <div>■ Module: Risk Center</div>
                  <div>■ Target: Zero Stalled Major Deals</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "expansion" && (
        <section className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">استراتيجية التوسع و ICPs خارج الصندوق</h2>
            <p className="text-muted-foreground text-sm mt-2">
              توجيه قدرات تصنيع وتوريد الألومنيوم نحو قطاعات غير تقليدية ذات هوامش ربح مرتفعة.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">↑</div>
                <div>
                  <h3 className="font-bold">التوسع الرأسي (Vertical)</h3>
                  <p className="text-xs text-muted-foreground">تعميق التغلغل في سلاسل القيمة.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border-s-2 border-primary ps-3">
                  <h4 className="font-bold text-sm">1. الواجهات المعمارية الذكية</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ICP: شركات التطوير العقاري والعمارة المستدامة. ألومنيوم معالج حرارياً لدعم العزل وتوفير الطاقة.
                  </p>
                </div>
                <div className="border-s-2 border-primary ps-3">
                  <h4 className="font-bold text-sm">2. هياكل المركبات الكهربائية</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ICP: مصانع تجميع السيارات والبطاريات. الألومنيوم عصب Lightweighting للـ EVs.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">↔</div>
                <div>
                  <h3 className="font-bold">التوسع الأفقي (Horizontal)</h3>
                  <p className="text-xs text-muted-foreground">فتح أسواق جغرافية وصناعية جديدة.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border-s-2 border-primary ps-3">
                  <h4 className="font-bold text-sm">1. قطاع الطاقة المتجددة</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ICP: مقاولات الطاقة الشمسية (EPCs). تصنيع هياكل تثبيت الألواح من الألومنيوم المقاوم للصدأ.
                  </p>
                </div>
                <div className="border-s-2 border-primary ps-3">
                  <h4 className="font-bold text-sm">2. التصدير لدول الإعمار والتنمية</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ICP: مقاولي البنية التحتية في شرق إفريقيا ودول الإعمار الإقليمية. كميات ضخمة بمعايير دولية.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "dashboard" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">محاكاة لوحة القيادة التنفيذية</h2>
              <p className="text-sm text-muted-foreground">السيناريو القياسي للنمو (Base Scenario).</p>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ● Live Data Sync: Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { k: "Total Revenue YTD", v: "EGP 45.2M", s: "↑ 12.5% vs Last Year", c: "text-green-600" },
              { k: "Average Margin %", v: "18.4%", s: "↑ 2.1% (Risk Control)", c: "text-green-600" },
              { k: "Total Tons Sold", v: "1,250 T", s: "On Track for 90-Day Goal", c: "text-primary" },
              { k: "Stalled Opportunities", v: "3", s: "Requires Executive Action", c: "text-amber-600" },
            ].map((kpi) => (
              <div key={kpi.k} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">{kpi.k}</div>
                <div className="text-2xl font-bold">{kpi.v}</div>
                <div className={`text-xs mt-2 ${kpi.c}`}>{kpi.s}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-bold mb-3">التوقعات المالية (90 Day Revenue vs Profit)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={revData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name="الإيرادات (M)" fill="#0284c7" />
                  <Line type="monotone" dataKey="profit" name="الأرباح (M)" stroke="#16a34a" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="font-bold mb-3">توزيع الفرص حسب الـ ICP</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={icpData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                      {icpData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="font-bold mb-3">أهم مهام اليوم</h3>
                <ul className="text-sm space-y-2">
                  <li>✓ مراجعة هامش ربح مشروع X</li>
                  <li>✓ توقيع عقد توريد طاقة شمسية</li>
                  <li>✓ متابعة فريق المبيعات (Daily Sync)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
