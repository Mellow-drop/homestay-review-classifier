import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock, User } from "lucide-react";

export default function Login() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-905 dark:bg-slate-800 text-white border border-slate-800 shadow-sm mx-auto">
              <KeyRound className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Staff Authentication
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Access the review audit suite and administrative configuration.
            </p>
          </div>

          {/* Login Card Form */}
          <div className="rounded-3xl glass-card p-8 border shadow-sm space-y-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    placeholder="staff@trishulecohomestays.com"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Access Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 cursor-not-allowed"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled
                className="w-full h-11 bg-slate-900 text-white font-bold shadow-sm rounded-xl transition-all duration-200 cursor-not-allowed"
              >
                Sign In (Placeholder)
              </Button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400 font-medium">
                Note: Authentication endpoints are simulated. Database verification is disabled in the preview sandbox.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
