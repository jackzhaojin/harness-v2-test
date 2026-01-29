import { useCallback } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';
import type { AccentColor } from '../../types';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeChoice {
  value: ThemeOption;
  label: string;
  description: string;
  icon: typeof Sun;
}

interface AccentSwatch {
  value: AccentColor;
  label: string;
  bgClass: string;
  ringClass: string;
}

interface AppearanceSectionProps {
  accentColor: AccentColor;
  onAccentColorChange: (color: AccentColor) => void;
}

const THEME_CHOICES: ThemeChoice[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Use light theme',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Use dark theme',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follows OS preference',
    icon: Monitor,
  },
];

const ACCENT_SWATCHES: AccentSwatch[] = [
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-500', ringClass: 'ring-blue-500' },
  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-500', ringClass: 'ring-purple-500' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-500', ringClass: 'ring-green-500' },
  { value: 'orange', label: 'Orange', bgClass: 'bg-orange-500', ringClass: 'ring-orange-500' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-500', ringClass: 'ring-pink-500' },
];

export function AppearanceSection({
  accentColor,
  onAccentColorChange,
}: AppearanceSectionProps): JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = useCallback(
    (value: ThemeOption): void => {
      setTheme(value);
    },
    [setTheme]
  );

  return (
    <section aria-labelledby="appearance-heading" data-testid="appearance-section">
      <Card>
        <h2
          id="appearance-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Appearance
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how the application looks
        </p>

        {/* Theme Selector */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </h3>
          <div
            role="radiogroup"
            aria-label="Theme preference"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {THEME_CHOICES.map((choice) => {
              const isSelected = theme === choice.value;
              const Icon = choice.icon;

              return (
                <label
                  key={choice.value}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  data-testid={`theme-option-${choice.value}`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={choice.value}
                    checked={isSelected}
                    onChange={() => handleThemeChange(choice.value)}
                    className="sr-only"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={choice.label}
                  />
                  <Icon
                    className={`h-6 w-6 ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {choice.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {choice.description}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Accent Color Picker */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Accent Color
          </h3>
          <div
            role="radiogroup"
            aria-label="Accent color"
            className="flex flex-wrap gap-3"
          >
            {ACCENT_SWATCHES.map((swatch) => {
              const isSelected = accentColor === swatch.value;

              return (
                <label
                  key={swatch.value}
                  className="relative cursor-pointer"
                  data-testid={`accent-color-${swatch.value}`}
                >
                  <input
                    type="radio"
                    name="accent-color"
                    value={swatch.value}
                    checked={isSelected}
                    onChange={() => onAccentColorChange(swatch.value)}
                    className="sr-only"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={swatch.label}
                  />
                  <div
                    className={`h-10 w-10 rounded-full ${swatch.bgClass} flex items-center justify-center transition-all ${
                      isSelected
                        ? `ring-2 ring-offset-2 ${swatch.ringClass} dark:ring-offset-gray-800`
                        : 'hover:scale-110'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    )}
                  </div>
                  <span className="sr-only">{swatch.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}

export default AppearanceSection;
