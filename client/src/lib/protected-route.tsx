import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Route, Redirect } from "wouter";
import { AuthLoader } from "@/components/ui/auth-loader";

export function ProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { user } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (!user) {
          return <Redirect to="/auth" />;
        }

        return <AuthLoader>{children}</AuthLoader>;
      }}
    </Route>
  );
}

export function AdminRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (!user.isAdmin) {
          return <Redirect to="/" />;
        }

        return <>{children}</>;
      }}
    </Route>
  );
}