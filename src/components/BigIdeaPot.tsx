import { useState, useCallback, useRef } from "react";
import { useTRPC, useTRPCClient } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Plus,
  Trash2,
  Wand2,
  FileText,
  ImageIcon,
  Mic,
  Lightbulb,
  BookOpen,
  Palette,
  TrendingUp,
  X,
} from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";
import toast from "react-hot-toast";

type Ingredient = {
  id: string;
  type: "text" | "keyword" | "image_description" | "voice_transcript";
  content: string;
  timestamp: number;
};

type OutputSpark = {
  id: string;
  type: "story" | "chapter" | "cover" | "marketing";
  content: any;
  position: { x: number; y: number };
  timestamp: number;
};

export function BigIdeaPot() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const token = useAuthStore((state) => state.token);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientText, setNewIngredientText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStirring, setIsStirring] = useState(false);
  const [sparks, setSparks] = useState<OutputSpark[]>([]);
  const [selectedSpark, setSelectedSpark] = useState<OutputSpark | null>(null);
  const potRef = useRef<HTMLDivElement>(null);

  const processIdeaPotMutation = useMutation(
    trpc.ai.brainstorm.processIdeaPot.mutationOptions({
      onSuccess: (data) => {
        setIsStirring(false);
        generateSparks(data.outputs);
        soundEffects.achievementUnlock();
        toast.success("Ideas generated! Click the sparks to see them!");
      },
      onError: (error) => {
        setIsStirring(false);
        toast.error(error.message || "Failed to process ideas");
      },
    })
  );

  const addIngredient = useCallback((type: Ingredient["type"], content: string) => {
    if (!content.trim()) return;

    const newIngredient: Ingredient = {
      id: `ing-${Date.now()}-${Math.random()}`,
      type,
      content: content.trim(),
      timestamp: Date.now(),
    };

    setIngredients((prev) => [...prev, newIngredient]);
    setNewIngredientText("");
    soundEffects.click();
    toast.success("Ingredient added to the pot!");
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    soundEffects.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const text = e.dataTransfer.getData("text/plain");
    if (text) {
      addIngredient("text", text);
    }

    // Handle file drops (images, audio)
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        // In a real implementation, we'd upload the image and get a description
        addIngredient("image_description", `[Image: ${file.name}]`);
        toast.info("Image support coming soon! For now, describe your image as text.");
      } else if (file.type.startsWith("audio/")) {
        // In a real implementation, we'd transcribe the audio
        addIngredient("voice_transcript", `[Voice note: ${file.name}]`);
        toast.info("Voice note support coming soon! For now, type your ideas as text.");
      }
    });
  }, [addIngredient]);

  const handleStirPot = useCallback(() => {
    if (ingredients.length === 0) {
      toast.error("Add some ingredients first!");
      return;
    }

    if (!token) {
      toast.error("Please log in to use the Idea Pot");
      return;
    }

    setIsStirring(true);
    setSparks([]); // Clear previous sparks

    soundEffects.shuffle();

    processIdeaPotMutation.mutate({
      authToken: token,
      ingredients: ingredients.map((ing) => ({
        type: ing.type,
        content: ing.content,
      })),
      outputType: "all",
    });
  }, [ingredients, token, processIdeaPotMutation]);

  const generateSparks = useCallback((outputs: any) => {
    const newSparks: OutputSpark[] = [];

    // Generate sparks for story directions
    if (outputs.storyDirections) {
      outputs.storyDirections.forEach((story: any, idx: number) => {
        newSparks.push({
          id: `spark-story-${idx}`,
          type: "story",
          content: story,
          position: getRandomPosition(),
          timestamp: Date.now() + idx * 100,
        });
      });
    }

    // Generate sparks for chapter outline
    if (outputs.chapterOutline) {
      newSparks.push({
        id: `spark-chapter`,
        type: "chapter",
        content: outputs.chapterOutline,
        position: getRandomPosition(),
        timestamp: Date.now() + newSparks.length * 100,
      });
    }

    // Generate sparks for cover concepts
    if (outputs.coverConcepts) {
      outputs.coverConcepts.forEach((cover: any, idx: number) => {
        newSparks.push({
          id: `spark-cover-${idx}`,
          type: "cover",
          content: cover,
          position: getRandomPosition(),
          timestamp: Date.now() + newSparks.length * 100,
        });
      });
    }

    // Generate sparks for marketing angles
    if (outputs.marketingAngles) {
      outputs.marketingAngles.forEach((marketing: any, idx: number) => {
        newSparks.push({
          id: `spark-marketing-${idx}`,
          type: "marketing",
          content: marketing,
          position: getRandomPosition(),
          timestamp: Date.now() + newSparks.length * 100,
        });
      });
    }

    setSparks(newSparks);
  }, []);

  const getRandomPosition = () => {
    return {
      x: 20 + Math.random() * 60, // 20-80% from left
      y: 10 + Math.random() * 40, // 10-50% from top
    };
  };

  const handleSparkClick = useCallback((spark: OutputSpark) => {
    setSelectedSpark(spark);
    soundEffects.click();
  }, []);

  const getSparkIcon = (type: OutputSpark["type"]) => {
    switch (type) {
      case "story":
        return Lightbulb;
      case "chapter":
        return BookOpen;
      case "cover":
        return Palette;
      case "marketing":
        return TrendingUp;
    }
  };

  const getSparkColor = (type: OutputSpark["type"]) => {
    switch (type) {
      case "story":
        return "from-yellow-400 to-orange-500";
      case "chapter":
        return "from-blue-400 to-indigo-500";
      case "cover":
        return "from-pink-400 to-purple-500";
      case "marketing":
        return "from-green-400 to-emerald-500";
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl shadow-2xl border-4 border-purple-200 p-8 overflow-hidden">
      {/* Background sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-300 rounded-full animate-float opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center space-x-3 mb-4">
          <Wand2 className="w-10 h-10 text-purple-600 animate-pulse" />
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Big Idea Pot
          </h2>
          <Wand2 className="w-10 h-10 text-purple-600 animate-pulse" />
        </div>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Toss in your random ideas, keywords, voice notes, and doodles. Watch the magic happen! ✨
        </p>
      </div>

      {/* Input Area */}
      <div className="relative z-10 mb-6">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newIngredientText}
            onChange={(e) => setNewIngredientText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addIngredient("text", newIngredientText);
              }
            }}
            placeholder="Type an idea, keyword, or concept..."
            className="flex-1 px-6 py-4 bg-white border-3 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 text-lg placeholder-gray-400"
          />
          <button
            onClick={() => addIngredient("text", newIngredientText)}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600 flex items-center justify-center space-x-2">
          <ImageIcon className="w-4 h-4" />
          <span>Or drag and drop text, images, or files here</span>
          <Mic className="w-4 h-4" />
        </p>
      </div>

      {/* The Cauldron / Pot */}
      <div
        ref={potRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-8 min-h-96 transition-all ${
          isDragOver ? "scale-105 shadow-2xl ring-4 ring-purple-400" : "shadow-xl"
        } ${isStirring ? "animate-pulse" : ""}`}
      >
        {/* Bubbling/stirring animation */}
        {isStirring && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-white rounded-full animate-bubble opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: "-20px",
                  animationDuration: `${1 + Math.random() * 2}s`,
                  animationDelay: `${Math.random() * 1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Ingredients in the pot */}
        <div className="relative z-10 space-y-3">
          {ingredients.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-20 h-20 text-white/50 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold mb-2">
                The pot is empty!
              </p>
              <p className="text-white/80">
                Add some ingredients above or drag and drop ideas here
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold text-lg">
                  {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} in the pot
                </p>
                <button
                  onClick={() => setIngredients([])}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30 group hover:bg-white/30 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                          {ing.type.replace("_", " ")}
                        </span>
                        <p className="text-white mt-1 text-sm leading-relaxed">
                          {ing.content}
                        </p>
                      </div>
                      <button
                        onClick={() => removeIngredient(ing.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-white/20 rounded"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stir Button */}
        {ingredients.length > 0 && (
          <div className="relative z-10 mt-8 text-center">
            <button
              onClick={handleStirPot}
              disabled={isStirring}
              className="px-12 py-6 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:bg-purple-50 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <Wand2 className={`w-7 h-7 ${isStirring ? "animate-spin" : ""}`} />
              <span>{isStirring ? "Stirring the magic..." : "Stir the Pot!"}</span>
              <Sparkles className="w-7 h-7" />
            </button>
          </div>
        )}
      </div>

      {/* Flying Sparks (Generated Outputs) */}
      {sparks.length > 0 && (
        <div className="relative mt-8 min-h-64">
          <h3 className="text-2xl font-bold text-center text-purple-900 mb-6">
            ✨ Generated Ideas ✨
          </h3>
          <div className="relative h-64">
            {sparks.map((spark) => {
              const Icon = getSparkIcon(spark.type);
              return (
                <button
                  key={spark.id}
                  onClick={() => handleSparkClick(spark)}
                  className={`absolute bg-gradient-to-r ${getSparkColor(
                    spark.type
                  )} text-white p-4 rounded-xl shadow-lg hover:scale-110 transition-all animate-float cursor-pointer`}
                  style={{
                    left: `${spark.position.x}%`,
                    top: `${spark.position.y}%`,
                    animationDelay: `${(spark.timestamp - Date.now()) / 1000}s`,
                  }}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Spark Detail Modal */}
      {selectedSpark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`bg-gradient-to-r ${getSparkColor(selectedSpark.type)} p-3 rounded-xl`}>
                  {(() => {
                    const Icon = getSparkIcon(selectedSpark.type);
                    return <Icon className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedSpark.type === "story" && "Story Direction"}
                  {selectedSpark.type === "chapter" && "Chapter Outline"}
                  {selectedSpark.type === "cover" && "Cover Concept"}
                  {selectedSpark.type === "marketing" && "Marketing Angle"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSpark(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedSpark.type === "story" && (
                <>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {selectedSpark.content.title}
                    </h4>
                    <p className="text-gray-700">{selectedSpark.content.logline}</p>
                  </div>
                  {selectedSpark.content.themes && (
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Themes:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedSpark.content.themes.map((theme: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSpark.content.hook && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Unique Hook:</h5>
                      <p className="text-gray-700">{selectedSpark.content.hook}</p>
                    </div>
                  )}
                </>
              )}

              {selectedSpark.type === "chapter" && (
                <>
                  {selectedSpark.content.overallArc && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Overall Arc:</h5>
                      <p className="text-gray-700">{selectedSpark.content.overallArc}</p>
                    </div>
                  )}
                  {selectedSpark.content.chapters && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-800">Chapters:</h5>
                      {selectedSpark.content.chapters.map((chapter: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start space-x-3">
                            <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {chapter.number}
                            </span>
                            <div className="flex-1">
                              <h6 className="font-bold text-gray-900 mb-1">{chapter.title}</h6>
                              <p className="text-sm text-gray-700">{chapter.synopsis}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedSpark.type === "cover" && (
                <>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {selectedSpark.content.name}
                    </h4>
                    <p className="text-gray-700">{selectedSpark.content.style}</p>
                  </div>
                  {selectedSpark.content.colors && (
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Color Palette:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedSpark.content.colors.map((color: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSpark.content.imagery && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-pink-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Key Imagery:</h5>
                      <p className="text-gray-700">{selectedSpark.content.imagery}</p>
                    </div>
                  )}
                  {selectedSpark.content.mood && (
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-1">Mood:</h5>
                      <p className="text-gray-700">{selectedSpark.content.mood}</p>
                    </div>
                  )}
                </>
              )}

              {selectedSpark.type === "marketing" && (
                <>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {selectedSpark.content.angle}
                    </h4>
                    <p className="text-gray-700">{selectedSpark.content.audience}</p>
                  </div>
                  {selectedSpark.content.hook && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Emotional Hook:</h5>
                      <p className="text-gray-700">{selectedSpark.content.hook}</p>
                    </div>
                  )}
                  {selectedSpark.content.tagline && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Tagline:</h5>
                      <p className="text-lg font-bold text-gray-900">
                        "{selectedSpark.content.tagline}"
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedSpark.content, null, 2));
                  toast.success("Copied to clipboard!");
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Copy Details
              </button>
              <button
                onClick={() => setSelectedSpark(null)}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${getSparkColor(
                  selectedSpark.type
                )} text-white rounded-xl font-bold hover:opacity-90 transition`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
