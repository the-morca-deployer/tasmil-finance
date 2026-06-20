import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { AppProvider } from "@/providers/app-provider";
import { ServiceWorkerRegistrar } from "@/shared/components/service-worker-registrar";
import "./globals.css";

const outfit = localFont({
  src: "../../public/fonts/PPNeueMontreal.otf",
  variable: "--font-outfit",
  display: "swap",
});

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
    if (isDark) {
      html.setAttribute('data-dark', '');
    } else {
      html.removeAttribute('data-dark');
    }
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export const metadata: Metadata = {
  title: "Tasmil Finance",
  description: "DeFi platform for Stellar ecosystem",
  openGraph: {
    title: "Tasmil Finance",
    description: "DeFi platform for Stellar ecosystem",
    images: [{ url: "/og/banner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${outfit.variable} ${hanken.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark light" />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        {process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__TASMIL_E2E_WALLET__ = { connected: true, publicKey: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R" };`,
            }}
          />
        )}
      </head>
      <body className={`${outfit.className} antialiased`}>
        <ServiceWorkerRegistrar />
        <AppProvider>{children}</AppProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
