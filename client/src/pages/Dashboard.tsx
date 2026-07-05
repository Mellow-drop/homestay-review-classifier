import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, Users, Award, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Review {
  id: number;
  sentiment: "positive" | "neutral" | "negative";
  theme: string;
}

const SENTIMENT_COLORS = {
  positive: "#10b981", // emerald-500
  neutral: "#64748b",  // slate-500
  negative: "#f43f5e", // rose-500
};

export default function Dashboard() {
  const { data: reviews, isLoading, isError } = useQuery<Review[]>({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const response = await axios.get("/api/reviews/search");
      return response.data;
    }
  });

  // Calculate Metrics
  const totalReviews = reviews?.length || 0;
  
  const positiveCount = reviews?.filter(r => r.sentiment === "positive").length || 0;
  const positiveRatio = totalReviews > 0 ? ((positiveCount / totalReviews) * 100).toFixed(1) : "0.0";

  // Calculate Themes
  const themeCounts = reviews?.reduce((acc, curr) => {
    acc[curr.theme] = (acc[curr.theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
  const topThemeName = topTheme ? topTheme[0].charAt(0).toUpperCase() + topTheme[0].slice(1) : "None";

  // Chart Data Preparation
  const sentimentData = [
    { name: "Positive", value: positiveCount, color: SENTIMENT_COLORS.positive },
    { name: "Neutral", value: reviews?.filter(r => r.sentiment === "neutral").length || 0, color: SENTIMENT_COLORS.neutral },
    { name: "Negative", value: reviews?.filter(r => r.sentiment === "negative").length || 0, color: SENTIMENT_COLORS.negative }
  ].filter(d => d.value > 0);

  const themeData = Object.entries(themeCounts)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Total Reviews Classified", value: totalReviews.toLocaleString(), change: "All time data", icon: <Users className="h-5 w-5 text-blue-500" /> },
    { label: "Positive Sentiment Ratio", value: `${positiveRatio}%`, change: "Across all sessions", icon: <TrendingUp className="h-5 w-5 text-emerald-500" /> },
    { label: "Most Discussed Theme", value: topThemeName, change: topTheme ? `${topTheme[1]} mentions` : "No data", icon: <Award className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Live sentiment metrics and theme distributions for Trishul Eco-Homestays.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Spinner className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500">Loading live analytics...</p>
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load analytics data from the database.</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid gap-6 sm:grid-cols-3">
                {stats.map((stat, i) => (
                  <div key={i} className="glass-card border rounded-2xl p-6 relative overflow-hidden shadow-sm">
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
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {stat.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sentiment Pie Chart */}
                <div className="rounded-3xl glass-card p-6 border shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Sentiment Breakdown</h3>
                  {sentimentData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>

                {/* Theme Bar Chart */}
                <div className="rounded-3xl glass-card p-6 border shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Theme Frequency</h3>
                  {themeData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={themeData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
