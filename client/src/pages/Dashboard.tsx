import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BarChart3, TrendingUp, Users, Percent } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Total Reviews Classified", value: "1,248", change: "+12% this week", icon: <Users className="h-5 w-5 text-blue-500" /> },
    { label: "Positive Sentiment Ratio", value: "84.2%", change: "+2.4% vs last month", icon: <TrendingUp className="h-5 w-5 text-emerald-500" /> },
    { label: "Model Success Rate", value: "98.9%", change: "Local fallback active", icon: <Percent className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Monitor homestay review sentiments, classification run statistics, and response health.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-900 dark:bg-slate-800" />
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-450 dark:text-slate-500">
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Placeholder Panel */}
          <div className="rounded-3xl glass-card p-8 md:p-12 border shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200/60 shadow-sm animate-pulse">
              <BarChart3 className="h-7 w-7 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sentiment Trends</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              This panel is a placeholder for interactive chart elements (e.g., Recharts) displaying sentiment frequency distributions and theme patterns over time. Real data will load here once the historical log integration goes live.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
