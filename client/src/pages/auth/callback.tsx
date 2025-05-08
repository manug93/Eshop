import { useEffect } from "react";
import { useNavigate, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch();
  const { loginMutation } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      navigate("/");
    } else {
      navigate("/auth");
    }
  }, [search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connexion en cours...</h1>
        <p>Veuillez patienter pendant que nous vous connectons.</p>
      </div>
    </div>
  );
} 