import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, BarChart3, Zap, TreePine } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-850 text-white dark:text-slate-200 font-semibold text-lg border border-slate-800">
                <TreePine className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  SentiNest
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trishul Eco-Homestays Sentiment Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">
                Staff Portal
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-20 border shadow-md text-center space-y-8">
            <div className="relative space-y-6 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Understand Guest Feedback <br />
                <span className="text-slate-500 dark:text-slate-400 font-light">Instantly & Deeply</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                Paste single or batch reviews to classify sentiment, identify key homestay themes, 
                and auto-generate professional responses with exceptional accuracy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <Link href="/classifier">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98">
                  Open Sentiment Classifier
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="glass-card transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border">
              <CardHeader className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-200">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Smart Sentiment Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  Real-time detection of sentiment tone (positive, neutral, negative) mapped to key hospitality operations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border">
              <CardHeader className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-200">
                  <Zap className="h-5 w-5 text-indigo-500" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Batch Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  Process up to 100 guest reviews simultaneously (one per line). Results are stored in active sessions database.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border">
              <CardHeader className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-200">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Auto-Draft Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  Auto-draft professional, context-aware management responses. Quickly copy to clipboard or export results to CSV.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="space-y-8 rounded-3xl glass-card p-8 md:p-12 border shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">How It Works</h3>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/65">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Input Reviews</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Paste single/batch comments in the text area and specify a custom session name.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/65">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">AI Analysis</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    The model determines sentiment, extracts operational themes, and drafts context-aware replies.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/65">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Review & Export</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Inspect the responsive data grid, filter or sort results, and export directly to CSV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-900 py-8 bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} SentiNest. Trishul Eco-Homestays auditing utility.</p>
        </div>
      </footer>
    </div>
  );
}
