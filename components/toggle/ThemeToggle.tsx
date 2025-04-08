import { useTheme } from "../../hooks/useThemes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="outline" onClick={toggleTheme} className="flex gap-2">
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}