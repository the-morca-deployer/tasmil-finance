"use client";

import { useState } from "react";
import { useWaitlist } from "@/features/whitelist/hooks/use-waitlist";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import { Loader2 } from "lucide-react";

export function WhitelistForm() {
  const [email, setEmail] = useState("");
  const { mutate: register, isPending, isSuccess, error } = useWaitlist();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    register(email);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || isSuccess}
          className="h-12 w-full rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || isSuccess || !email.trim()}
        size="lg"
        className="h-12 w-full rounded-lg font-mono text-base uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
        variant="gradient"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining...
          </span>
        ) : isSuccess ? (
          "You're on the list!"
        ) : (
          "Join Waitlist"
        )}
      </Button>

      {error && (
        <Typography variant="p" className="text-red-400 text-sm text-center">
          Something went wrong. Please try again.
        </Typography>
      )}

      {isSuccess && (
        <Typography variant="p" className="text-emerald-400 text-sm text-center">
          Thanks! Check your inbox for a confirmation email.
        </Typography>
      )}
    </form>
  );
}