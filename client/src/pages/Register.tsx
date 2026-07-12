import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button, Input } from "@/components/ui";
import { UserPlus, Lock, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }
      
      toast.success("Account created successfully! Please sign in.");
      setLocation("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow mx-auto max-w-md px-4 py-16 w-full flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm mx-auto">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Join to start analyzing sentiments
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
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-sm rounded-xl"
              >
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <span className="text-sm text-slate-500 font-medium">
                Already have an account? <Link href="/login"><span className="text-emerald-500 font-bold cursor-pointer">Sign in</span></Link>
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
