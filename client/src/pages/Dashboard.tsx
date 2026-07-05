import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, Users, Award, AlertCircle, MessageSquare, Clock } from "lucide-react";
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
  originalReview: string;
  createdAt: string;
}

const SENTIMENT_COLORS = {
  positive: "#10b981", // emerald-500
  neutral: "#64748b",  // slate-500
  negative: "#f43f5e", // rose-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{label || payload[0].name}</p>
        <p className="text-sm font-medium" style={{ color: payload[0].payload.color || payload[0].fill }}>
          {payload[0].value} {payload[0].value === 1 ? 'mention' : 'mentions'}
        </p>
      </div>
    );
  }
  return null;
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
                          <Tooltip content={<CustomTooltip />} />
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
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8 rounded-3xl glass-card p-6 border shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-slate-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Classifications</h3>
                </div>
                
                <div className="space-y-4">
                  {reviews?.slice(0, 5).map((review) => (
                    <div key={review.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                      <div className="flex items-start gap-3 overflow-hidden">
                        <MessageSquare className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="truncate pr-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            "{review.originalReview}"
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(review.createdAt).toLocaleDateString()} at {new Date(review.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-0 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          review.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          review.sentiment === 'negative' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                          {review.theme.charAt(0).toUpperCase() + review.theme.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!reviews || reviews.length === 0) && (
                    <div className="text-center py-6 text-sm text-slate-500">No recent activity found.</div>
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
