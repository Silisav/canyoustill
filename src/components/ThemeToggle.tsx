"use client";

import { currentTheme, setTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";
import { iconButton, iconMotion } from "./buttons";

// Which icon shows is decided in CSS (the `dark:` variant), so server HTML and the first paint
// already match the theme and nothing swaps after hydration. Once you've switched, the icon that
// appears spins in (globals.css); hovering swings the moon and turns the sun.
export function ThemeToggle() {
  return (
    <button
      type="button"
      className={iconButton}
      aria-label="Switch between light and dark"
      onClick={() => {
        document.documentElement.dataset.themeSwitched = "";
        setTheme(currentTheme() === "dark" ? "light" : "dark");
      }}
    >
      <MoonIcon data-theme-icon className={`dark:hidden ${iconMotion} group-hover:-rotate-[20deg]`} />
      <SunIcon data-theme-icon className={`hidden dark:block ${iconMotion} group-hover:rotate-45`} />
    </button>
  );
}
