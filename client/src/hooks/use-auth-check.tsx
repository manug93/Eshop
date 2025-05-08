import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { apiRequest } from '@/lib/queryClient';

export function useAuthCheck() {
  const { user, refreshToken } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      // Si l'utilisateur n'est pas en mémoire mais qu'on a un accessToken
      if (!user && accessToken) {
        try {
          // Tentative de récupération des informations utilisateur via /me
          const response = await apiRequest('GET', '/api/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.status !== 200) {
            throw new Error('Token invalide');
          }

          const userData = await response.data;
          // Les données utilisateur seront mises à jour via le hook useAuth
          console.log('Utilisateur récupéré:', userData);
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          
          // Si on a un refreshToken, on tente de le rafraîchir
          if (storedRefreshToken) {
            try {
              await refreshToken();
              // Après le rafraîchissement, on réessaie de récupérer les données utilisateur
              const newResponse = await apiRequest('GET', '/api/me', {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
              });
              
              if (newResponse.status !== 200) {
                throw new Error('Échec de la récupération des données après rafraîchissement');
              }
            } catch (refreshError) {
              console.error('Erreur lors du rafraîchissement du token:', refreshError);
              // Si le rafraîchissement échoue, on nettoie tout
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } else {
            // Si pas de refreshToken, on nettoie tout
            localStorage.removeItem('accessToken');
          }
        }
      }
    };

    checkAuth();
  }, [user, refreshToken]);
} 