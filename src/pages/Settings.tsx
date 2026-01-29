import { useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeChoice {
  value: ThemeOption;
  label: string;
  description: string;
  icon: typeof Sun;
}

const themeChoices: ThemeChoice[] = [
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

export default function Settings(): JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = useCallback(
    (value: ThemeOption): void => {
      setTheme(value);
    },
    [setTheme]
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Manage your application preferences
      </p>

      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Theme Preference
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose how the application looks to you
          </p>

          <div
            role="radiogroup"
            aria-label="Theme preference"
            className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {themeChoices.map((choice) => {
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
        </Card>
      </section>
    </div>
  );
}
