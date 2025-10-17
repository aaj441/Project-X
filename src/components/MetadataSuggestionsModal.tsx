import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Sparkles, Tag, Users, BookOpen, CheckCircle } from "lucide-react";

interface MetadataSuggestion {
  genre: {
    primary: string;
    secondary?: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
  };
  bisacCategories: Array<{
    code: string;
    name: string;
    relevance: "primary" | "secondary" | "tertiary";
  }>;
  targetAudience: {
    ageRangeMin: number;
    ageRangeMax: number;
    reasoning: string;
    audienceDescription: string;
  };
  additionalTags: string[];
}

interface MetadataSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: MetadataSuggestion | null;
  currentMetadata: {
    genre?: string;
    categories?: any;
    ageRangeMin?: number;
    ageRangeMax?: number;
  };
  onApplySuggestions: (data: {
    genre?: string;
    categories?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
  }) => void;
  isLoading?: boolean;
}

export function MetadataSuggestionsModal({
  isOpen,
  onClose,
  suggestions,
  currentMetadata,
  onApplySuggestions,
  isLoading = false,
}: MetadataSuggestionsModalProps) {
  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const colors = {
      high: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[confidence];
  };

  const getRelevanceBadge = (relevance: "primary" | "secondary" | "tertiary") => {
    const colors = {
      primary: "bg-purple-100 text-purple-800 border-purple-200",
      secondary: "bg-blue-100 text-blue-800 border-blue-200",
      tertiary: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[relevance];
  };

  const handleApply = () => {
    if (!suggestions) return;

    const categoriesString = suggestions.bisacCategories
      .map((cat) => cat.code)
      .join(", ");

    onApplySuggestions({
      genre: suggestions.genre.primary,
      categories: categoriesString,
      ageRangeMin: suggestions.targetAudience.ageRangeMin,
      ageRangeMax: suggestions.targetAudience.ageRangeMax,
    });
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        AI Metadata Recommendations
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Optimize your book's discoverability with smart categorization
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

                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Analyzing your book and generating recommendations...</p>
                  </div>
                )}

                {/* Suggestions Content */}
                {!isLoading && suggestions && (
                  <div className="space-y-6">
                    {/* Genre Recommendations */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                        Genre Classification
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-600">Primary Genre</span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceBadge(suggestions.genre.confidence)}`}
                            >
                              {suggestions.genre.confidence} confidence
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900 mb-2">
                            {suggestions.genre.primary}
                          </p>
                          {suggestions.genre.secondary && (
                            <p className="text-sm text-gray-600 mb-2">
                              Secondary: <span className="font-semibold">{suggestions.genre.secondary}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {suggestions.genre.reasoning}
                          </p>
                        </div>
                        {currentMetadata.genre && (
                          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            <span className="font-semibold">Current:</span> {currentMetadata.genre}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BISAC Categories */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-blue-600" />
                        BISAC Categories
                      </h3>
                      <div className="space-y-3">
                        {suggestions.bisacCategories.map((category, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 border-2 border-blue-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-mono font-bold text-blue-600">
                                {category.code}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getRelevanceBadge(category.relevance)}`}
                              >
                                {category.relevance}
                              </span>
                            </div>
                            <p className="text-base font-semibold text-gray-900">
                              {category.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-green-600" />
                        Target Audience
                      </h3>
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200 space-y-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-600">Recommended Age Range</span>
                          <p className="text-2xl font-bold text-gray-900">
                            {suggestions.targetAudience.ageRangeMin} - {suggestions.targetAudience.ageRangeMax} years
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-600 block mb-1">Ideal Reader</span>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {suggestions.targetAudience.audienceDescription}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-600 block mb-1">Reasoning</span>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {suggestions.targetAudience.reasoning}
                          </p>
                        </div>
                        {(currentMetadata.ageRangeMin || currentMetadata.ageRangeMax) && (
                          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                            <span className="font-semibold">Current:</span> {currentMetadata.ageRangeMin || "?"} - {currentMetadata.ageRangeMax || "?"} years
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Tags */}
                    {suggestions.additionalTags.length > 0 && (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          📌 Additional Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.additionalTags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 border-2 border-orange-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <p className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-600 mr-2 text-lg">💡</span>
                        <span>
                          <strong>Pro Tip:</strong> Accurate metadata helps readers discover your book through search and browse. These AI recommendations are based on your content and industry standards.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isLoading && suggestions && (
                  <div className="flex space-x-3 pt-6">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Keep Current Metadata
                    </button>
                    <button
                      onClick={handleApply}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Apply Recommendations</span>
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
