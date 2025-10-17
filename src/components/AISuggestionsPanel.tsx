import { Sparkles, Lightbulb, X, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

type Suggestion = {
  id: number;
  text: string;
  type: "continuation" | "improvement" | "alternative";
  timestamp: number;
};

type AISuggestionsPanelProps = {
  suggestions: Suggestion[];
  isLoading: boolean;
  onInsertSuggestion: (text: string) => void;
  onClose: () => void;
};

export function AISuggestionsPanel({
  suggestions,
  isLoading,
  onInsertSuggestion,
  onClose,
}: AISuggestionsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new suggestions arrive
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [suggestions]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden flex flex-col h-full">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Suggestions</h3>
            <p className="text-xs text-gray-600">Real-time writing help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={panelRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoading && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Generating suggestions...</p>
            </div>
          </div>
        )}

        {suggestions.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-xs">
              <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">
                AI suggestions will appear here as you write. Keep typing to get real-time help!
              </p>
            </div>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100 hover:border-purple-300 transition-all cursor-pointer group"
            onClick={() => onInsertSuggestion(suggestion.text)}
          >
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {suggestion.text}
                </p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-purple-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertSuggestion(suggestion.text);
                }}
              >
                <Plus className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>
        ))}

        {isLoading && suggestions.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-purple-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-t border-purple-200">
        <p className="text-xs text-gray-600 flex items-center">
          <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
          Click any suggestion to insert it into your text
        </p>
      </div>
    </div>
  );
}
