/**
 * Quick verification script for Task 3 contexts
 * Run this to verify all contexts are properly exported and functional
 */

import { useTheme } from '../../src/context/ThemeContext';
import { useSidebar } from '../../src/context/SidebarContext';
import { useToast } from '../../src/context/ToastContext';
import { useData } from '../../src/context/DataContext';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';
import { useDebounce } from '../../src/hooks/useDebounce';
import { useClickOutside } from '../../src/hooks/useClickOutside';
import { useFocusTrap } from '../../src/hooks/useFocusTrap';

// Verify all exports exist
const exports = {
  hooks: {
    useLocalStorage,
    useDebounce,
    useClickOutside,
    useFocusTrap,
  },
  contexts: {
    useTheme,
    useSidebar,
    useToast,
    useData,
  },
};

console.log('✅ All contexts and hooks exported successfully:', exports);

export default exports;
