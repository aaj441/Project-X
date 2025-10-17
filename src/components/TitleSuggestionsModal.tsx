import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Sparkles, TrendingUp, Award, Zap } from "lucide-react";

interface TitleSuggestion {
  title: string;
  rationale: string;
  marketability: "high" | "medium" | "low";
}

interface TitleSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: TitleSuggestion[];
  currentTitle: string;
  onSelectTitle: (title: string) => void;
  isLoading?: boolean;
}

export function TitleSuggestionsModal({
  isOpen,
  onClose,
  suggestions,
  currentTitle,
  onSelectTitle,
  isLoading = false,
}: TitleSuggestionsModalProps) {
  const getMarketabilityIcon = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return <Award className="w-5 h-5 text-green-600" />;
      case "medium":
        return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      case "low":
        return <Zap className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMarketabilityColor = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSelectTitle = (title: string) => {
    onSelectTitle(title);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        AI Title Suggestions
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Choose a compelling title that will capture readers' attention
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Current Title */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 mb-6 border-2 border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Current Title:</p>
                  <p className="text-lg font-bold text-gray-900">{currentTitle}</p>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">Generating creative titles...</p>
                  </div>
                )}

                {/* Suggestions List */}
                {!isLoading && suggestions.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="group relative bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100 hover:border-purple-300 transition-all cursor-pointer hover:shadow-lg"
                        onClick={() => handleSelectTitle(suggestion.title)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-bold text-purple-600">
                                Option {index + 1}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold border ${getMarketabilityColor(suggestion.marketability)} flex items-center space-x-1`}
                              >
                                {getMarketabilityIcon(suggestion.marketability)}
                                <span className="capitalize">{suggestion.marketability} Marketability</span>
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {suggestion.title}
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {suggestion.rationale}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTitle(suggestion.title);
                            }}
                          >
                            Use This Title
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200 mb-6">
                  <p className="text-sm text-gray-700 flex items-start">
                    <span className="text-purple-600 mr-2 text-lg">💡</span>
                    <span>
                      <strong>Pro Tip:</strong> A great title is memorable, searchable, and immediately communicates what your book is about. Consider your target audience and genre conventions when choosing.
                    </span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Keep Current Title
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
