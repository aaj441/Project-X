import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number; // seconds
  onSave: () => Promise<void>;
  content: string;
}

export function useAutoSave({
  enabled = true,
  interval = 3,
  onSave,
  content,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);
  const isSavingRef = useRef(false);

  const user = useAuthStore((state) => state.user);
  const userPreferences = user?.preferences;

  // Get auto-save settings from user preferences
  const autoSaveEnabled = enabled && (userPreferences?.autoSave ?? true);
  const autoSaveInterval = (userPreferences?.autoSaveInterval ?? interval) * 1000; // convert to ms

  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;
    if (lastContentRef.current === content) return; // No changes

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await onSave();
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      lastContentRef.current = content;
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error: any) {
      setSaveStatus("error");
      toast.error(error.message || "Failed to auto-save");
      
      // Retry after 5 seconds
      setTimeout(() => {
        if (autoSaveEnabled) {
          performSave();
        }
      }, 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [content, onSave, autoSaveEnabled]);

  // Set up auto-save on content change
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (content === lastContentRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, autoSaveInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, autoSaveEnabled, autoSaveInterval, performSave]);

  // Manual save trigger
  const triggerSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  return {
    saveStatus,
    lastSavedAt,
    triggerSave,
    isAutoSaveEnabled: autoSaveEnabled,
  };
}
