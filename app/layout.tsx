import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CINEMETRIC — In-Browser Recommender Systems Explainer",
  description:
    "An interactive dual-engine explainer contrasting Truncated SVD Collaborative Filtering with Content-Based Vector Search running real math in your browser.",
  openGraph: {
    title: "CINEMETRIC — In-Browser Recommender Systems Explainer",
    description:
      "Real algorithms, real numbers: watch Truncated SVD matrix factorization and TF-IDF cosine vector space execute live in your browser.",
    type: "website",
    locale: "en_US",
    siteName: "CINEMETRIC",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-bg text-text min-h-screen antialiased selection:bg-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
