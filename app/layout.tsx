import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

// ─── Font Loading ──────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
});

// ─── Metadata ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://braidsbyLana.com"),
  title: {
    default: "Braids by Lana | Professional Hair Braiding — Saint Albans, Queens, NY",
    template: "%s | Braids by Lana",
  },
  description:
    "Professional hair braiding by Lana. Serving Saint Albans, Queens, NY. Book your appointment online.",
  keywords: [
    "hair braiding",
    "braids",
    "Braids by Lana",
    "Saint Albans Queens NY",
    "New York",
    "protective styles",
    "box braids",
    "knotless braids",
    "faux locs",
    "Lana",
  ],
  authors: [{ name: "Lana" }],
  creator: "Braids by Lana",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://braidsbyLana.com",
    siteName: "Braids by Lana",
    title: "Braids by Lana | Professional Hair Braiding",
    description:
      "Professional hair braiding by Lana. Serving Saint Albans, Queens, NY.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Braids by Lana — Professional Hair Braiding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Braids by Lana | Professional Hair Braiding",
    description:
      "Professional hair braiding by Lana. Serving Saint Albans, Queens, NY.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D0D0D",
};

// ─── Root Layout ──────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-teal-dark text-white font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}