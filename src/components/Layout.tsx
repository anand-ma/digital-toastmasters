
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/contexts/ThemeProvider";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </ThemeProvider>
  );
}
