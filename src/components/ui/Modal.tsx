import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="overlay" onClick={onClose} />
      <div
        className={cn(
          'relative z-50 w-full bg-[--bg] shadow-xl animate-fade-up',
          sizeClass
        )}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[--border]">
            <h3 className="font-serif text-xl text-[--text]">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
