import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserWithoutPassword = Omit<User, "password">;

type AuthContextType = {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithoutPassword, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithoutPassword, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
};

// Create the context with a default value that matches the shape
const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as any,
  logoutMutation: {} as any,
  registerMutation: {} as any
};

export const AuthContext = createContext<AuthContextType>(defaultContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithoutPassword | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login with:', credentials.username);
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        const userData = await res.json();
        
        if (!res.ok) {
          throw new Error(userData.message || "Login failed");
        }
        
        console.log('Login response:', userData);
        return userData;
      } catch (error) {
        console.error("Login fetch error:", error);
        throw error;
      }
    },
    onSuccess: (user: UserWithoutPassword) => {
      console.log('Setting user data in query cache');
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate the user query to force a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Login successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      console.log('Attempting registration with:', userData.username);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          credentials: "include"
        });
        
        const userResponse = await res.json();
        
        if (!res.ok) {
          throw new Error(userResponse.message || "Registration failed");
        }
        
        console.log('Registration response:', userResponse);
        return userResponse;
      } catch (error) {
        console.error("Registration fetch error:", error);
        throw error;
      }
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting logout');
      try {
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Logout failed");
        }
        
        console.log('Logout successful');
      } catch (error) {
        console.error("Logout fetch error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // Since we now have a default value, we'll never get null here
  return context;
}