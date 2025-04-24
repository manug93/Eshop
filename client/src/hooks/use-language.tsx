import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

type Language = {
  code: string;
  name: string;
};

type LanguageContextType = {
  currentLanguage: Language;
  availableLanguages: Language[];
  changeLanguage: (code: string) => void;
  isLoading: boolean;
};

const defaultLanguage: Language = { code: 'en', name: 'English' };

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: defaultLanguage,
  availableLanguages: [defaultLanguage],
  changeLanguage: () => {},
  isLoading: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  
  // Get available languages
  const { data: availableLanguages = [defaultLanguage], isLoading: languagesLoading } = useQuery({
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const res = await fetch('/api/languages');
      if (!res.ok) {
        throw new Error('Failed to fetch languages');
      }
      return res.json();
    },
  });

  // Set initial language based on user preference or browser
  useEffect(() => {
    if (!authLoading && user?.preferredLanguage) {
      const userLanguage = availableLanguages.find((lang: Language) => lang.code === user.preferredLanguage) || defaultLanguage;
      setCurrentLanguage(userLanguage);
    } else if (!languagesLoading) {
      // Try to use browser language or fall back to default
      const browserLang = navigator.language.split('-')[0];
      const matchedLanguage = availableLanguages.find((lang: Language) => lang.code === browserLang) || defaultLanguage;
      setCurrentLanguage(matchedLanguage);
    }
  }, [user, authLoading, availableLanguages, languagesLoading]);

  // Mutation to update user's preferred language
  const updateLanguageMutation = useMutation({
    mutationFn: async (languageCode: string) => {
      if (!user) return null;
      
      const res = await apiRequest('POST', '/api/user/language', { language: languageCode });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update language preference');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['/api/user'], data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Change language function
  const changeLanguage = (code: string) => {
    const newLanguage = availableLanguages.find((lang: Language) => lang.code === code) || defaultLanguage;
    setCurrentLanguage(newLanguage);
    
    // Update user preference if logged in
    if (user) {
      updateLanguageMutation.mutate(code);
    }
    
    // Show success toast
    toast({
      title: 'Language Changed',
      description: `Language set to ${newLanguage.name}`,
    });
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages,
        changeLanguage,
        isLoading: authLoading || languagesLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}