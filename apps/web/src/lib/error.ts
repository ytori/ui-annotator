import { toast } from "sonner";
import type { ZodError, ZodIssue } from "zod";

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Format Zod validation errors for display
 */
function _formatZodError(error: ZodError<unknown>): string {
  const messages = (error.issues as ZodIssue[]).map((e) => {
    const path = e.path.join(".");
    return path ? `${path}: ${e.message}` : e.message;
  });
  return messages.join(", ");
}

/**
 * Show error toast notification
 */
export function showError(message: string, description?: string): void {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Show success toast notification
 */
export function showSuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}
