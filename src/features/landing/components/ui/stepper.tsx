const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

interface StepperProps {
  steps: string[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        const stateClass = isDone ? "done" : isActive ? "active" : "";
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? "auto" : "none",
            }}
          >
            <div
              className={`step ${stateClass}`}
              style={{ flexDirection: "column", alignItems: "center", display: "flex", gap: 6 }}
            >
              <div className="step-node">{isDone ? <CheckIcon /> : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`step-line${isDone ? " filled" : ""}`}
                style={{ flex: 1, margin: "0 4px", marginBottom: 16 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
