"use client";

import { Typography } from "@/shared/ui/typography";
import { WhitelistForm } from "@/features/whitelist/components/whitelist-form";
import { PATHS } from "@/shared/constants/routes";

export default function WhitelistPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-20 w-full">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            Early Access
          </span>
        </div>

        {/* Headline */}
        <Typography
          variant="h1"
          gradient={true}
          className="text-center font-bold text-4xl md:text-5xl lg:text-6xl mb-4"
        >
          Tasmil Finance
        </Typography>

        <Typography
          variant="h2"
          gradient={true}
          className="text-center font-bold text-3xl md:text-4xl lg:text-5xl mb-6"
        >
          Coming Soon
        </Typography>

        <div className="max-w-2xl text-center mb-10">
          <Typography variant="p" className="text-gray-300 text-lg md:text-xl leading-relaxed">
            AI-powered DeFi portfolio management on the U2U blockchain.
            Get early access and be among the first to experience
            intelligent yield optimization and automated strategy management.
          </Typography>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col items-center">
          <p className="mb-4 text-muted-foreground text-sm font-mono uppercase tracking-wider">
            Join the Waitlist
          </p>
          <WhitelistForm />
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center gap-2 text-muted-foreground text-sm">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-black bg-gradient-to-br from-primary/40 to-accent/40"
              />
            ))}
          </div>
          <span>Join 1,000+ early adopters</span>
        </div>

        {/* Footer links */}
        <div className="mt-16 flex gap-6 text-muted-foreground text-sm">
          <a href={PATHS.TELEGRAM} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Telegram
          </a>
          <a href={PATHS.X} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            X (Twitter)
          </a>
          <a href={PATHS.DOCS} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Docs
          </a>
        </div>
      </div>
    </div>
  );
}