
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <ThemeProvider defaultTheme="system">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system">
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </ThemeProvider>
  );
}
