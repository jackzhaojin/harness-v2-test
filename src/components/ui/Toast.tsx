import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast, Toast as ToastType, ToastType as ToastVariant } from '../../context/ToastContext';

// Types
interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

// Constants
const toastIcons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const toastIconColors: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

const toastBorderColors: Record<ToastVariant, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

// Individual Toast item
function ToastItem({ toast, onDismiss }: ToastItemProps): JSX.Element {
  const [isExiting, setIsExiting] = useState(false);

  // Start exit animation slightly before auto-dismiss removes it
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2700);

    return () => {
      clearTimeout(exitTimer);
    };
  }, []);

  const handleDismiss = (): void => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  };

  const Icon = toastIcons[toast.type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${
        toastBorderColors[toast.type]
      } ${isExiting ? 'animate-fade-out' : 'animate-slide-up'}`}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${toastIconColors[toast.type]}`}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 rounded-lg p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast container - renders all toasts via portal
export function ToastContainer(): JSX.Element | null {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-h-screen overflow-hidden pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  );
}

export default ToastContainer;
