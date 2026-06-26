import { Check, Lock } from "lucide-react";

export interface QuestStepProps {
  order: number;
  title: string;
  description: string;
  status: "locked" | "active" | "done";
  onClick?: () => void;
}

export function QuestStep({ order, title, description, status, onClick }: QuestStepProps) {
  return (
    <div
      className={`qs-row qs-status-${status}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <div className="qs-status-icon">
        {status === "done" ? (
          <Check size={16} />
        ) : status === "locked" ? (
          <Lock size={16} />
        ) : (
          <span className="qs-active-dot" />
        )}
      </div>
      <div className="qs-text">
        <div className="qs-title">
          Step {order}. {title}
        </div>
        <div className="qs-desc">{description}</div>
      </div>
    </div>
  );
}
