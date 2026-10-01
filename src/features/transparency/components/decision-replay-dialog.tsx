"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { DecisionReplayEvidence } from "./decision-replay-page";

interface DecisionReplayDialogProps {
  decisionId: string;
  onOpenChange: (open: boolean) => void;
}

export function DecisionReplayDialog({ decisionId, onOpenChange }: DecisionReplayDialogProps) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogClose
          aria-label="Close replay"
          className="absolute top-4 right-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Decision replay</DialogTitle>
          <DialogDescription className="break-all font-mono text-xs">
            {decisionId}
          </DialogDescription>
        </DialogHeader>
        <DecisionReplayEvidence decisionId={decisionId} />
      </DialogContent>
    </Dialog>
  );
}
