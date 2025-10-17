import { Sparkles, Wand2, Maximize2, X } from "lucide-react";
import { useState } from "react";

type InlineAIToolbarProps = {
  position: { top: number; left: number };
  selectedText: string;
  onRewrite: (instruction: string) => void;
  onExpand: (type?: "detail" | "examples" | "dialogue" | "description") => void;
  onClose: () => void;
};

export function InlineAIToolbar({
  position,
  selectedText,
  onRewrite,
  onExpand,
  onClose,
}: InlineAIToolbarProps) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [showExpandMenu, setShowExpandMenu] = useState(false);

  const rewriteOptions = [
    { label: "Make it more concise", instruction: "make this more concise and to the point" },
    { label: "Make it more descriptive", instruction: "make this more descriptive and detailed" },
    { label: "Change tone to formal", instruction: "rewrite this in a more formal tone" },
    { label: "Change tone to casual", instruction: "rewrite this in a more casual, conversational tone" },
    { label: "Simplify language", instruction: "simplify the language and make it easier to understand" },
    { label: "Make it more engaging", instruction: "make this more engaging and compelling" },
  ];

  const expandOptions = [
    { label: "Add more detail", type: "detail" as const },
    { label: "Add examples", type: "examples" as const },
    { label: "Add dialogue", type: "dialogue" as const },
    { label: "Add description", type: "description" as const },
  ];

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateY(-100%) translateY(-8px)",
      }}
    >
      {!showRewriteMenu && !showExpandMenu ? (
        <div className="flex items-center p-2 space-x-1">
          <button
            onClick={() => setShowRewriteMenu(true)}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-50 rounded-lg transition-all text-purple-600 font-semibold"
            title="Rewrite with AI"
          >
            <Wand2 className="w-4 h-4" />
            <span>Rewrite</span>
          </button>
          <button
            onClick={() => setShowExpandMenu(true)}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600 font-semibold"
            title="Expand with AI"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Expand</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showRewriteMenu ? (
        <div className="w-72">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-purple-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-gray-900">Rewrite Options</span>
            </div>
            <button
              onClick={() => setShowRewriteMenu(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {rewriteOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onRewrite(option.instruction);
                  setShowRewriteMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-lg transition-all text-gray-700 text-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-64">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-indigo-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Maximize2 className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-gray-900">Expand Options</span>
            </div>
            <button
              onClick={() => setShowExpandMenu(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            {expandOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onExpand(option.type);
                  setShowExpandMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 text-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
