import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeForge Academy",
    template: "%s | CodeForge Academy"
  },
  description:
    "A browser-native software learning platform with courses, labs, challenges, and realistic practice environments.",
  keywords: ["coding education", "developer labs", "software courses", "browser IDE"],
  metadataBase: new URL("https://codeforge.academy")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="min-h-screen noise">
            <Header />
            <main>{children}</main>
          </div>
          <CommandPalette />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
