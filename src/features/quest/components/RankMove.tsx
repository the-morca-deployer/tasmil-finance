import { ChevronDown, ChevronUp } from "lucide-react";

export function RankMove({ move }: { move: number }) {
  if (move === 0) return null;
  return (
    <span className={`rank-move ${move > 0 ? "up bounce" : "down"}`}>
      {move > 0 ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      {Math.abs(move)}
    </span>
  );
}
