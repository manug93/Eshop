import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AxiosResponse } from "axios";

type UserWithoutPassword = Omit<User, "password">;

interface AuthContextType {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, { username: string; password: string }>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, { username: string; password: string; email: string }>;
  refreshToken: () => Promise<void>;
}

// Create the context with a default value that matches the shape
const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as any,
  logoutMutation: {} as any,
  registerMutation: {} as any,
  refreshToken: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();

  // Get user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        return null;
      }

      try {
        const response = await apiRequest("GET", "/api/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          // Tentative de rafraîchissement du token
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const refreshResponse = await apiRequest("POST", "/api/refresh", {
                body: { refreshToken },
                headers: {
                  "Content-Type": "application/json",
                },
              });

              if (refreshResponse.status === 200) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                localStorage.setItem("accessToken", newAccessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                // Nouvelle tentative avec le nouveau token
                const newUserResponse = await apiRequest("GET", "/api/me", {
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                });

                if (newUserResponse.status === 200) {
                  return newUserResponse.data;
                }
              }
            } catch (refreshError) {
              console.error("Error refreshing token:", refreshError);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              return null;
            }
          }
          return null;
        }

        return response.data;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    retry: false,
    enabled: !!localStorage.getItem("accessToken"),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", {
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status !== 200) {
        throw new Error("Login failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      queryClient.setQueryData(["user"], data.user);
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email: string }) => {
      const response = await apiRequest("POST", "/api/register", {
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      const responseData = response.data;

      if (responseData.accessToken && responseData.refreshToken) {
        localStorage.setItem("accessToken", responseData.accessToken);
        localStorage.setItem("refreshToken", responseData.refreshToken);
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await apiRequest("POST", "/api/logout", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
    },
  });

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Aucun token de rafraîchissement disponible");
    }

    try {
      const response = await apiRequest("POST", "/api/refresh", {
        body: { refreshToken },
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        queryClient.setQueryData(["user"], null);
        throw new Error("Session expirée, veuillez vous reconnecter");
      }

      if (response.status !== 200) {
        throw new Error("Échec du rafraîchissement du token");
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.setQueryData(["user"], null);
      throw error;
    }
  };

  // Add token to requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        init = init || {};
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }
      return originalFetch(input, init);
    };
  }, []);

  // Auto refresh token
  useEffect(() => {
    const interval = setInterval(async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (accessToken && refreshToken) {
        try {
          const response = await apiRequest("POST", "/api/refresh", {
            body: { refreshToken },
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (response.status === 200) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("refreshToken", newRefreshToken);
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          queryClient.setQueryData(["user"], null);
        }
      }
    }, 14 * 60 * 1000); // Refresh 1 minute before token expires

    return () => clearInterval(interval);
  }, []);

  // Initial check for tokens
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (accessToken && refreshToken) {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user as UserWithoutPassword | null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}