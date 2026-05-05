import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function Hairline({ className }: Props) {
  return <div role="separator" aria-hidden className={cn("h-px bg-[#1a1a1a]", className)} />;
}
