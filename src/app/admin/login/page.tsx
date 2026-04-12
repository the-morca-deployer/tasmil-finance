"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/features/admin-auth/hooks/use-admin-auth";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, error } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result?.success) {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card">
        <div className="mb-8 text-center">
          <Typography variant="h2" className="font-bold text-2xl mb-2">
            Admin Portal
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-sm">
            Sign in to manage the whitelist and campaigns
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zyf.ai"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <Typography variant="p" className="text-red-400 text-sm">
                {error}
              </Typography>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11"
            variant="gradient"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}