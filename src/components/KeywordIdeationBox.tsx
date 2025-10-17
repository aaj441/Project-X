import { useState } from "react";
import { Search, Shuffle, Sparkles, Rocket } from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";

type KeywordIdeationBoxProps = {
  onSearch?: (keywords: string) => void;
  onShuffle?: () => void;
};

export function KeywordIdeationBox({ onSearch, onShuffle }: KeywordIdeationBoxProps) {
  const [keywords, setKeywords] = useState("");
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffle = () => {
    soundEffects.shuffle();
    setIsShuffling(true);
    
    // Trigger shuffle animation
    setTimeout(() => {
      setIsShuffling(false);
      onShuffle?.();
    }, 600);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.click();
    onSearch?.(keywords);
  };

  return (
    <div className="sticky top-16 z-40 bg-white dark:bg-gray-900 border-b-2 border-gray-100 dark:border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to find trending module ideas..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-200 placeholder-gray-400 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleShuffle}
            disabled={isShuffling}
            className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group overflow-hidden"
          >
            {isShuffling && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Rocket className="w-6 h-6 animate-rocket-launch" />
                <Rocket className="w-6 h-6 animate-rocket-launch absolute" style={{ animationDelay: "0.2s" }} />
                <Rocket className="w-6 h-6 animate-rocket-launch absolute" style={{ animationDelay: "0.4s" }} />
              </div>
            )}
            <Shuffle className={`w-5 h-5 transition-transform ${isShuffling ? "opacity-0" : "group-hover:rotate-180"}`} />
            <span className={isShuffling ? "opacity-0" : ""}>Shuffle Ideas</span>
            <Sparkles className={`w-4 h-4 ${isShuffling ? "opacity-0" : ""}`} />
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Search
          </button>
        </form>

        {/* Quick suggestions */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick:</span>
          {["Content Creation", "Analytics Dashboard", "HR Management", "Design System"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setKeywords(suggestion);
                soundEffects.click();
              }}
              className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
