import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Heart, Check, Sparkles, ZoomIn, Loader2, RefreshCw } from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";

interface Cover {
  id: string;
  url: string;
  prompt: string;
  isFavorite: boolean;
  isSelected: boolean;
}

interface MultiCoverGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCover: (coverUrl: string) => void;
  onGenerateCovers: (prompt: string, count: number) => Promise<string[]>;
  isGenerating: boolean;
  projectTitle: string;
  genre: string;
}

export function MultiCoverGallery({
  isOpen,
  onClose,
  onSelectCover,
  onGenerateCovers,
  isGenerating,
  projectTitle,
  genre,
}: MultiCoverGalleryProps) {
  const [covers, setCovers] = useState<Cover[]>([]);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [zoomedCoverId, setZoomedCoverId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [showColorBurst, setShowColorBurst] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const coverUrls = await onGenerateCovers(prompt, 5);
      const newCovers: Cover[] = coverUrls.map((url, index) => ({
        id: `cover-${Date.now()}-${index}`,
        url,
        prompt,
        isFavorite: false,
        isSelected: false,
      }));
      setCovers(newCovers);
      soundEffects.success();
    } catch (error) {
      console.error("Failed to generate covers:", error);
    }
  };

  const handleToggleFavorite = (coverId: string) => {
    setCovers((prev) =>
      prev.map((cover) =>
        cover.id === coverId
          ? { ...cover, isFavorite: !cover.isFavorite }
          : cover
      )
    );
    soundEffects.click();
  };

  const handleSelectCover = (cover: Cover) => {
    setSelectedCoverId(cover.id);
    setShowColorBurst(true);
    soundEffects.success();
    
    setTimeout(() => {
      onSelectCover(cover.url);
      setShowColorBurst(false);
    }, 1500);
  };

  const handleZoom = (coverId: string) => {
    setZoomedCoverId(zoomedCoverId === coverId ? null : coverId);
    soundEffects.click();
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Color Burst Effect */}
                {showColorBurst && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 rounded-full animate-vapor-trail"
                        style={{
                          left: "50%",
                          top: "50%",
                          background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                          transform: `translate(-50%, -50%) translate(${
                            Math.cos((i / 30) * Math.PI * 2) * 200
                          }px, ${Math.sin((i / 30) * Math.PI * 2) * 200}px)`,
                          animationDelay: `${i * 0.02}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-pink-600 to-purple-600 p-3 rounded-xl shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Cover Art Gallery
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Walk through your AI-generated covers
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

                {/* Generation Input */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-purple-100">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    ✨ Describe your ideal cover design
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`e.g., ${projectTitle} in ${genre} style with vibrant colors...`}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          <span>Generate 5</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We'll generate 5 unique cover variations for you to choose from
                  </p>
                </div>

                {/* Gallery Grid */}
                {covers.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {covers.map((cover) => (
                      <div
                        key={cover.id}
                        className={`relative group ${
                          zoomedCoverId === cover.id ? "col-span-2 row-span-2" : ""
                        }`}
                      >
                        <div
                          className={`relative rounded-xl overflow-hidden shadow-lg transition-all ${
                            selectedCoverId === cover.id
                              ? "ring-4 ring-green-500 scale-105"
                              : "hover:scale-105"
                          }`}
                        >
                          <img
                            src={cover.url}
                            alt={`Cover option ${cover.id}`}
                            className="w-full h-auto"
                          />
                          
                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleZoom(cover.id)}
                                className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"
                              >
                                <ZoomIn className="w-5 h-5 text-gray-900" />
                              </button>
                              <button
                                onClick={() => handleToggleFavorite(cover.id)}
                                className={`p-3 rounded-full shadow-lg transition ${
                                  cover.isFavorite
                                    ? "bg-red-500 text-white"
                                    : "bg-white text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                <Heart
                                  className="w-5 h-5"
                                  fill={cover.isFavorite ? "currentColor" : "none"}
                                />
                              </button>
                              <button
                                onClick={() => handleSelectCover(cover)}
                                className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Favorite Badge */}
                          {cover.isFavorite && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                              <Heart className="w-4 h-4" fill="currentColor" />
                            </div>
                          )}

                          {/* Selected Badge */}
                          {selectedCoverId === cover.id && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full shadow-lg font-bold text-sm flex items-center space-x-1">
                              <Check className="w-4 h-4" />
                              <span>Selected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200">
                    <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Ready to Generate Covers?
                    </p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Enter a description above and we'll create 5 stunning cover options for you to explore and choose from
                    </p>
                  </div>
                )}

                {/* Info Footer */}
                <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-700 flex items-start">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Gallery Tips:</strong> Hover over any cover to zoom, favorite, or select it. Your selected cover will shoot color rays across the gallery! You can generate multiple batches to find the perfect design.
                    </span>
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
