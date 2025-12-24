import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { AppLogoWithText } from "@/components/common/app-logo";
import { Button } from "@/components/ui/button";

interface StatusPageProps {
  code: string;
  message: string;
  children?: ReactNode;
}

export function StatusPage({ code, message, children }: StatusPageProps) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="dot-background relative flex h-svh flex-col items-center justify-center gap-6">
      <AppLogoWithText className="absolute top-32 left-1/2 -translate-x-1/2" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-bold text-7xl text-muted-foreground/20 tracking-tighter">
          {code}
        </h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>

      {children}

      <Button onClick={handleGoHome} size="sm">
        <Home className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
}
