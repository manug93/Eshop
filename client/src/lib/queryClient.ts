import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

async function throwIfResNotOk(error: AxiosError) {
  if (error.response) {
    const text = error.response.data || error.response.statusText;
    throw new Error(`${error.response.status}: ${text}`);
  }
  throw error;
}

export async function apiRequest(
  method: string,
  url: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<AxiosResponse> {
  const accessToken = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    headers,
    withCredentials: true,
  };

  if (method !== "GET" && method !== "HEAD" && options?.body) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
      headers["Accept"] = "application/json";
    }
    config.data = options.body;
  }

  try {
    const response = await axios(config);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post("/api/refresh", { refreshToken }, {
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            withCredentials: true,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Réessayer la requête originale avec le nouveau token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          return axios(config);
        } catch (refreshError: unknown) {
          console.error("Error refreshing token:", refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          throw refreshError;
        }
      }
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const accessToken = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    try {
      const response = await axios.get(queryKey[0] as string, {
        headers,
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
