import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AuthLoaderProps {
  children: React.ReactNode;
}

export function AuthLoader({ children }: AuthLoaderProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
} 