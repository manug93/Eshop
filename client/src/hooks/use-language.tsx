import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
const defaultAvailableLanguages: Language[] = [
  defaultLanguage,
  { code: 'fr', name: 'Français' }
];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: defaultLanguage,
  availableLanguages: defaultAvailableLanguages,
  changeLanguage: () => {},
  isLoading: false
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  
  const { data: availableLanguages = defaultAvailableLanguages, isLoading } = useQuery({
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/languages');
      return res.data;
    }
  });

  // Set language when user is loaded or browser preference
  useEffect(() => {
    if (user?.preferredLanguage) {
      const userLanguage = availableLanguages.find((lang: Language) => lang.code === user.preferredLanguage) || defaultLanguage;
      setCurrentLanguage(userLanguage);
    } else {
      // Get browser language
      const browserLang = navigator.language.split('-')[0];
      const matchedLanguage = availableLanguages.find((lang: Language) => lang.code === browserLang) || defaultLanguage;
      setCurrentLanguage(matchedLanguage);
    }
  }, [user, availableLanguages]);

  const languageMutation = useMutation({
    mutationFn: async (code: string) => {
      if (user) {
        await apiRequest('POST', '/api/user/language', {
          body: { language: code }
        });
      }
      return code;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error changing language',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const changeLanguage = (code: string) => {
    const newLanguage = availableLanguages.find((lang: Language) => lang.code === code) || defaultLanguage;
    setCurrentLanguage(newLanguage);
    
    if (user) {
      languageMutation.mutate(code);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      availableLanguages, 
      changeLanguage,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}