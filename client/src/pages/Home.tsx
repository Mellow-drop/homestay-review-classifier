import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Card from "@/components/Card";
import Footer from "@/components/Footer";
import { Sparkles, BarChart3, Zap, FileText, Cpu, ListFilter } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Reusable Header Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="space-y-16">
          {/* Reusable Hero Component */}
          <Hero
            title={
              <>
                Understand Guest Feedback <br />
                <span className="text-slate-500 dark:text-slate-400 font-light">Instantly & Deeply</span>
              </>
            }
            description="Paste single or batch reviews to classify sentiment, identify key homestay themes, and auto-generate professional responses with exceptional accuracy."
            ctaText="Open Sentiment Classifier"
            ctaLink="/classifier"
            showCta={true}
          />

          {/* Reusable Card Components in Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            <Card
              title="Smart Sentiment Tags"
              description="Real-time detection of sentiment tone (positive, neutral, negative) mapped to key hospitality operations."
              icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
              badge="Real-time"
            />

            <Card
              title="Batch Classification"
              description="Process up to 100 guest reviews simultaneously (one per line). Results are stored in active sessions database."
              icon={<Zap className="h-5 w-5 text-indigo-500" />}
              badge="Scalable"
            />

            <Card
              title="Auto-Draft Responses"
              description="Auto-draft professional, context-aware management responses. Quickly copy to clipboard or export results to CSV."
              icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
              badge="AI-Powered"
            />
          </div>

          {/* How It Works */}
          <div className="space-y-8 rounded-3xl glass-card p-8 md:p-12 border shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">How It Works</h3>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/65">
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Input Reviews</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Paste single/batch comments in the text area and specify a custom session name.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/65">
                  <Cpu className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">AI Analysis</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    The model determines sentiment, extracts operational themes, and drafts context-aware replies.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/65">
                  <ListFilter className="h-5 w-5 text-purple-500" />
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

      {/* Reusable Footer Component */}
      <Footer />
    </div>
  );
}
