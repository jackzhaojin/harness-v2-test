import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  onSelect: (value: string) => void;
  trigger?: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
}

export function Dropdown({
  items,
  onSelect,
  trigger,
  label,
  placeholder = 'Select...',
  className,
  align = 'left',
}: DropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const closeDropdown = useCallback((): void => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  useClickOutside(containerRef as React.RefObject<HTMLElement>, closeDropdown);

  const handleSelect = useCallback(
    (value: string, disabled?: boolean): void => {
      if (disabled) return;
      onSelect(value);
      closeDropdown();
    },
    [onSelect, closeDropdown]
  );

  const handleToggle = useCallback((): void => {
    setIsOpen((prev) => !prev);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setActiveIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= items.length ? 0 : next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? items.length - 1 : next;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < items.length) {
            handleSelect(items[activeIndex].value, items[activeIndex].disabled);
          }
          break;
        case 'Tab':
          closeDropdown();
          break;
      }
    },
    [isOpen, items, activeIndex, handleSelect, closeDropdown]
  );

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && menuRef.current) {
      const activeItem = menuRef.current.children[activeIndex] as HTMLElement | undefined;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className ?? ''}`}>
      {label && (
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </span>
      )}

      {/* Trigger */}
      {trigger ? (
        <div
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="cursor-pointer"
        >
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="inline-flex items-center justify-between w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        >
          <span>{placeholder}</span>
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Menu */}
      {isOpen && (
        <ul
          ref={menuRef}
          role="listbox"
          className={`absolute z-50 mt-1 max-h-60 w-full min-w-[10rem] overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg
            ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, index) => (
            <li
              key={item.value}
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={item.disabled}
              onClick={() => handleSelect(item.value, item.disabled)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 text-sm transition-colors
                ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500'
                    : index === activeIndex
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
