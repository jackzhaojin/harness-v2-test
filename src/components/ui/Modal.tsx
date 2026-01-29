import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

// Types
interface ModalContextValue {
  onClose: () => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface ModalHeaderProps {
  children: ReactNode;
}

interface ModalBodyProps {
  children: ReactNode;
}

interface ModalFooterProps {
  children: ReactNode;
}

// Context
const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal');
  }
  return context;
}

// Sub-components
function ModalHeader({ children }: ModalHeaderProps): JSX.Element {
  const { onClose } = useModalContext();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="text-lg font-semibold text-gray-900 dark:text-white">
        {children}
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ModalBody({ children }: ModalBodyProps): JSX.Element {
  return (
    <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {children}
    </div>
  );
}

function ModalFooter({ children }: ModalFooterProps): JSX.Element {
  return (
    <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}

// Main Modal component
function Modal({ isOpen, onClose, children }: ModalProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const focusTrapRef = useFocusTrap(isOpen);

  // Handle open
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback((): void => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      onClose();
    }, 200);
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

  // Lock body scroll when modal is open
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
    <ModalContext.Provider value={{ onClose: handleClose }}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'
        }`}
        onClick={handleBackdropClick}
        role="presentation"
      >
        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

        {/* Modal content panel */}
        <div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          className={`relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl ${
            isAnimatingOut ? 'animate-modal-scale-out' : 'animate-modal-scale-in'
          }`}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps };
export default Modal;
