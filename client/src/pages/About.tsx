import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TreePine, Heart, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="space-y-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              About SentiNest
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal">
              Trishul Eco-Homestays review auditing application.
            </p>
          </div>

          {/* About Section */}
          <div className="rounded-3xl glass-card p-8 md:p-12 border shadow-sm space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              At Trishul Eco-Homestays, we prioritize guest feedback to maintain our commitment to sustainability, 
              hospitality, and cleanliness. <strong>SentiNest</strong> was built to empower our administration team with advanced sentiment analysis, 
              helping us categorize guest reviews (covering hosts, food, location, cleanliness, and value) and auto-draft professional, 
              empathetic management responses.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              By combining Google's Gemini models with offline rule-based fallbacks, we guarantee continuous auditing availability even during network disruptions, 
              maintaining a target accuracy rate above 80%.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="glass-card border rounded-2xl p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                <TreePine className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Eco-Commitment</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tracking reviews on environmental practices and local food sourcing.
              </p>
            </div>

            <div className="glass-card border rounded-2xl p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                <Heart className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Empathetic Care</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Assuring every guest response is drafted with care and hospitality standards.
              </p>
            </div>

            <div className="glass-card border rounded-2xl p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Reliable Accuracy</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Evaluating classification engines constantly with a local validation suite.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
