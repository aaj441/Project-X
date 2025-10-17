import { Check, AlertCircle, Loader2, Clock } from "lucide-react";
import { SaveStatus } from "~/hooks/useAutoSave";
import { formatDistanceToNow } from "date-fns";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: AutoSaveIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {status === "saving" && (
        <>
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-blue-600 font-medium">Saving...</span>
        </>
      )}

      {status === "saved" && lastSavedAt && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">
            Saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
          </span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-600 font-medium">Save failed</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-red-600 underline hover:text-red-700"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
