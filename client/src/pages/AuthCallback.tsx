import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const processGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      
      if (!code) {
        toast.error("No authorization code provided");
        setLocation("/login");
        return;
      }

      try {
        const res = await fetch(`/api/auth/google/callback?code=${code}`, {
          method: "POST"
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.detail || "Failed to authenticate with Google");
        }
        
        login(data.access_token);
        toast.success("Successfully logged in with Google!");
        setLocation("/dashboard");
      } catch (err: any) {
        toast.error(err.message);
        setLocation("/login");
      }
    };

    processGoogleCallback();
  }, [setLocation, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
