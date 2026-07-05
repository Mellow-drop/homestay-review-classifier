import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, Users, Award, AlertCircle, MessageSquare, Clock, Cloud } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
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
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.payload.color || entry.fill }}>
            {entry.name}: {entry.value} {entry.name && !entry.name.includes(":") ? (entry.value === 1 ? 'review' : 'reviews') : ''}
          </p>
        ))}
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

  // Timeline Data Preparation
  const timelineMap = reviews?.reduce((acc, curr) => {
    const date = new Date(curr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    acc[date][curr.sentiment] += 1;
    acc[date].total += 1;
    return acc;
  }, {} as Record<string, { date: string; positive: number; neutral: number; negative: number; total: number }>) || {};
  
  const timelineData = Object.values(timelineMap).reverse();

  // Word Cloud Data Preparation
  const getWordCloudData = (revs: Review[]) => {
    const stopWords = new Set(["the", "and", "a", "an", "is", "was", "it", "to", "of", "in", "for", "with", "on", "this", "that", "but", "very", "we", "our", "were", "my", "i", "they", "as", "at", "not", "so", "be", "have", "you", "are", "from", "it's", "had"]);
    const wordCounts: { [key: string]: number } = {};
    
    revs.forEach(r => {
      const words = r.originalReview.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });
    
    // Sort and take top 50, then shuffle for cloud effect
    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 45)
      .map(([word, count]) => ({ word, count }));
      
    // Randomize array in-place using Durstenfeld shuffle algorithm
    for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    return sorted;
  };

  const wordCloudData = reviews ? getWordCloudData(reviews) : [];

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

              {/* Sentiment Timeline Chart */}
              <div className="mt-6 rounded-3xl glass-card p-6 border shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Sentiment Over Time</h3>
                {timelineData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="positive" name="Positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="neutral" name="Neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="negative" name="Negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">No data available</div>
                )}
              </div>

              {/* Dynamic Word Cloud */}
              <div className="mt-6 rounded-3xl glass-card p-6 border shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Cloud className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Word Cloud</h3>
                </div>
                {wordCloudData.length > 0 ? (
                  <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-3 py-6 px-4 min-h-[250px] relative">
                    {(() => {
                      const maxCount = Math.max(...wordCloudData.map(d => d.count));
                      return wordCloudData.map((item, idx) => {
                        // Calculate size between 14px and 48px based on relative frequency
                        const fontSize = Math.max(14, Math.min(48, (item.count / maxCount) * 56));
                        // Cycle through brand colors
                        const colors = ['text-emerald-600 dark:text-emerald-400', 'text-blue-600 dark:text-blue-400', 'text-indigo-600 dark:text-indigo-400', 'text-slate-700 dark:text-slate-300', 'text-purple-600 dark:text-purple-400', 'text-rose-600 dark:text-rose-400'];
                        const colorClass = colors[idx % colors.length];
                        
                        return (
                          <span 
                            key={idx} 
                            className={`font-extrabold transition-all duration-300 hover:scale-110 cursor-default opacity-90 hover:opacity-100 ${colorClass}`}
                            style={{ fontSize: `${fontSize}px` }}
                            title={`${item.count} mentions`}
                          >
                            {item.word}
                          </span>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-slate-400 text-sm min-h-[200px]">No words available</div>
                )}
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
