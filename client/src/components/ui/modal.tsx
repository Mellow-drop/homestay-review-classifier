import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

/**
 * Props for the custom Modal overlay component.
 * @property {boolean} isOpen - Determines whether the modal is visible.
 * @property {function} onClose - Callback handler to close the modal (e.g. clicking backdrop, close button, or pressing escape).
 * @property {string} [title] - Optional title text rendered in the modal header.
 * @property {React.ReactNode} children - Content elements rendered inside the modal body.
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Reusable modal popup overlay component with focus trapping, ESC key dismiss, and light/dark theme styling.
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus trapping logic
  useEffect(() => {
    if (!isOpen) return;

    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    
    // Slight timeout to ensure modal is rendered
    const timeoutId = setTimeout(() => {
      if (!modalRef.current) return;
      
      const focusableElements = Array.from(
        modalRef.current.querySelectorAll(focusableElementsString)
      ) as HTMLElement[];

      if (focusableElements.length > 0) {
        // Focus first element on open
        focusableElements[0].focus();

        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== "Tab") return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab: loop back to end
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            // Tab: loop to start
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        };

        const currentModal = modalRef.current;
        currentModal.addEventListener("keydown", handleTab);
        return () => {
          currentModal.removeEventListener("keydown", handleTab);
        };
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay background */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 w-full max-w-lg rounded-2xl p-6 shadow-xl flex flex-col gap-4 animate-scale-in z-10 transition-colors duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900">
          {title ? (
            <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
