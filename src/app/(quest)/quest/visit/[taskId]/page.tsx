"use client";

import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { useTasksControllerRecordVisit } from "@/gen-quest/hooks";

const VISIT_DURATION = 30;

export default function VisitTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params?.taskId as string;
  const targetUrl = searchParams?.get("url") || "";

  const [countdown, setCountdown] = useState(VISIT_DURATION);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const hasRecordedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const recordVisitMutation = useTasksControllerRecordVisit({
    ...withAuth,
    mutation: {
      onSuccess: () => {
        setIsRecorded(true);
        setIsRecording(false);
        toast.success("Visit recorded! Go back and click Verify.");
      },
      onError: (error: unknown) => {
        setIsRecording(false);
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        const message = axiosError.response?.data?.error?.message || "Failed to record visit.";
        toast.error(message);
      },
    },
  });

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      if (!hasRecordedRef.current && taskId) {
        hasRecordedRef.current = true;
        setIsRecording(true);
        recordVisitMutation.mutate({ id: taskId });
      }
    }, VISIT_DURATION * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = ((VISIT_DURATION - countdown) / VISIT_DURATION) * 100;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-6 px-6">
      {isRecorded ? (
        <>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-xl font-bold">Visit Recorded!</h1>
          <p className="text-sm text-muted text-center">
            Go back to the campaign page and click <strong>Verify</strong>.
          </p>
          <button
            onClick={() => window.history.back()}
            className="py-2.5 px-6 bg-brand-mid text-background font-semibold rounded-xl hover:opacity-90 transition"
          >
            Back to Campaign
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
            {isRecording ? (
              <Loader2 className="h-7 w-7 animate-spin text-brand-mid" />
            ) : (
              <span className="text-2xl font-bold tabular-nums text-brand-mid">{countdown}</span>
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold">Recording your visit...</p>
            <p className="text-sm text-muted">
              Visit will be recorded automatically in {countdown}s.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-mid rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-brand-mid underline underline-offset-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open link
            </a>
          )}
        </>
      )}
    </div>
  );
}
