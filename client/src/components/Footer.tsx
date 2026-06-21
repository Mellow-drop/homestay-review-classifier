import { Link } from "wouter";
import { TreePine } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 dark:border-slate-900/60 bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm w-full py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo / Brand Info */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800 text-white border border-slate-800">
              <TreePine className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              SentiNest
            </span>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/classifier"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Classifier
            </Link>
            <Link
              href="/about"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Login
            </Link>
          </nav>

          {/* Copyright notice */}
          <div className="text-center md:text-right text-xs text-slate-400 dark:text-slate-500">
            <p>© {currentYear} SentiNest. Trishul Eco-Homestays auditing utility.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
