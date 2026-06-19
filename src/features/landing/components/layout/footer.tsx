const LINKS = {
  telegram: "https://t.me/tasmilfinance",
  x: "https://x.com/tasmilfinance",
  docs: "https://tasmil-user-docs.vercel.app/docs",
};

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
    <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
    <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5-6.6L5.5 22H2.3l8.1-9.3L1.7 2h6.9l4.6 6.1L18.9 2Zm-1.2 18h1.9L7.1 4H5L17.7 20Z" />
  </svg>
);

const DocsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M14 3v5h5M9 13h6M9 17h5" />
  </svg>
);

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-inner">
        <div className="brand">
          <span className="brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>
            T
          </span>
          <span className="foot-copy">
            © 2026 Tasmil Finance · AI-managed portfolios for Stellar
          </span>
        </div>
        <div className="social-row" style={{ margin: 0 }}>
          <a className="social-pill" href={LINKS.telegram} target="_blank" rel="noreferrer">
            <TelegramIcon /> Telegram
          </a>
          <a className="social-pill" href={LINKS.x} target="_blank" rel="noreferrer">
            <XIcon /> X
          </a>
          <a className="social-pill" href={LINKS.docs} target="_blank" rel="noreferrer">
            <DocsIcon /> Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
