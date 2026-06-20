export function fireConfettiBurst(anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ["#67E8F9", "#C4B5FD", "#6EE7B7", "#FCD34D", "#ffffff"];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const angle = (i / count) * 360;
    const dist = 40 + Math.random() * 60;
    const size = 5 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(el.style, {
      position: "fixed",
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
    });

    document.body.appendChild(el);

    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;

    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 700);
  }
}
