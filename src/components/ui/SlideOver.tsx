import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

// Types
interface SlideOverContextValue {
  onClose: () => void;
}

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface SlideOverHeaderProps {
  children: ReactNode;
}

interface SlideOverBodyProps {
  children: ReactNode;
}

interface SlideOverFooterProps {
  children: ReactNode;
}

// Context
const SlideOverContext = createContext<SlideOverContextValue | null>(null);

function useSlideOverContext(): SlideOverContextValue {
  const context = useContext(SlideOverContext);
  if (!context) {
    throw new Error('SlideOver compound components must be used within a SlideOver');
  }
  return context;
}

// Sub-components
function SlideOverHeader({ children }: SlideOverHeaderProps): JSX.Element {
  const { onClose } = useSlideOverContext();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="text-lg font-semibold text-gray-900 dark:text-white">
        {children}
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        aria-label="Close panel"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function SlideOverBody({ children }: SlideOverBodyProps): JSX.Element {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {children}
    </div>
  );
}

function SlideOverFooter({ children }: SlideOverFooterProps): JSX.Element {
  return (
    <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}

// Main SlideOver component
function SlideOver({ isOpen, onClose, children }: SlideOverProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const focusTrapRef = useFocusTrap(isOpen);

  // Handle open / external close
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
    } else if (isVisible) {
      // Parent set isOpen to false — animate out
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle close with animation
  const handleClose = useCallback((): void => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible && !isOpen) return null;

  return createPortal(
    <SlideOverContext.Provider value={{ onClose: handleClose }}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex justify-end ${
          isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'
        }`}
        onClick={handleBackdropClick}
        role="presentation"
      >
        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />

        {/* Panel */}
        <div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          className={`relative w-full max-w-md flex flex-col bg-white dark:bg-gray-800 shadow-xl ${
            isAnimatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'
          }`}
        >
          {children}
        </div>
      </div>
    </SlideOverContext.Provider>,
    document.body
  );
}

// Attach sub-components
SlideOver.Header = SlideOverHeader;
SlideOver.Body = SlideOverBody;
SlideOver.Footer = SlideOverFooter;

export { SlideOver };
export type { SlideOverProps, SlideOverHeaderProps, SlideOverBodyProps, SlideOverFooterProps };
export default SlideOver;
