import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  showCta?: boolean;
}

export default function Hero({
  title,
  subtitle,
  description,
  ctaText = "Get Started",
  ctaLink = "/classifier",
  showCta = true,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-20 border shadow-md text-center space-y-8 w-full max-w-7xl mx-auto">
      {/* Background visual accents */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative space-y-6 max-w-3xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {title}
          {subtitle && (
            <>
              <br />
              <span className="text-slate-500 dark:text-slate-400 font-light block mt-2">
                {subtitle}
              </span>
            </>
          )}
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {showCta && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link href={ctaLink}>
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold shadow-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
