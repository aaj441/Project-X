import { useEffect, useState } from "react";
import { useUXProfileStore } from "~/stores/uxProfileStore";
import { X, Timer, Pause, Play, RotateCcw } from "lucide-react";

interface ZenModeOverlayProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle: string;
  onExit: () => void;
}

const AFFIRMATIONS = [
  "You're making great progress",
  "Every word counts",
  "Your creativity is flowing",
  "Take your time, breathe",
  "You've got this",
  "Focus on one sentence at a time",
  "Your story matters",
  "Writing is a journey",
  "Be kind to yourself",
  "Progress, not perfection",
];

export function ZenModeOverlay({
  content,
  onContentChange,
  chapterTitle,
  onExit,
}: ZenModeOverlayProps) {
  const zenModeActive = useUXProfileStore((state) => state.zenModeActive);
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);

  useEffect(() => {
    if (!zenModeActive) return;

    // Rotate affirmations every 30 seconds
    const affirmationInterval = setInterval(() => {
      const randomAffirmation =
        AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
      setCurrentAffirmation(randomAffirmation);
      setShowAffirmation(true);
      setTimeout(() => setShowAffirmation(false), 5000);
    }, 30000);

    // Show initial affirmation
    const randomAffirmation =
      AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setCurrentAffirmation(randomAffirmation);
    setShowAffirmation(true);
    setTimeout(() => setShowAffirmation(false), 5000);

    return () => clearInterval(affirmationInterval);
  }, [zenModeActive]);

  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      if (timerSeconds > 0) {
        setTimerSeconds(timerSeconds - 1);
      } else if (timerMinutes > 0) {
        setTimerMinutes(timerMinutes - 1);
        setTimerSeconds(59);
      } else {
        setTimerActive(false);
        // Timer completed - show celebration
        setCurrentAffirmation("🎉 Focus session complete! Great work!");
        setShowAffirmation(true);
        setTimeout(() => setShowAffirmation(false), 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds]);

  const handleResetTimer = () => {
    setTimerMinutes(25);
    setTimerSeconds(0);
    setTimerActive(false);
  };

  if (!zenModeActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated Background - Stardust */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-float opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Slow Swirls */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative h-full flex flex-col items-center justify-center p-8">
        {/* Exit Button */}
        <button
          onClick={onExit}
          className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Focus Timer */}
        <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white">
          <div className="flex items-center space-x-4">
            <Timer className="w-6 h-6" />
            <div className="text-3xl font-bold font-mono">
              {String(timerMinutes).padStart(2, "0")}:
              {String(timerSeconds).padStart(2, "0")}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              >
                {timerActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleResetTimer}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Title */}
        <h2 className="text-3xl font-bold text-white mb-8 text-center opacity-80">
          {chapterTitle}
        </h2>

        {/* Writing Area */}
        <div className="w-full max-w-4xl">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-[60vh] bg-white/10 backdrop-blur-md text-white text-lg p-8 rounded-2xl border-2 border-white/20 focus:border-white/40 focus:outline-none resize-none placeholder-white/50"
            placeholder="Let your thoughts flow... Focus on one sentence at a time."
          />
        </div>

        {/* Word Count */}
        <div className="mt-6 text-white/60 text-sm">
          {content.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      {/* Affirmation Display */}
      {showAffirmation && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 animate-fade-in">
          <div className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full border-2 border-white/30 shadow-2xl">
            <p className="text-lg font-medium text-center">{currentAffirmation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
