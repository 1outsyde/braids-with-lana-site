import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://braidswithlove.com"),
  title: {
    default: "Braids With Love | Professional Hair Braiding — Norfolk, VA",
    template: "%s | Braids With Love",
  },
  description:
    "Luxury hair braiding by Danny Nicole. Serving Norfolk, VA and the Hampton Roads area. Book your appointment online.",
  keywords: [
    "hair braiding",
    "braids",
    "Norfolk VA",
    "Hampton Roads",
    "protective styles",
    "box braids",
    "knotless braids",
    "Danny Nicole",
    "Braids With Love",
  ],
  authors: [{ name: "Danny Nicole" }],
  creator: "Braids With Love",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://braidswithlove.com",
    siteName: "Braids With Love",
    title: "Braids With Love | Professional Hair Braiding",
    description:
      "Luxury hair braiding by Danny Nicole. Serving Norfolk, VA and the Hampton Roads area.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Braids With Love — Professional Hair Braiding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Braids With Love | Professional Hair Braiding",
    description:
      "Luxury hair braiding by Danny Nicole. Serving Norfolk, VA and the Hampton Roads area.",
    images: ["/og-image.jpg"],
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
      <body className="bg-onyx text-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}