import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button, Input } from "@/components/ui";
import { KeyRound, Lock, User, Github } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }
      
      login(data.access_token);
      toast.success("Login successful!");
      setLocation("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("/api/auth/google/login");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error("Failed to initialize Google login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-md px-4 py-16 w-full flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 shadow-sm mx-auto">
              <KeyRound className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Sign in to manage your sentiment analysis
            </p>
          </div>

          <div className="rounded-3xl glass-card p-8 border shadow-sm space-y-6 bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 z-10 pt-6">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@trishulecohomestays.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 z-10 pt-6">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-sm rounded-xl"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-11 border-slate-200 dark:border-slate-800 font-bold rounded-xl"
            >
              Sign in with Google
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-slate-500 font-medium">
                Don't have an account? <Link href="/register"><span className="text-emerald-500 font-bold cursor-pointer">Register</span></Link>
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
