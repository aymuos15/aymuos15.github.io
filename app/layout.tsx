import type { Metadata } from "next";
import "./globals.css";
import { ConditionalHeader } from "@/components/conditional-header";
import { PageTransition } from "@/components/page-transition";
import { PrefetchRoutes } from "@/components/prefetch-routes";

export const metadata: Metadata = {
  title: "Soumya Snigdha Kundu",
  description: "Personal website of Soumya Snigdha Kundu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "'Roboto', sans-serif" }}>
        <PrefetchRoutes />
        <ConditionalHeader />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
