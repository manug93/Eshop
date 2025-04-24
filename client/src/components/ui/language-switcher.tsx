import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";

export function LanguageSwitcher() {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading } = useLanguage();
  const { t } = useTranslations();
  const { toast } = useToast();

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
    toast({
      title: t.languageChanged,
      description: code === 'en' ? t.languageSet : "Langue définie sur Français",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <GlobeIcon className="h-4 w-4" />
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={
              currentLanguage.code === language.code ? "bg-muted font-semibold" : ""
            }
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}