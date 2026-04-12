"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface WaitlistResponse {
  success: boolean;
}

async function submitWaitlist(email: string): Promise<WaitlistResponse> {
  const response = await fetch("/api/waitlist/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}

export function useWaitlist() {
  return useMutation({
    mutationFn: submitWaitlist,
    onSuccess: () => {
      toast.success("You're on the list!", {
        description: "Check your inbox for a confirmation email.",
      });
    },
    onError: () => {
      toast.error("Registration failed", {
        description: "Please try again or contact support.",
      });
    },
  });
}