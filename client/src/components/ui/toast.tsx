import { toast as sonnerToast } from "sonner";

/**
 * Toast utility object providing success, error, info, and warning notification methods.
 * Serves as a wrapper around the sonner toast notification system.
 */
export const Toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },
};
export default Toast;
