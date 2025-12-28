import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">
        {language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      </span>
    </Button>
  );
}
