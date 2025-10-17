import { useEffect, useState, useCallback } from "react";
import { useTRPC, useTRPCClient } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useUXProfileStore, useProfileSettings } from "~/stores/uxProfileStore";
import { useQuery } from "@tanstack/react-query";
import { Bot, X, Minimize2, Maximize2, Sparkles, Clock, Heart, Lightbulb, Zap } from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";

type CopilotMessage = {
  id: string;
  message: string;
  tone: "encouraging" | "supportive" | "celebratory";
  timestamp: number;
};

type ADHDCopilotProps = {
  projectId?: number;
  currentContent?: string;
  wordsWritten?: number;
  sessionStartTime?: number;
};

export function ADHDCopilot({
  projectId,
  currentContent = "",
  wordsWritten = 0,
  sessionStartTime,
}: ADHDCopilotProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const activeProfile = useUXProfileStore((state) => state.activeProfile);
  const settings = useProfileSettings();

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [copilotCharacter, setCopilotCharacter] = useState<"robot" | "star" | "heart" | "lightning">("robot");

  // Only show for ADHD-friendly profile or if explicitly enabled
  const shouldShow = activeProfile === "adhd-friendly" || settings.encouragementMessages;

  // Calculate session duration
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
      setSessionDuration(duration);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Show copilot after a short delay
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        fetchEncouragement("writing_session_start");
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  // Periodic check-ins
  useEffect(() => {
    if (!isVisible || !shouldShow) return;

    const checkInInterval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;
      
      // Check in every 15 minutes
      if (timeSinceLastInteraction > 15 * 60 * 1000) {
        fetchEncouragement("general_check_in");
      }

      // Break reminder after 25 minutes (Pomodoro-style)
      if (sessionDuration > 0 && sessionDuration % 25 === 0) {
        fetchEncouragement("break_reminder");
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInInterval);
  }, [isVisible, shouldShow, lastInteractionTime, sessionDuration]);

  // Detect if user is stuck (no activity for 5 minutes while editor is open)
  useEffect(() => {
    if (!isVisible || !shouldShow || !currentContent) return;

    const stuckTimer = setTimeout(() => {
      fetchRoadblockAnalysis();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(stuckTimer);
  }, [currentContent, isVisible, shouldShow]);

  const fetchEncouragement = useCallback(
    async (context: "writing_session_start" | "writing_session_active" | "distraction_detected" | "milestone_reached" | "stuck_detected" | "break_reminder" | "general_check_in") => {
      if (!token) return;

      setIsThinking(true);
      try {
        const result = await trpcClient.ai.adhd.getEncouragement.query({
          authToken: token,
          context,
          sessionDuration,
          wordsWritten,
        });

        const newMessage: CopilotMessage = {
          id: `msg-${Date.now()}`,
          message: result.message,
          tone: result.tone,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setLastInteractionTime(Date.now());

        // Play appropriate sound
        if (result.tone === "celebratory") {
          soundEffects.achievementUnlock();
        } else {
          soundEffects.click();
        }

        // Auto-minimize after showing message for a while
        setTimeout(() => {
          if (!isMinimized) {
            setIsMinimized(true);
          }
        }, 10000);
      } catch (error) {
        console.error("Failed to fetch encouragement:", error);
      } finally {
        setIsThinking(false);
      }
    },
    [token, sessionDuration, wordsWritten, isMinimized, trpcClient]
  );

  const fetchRoadblockAnalysis = useCallback(async () => {
    if (!token) return;

    setIsThinking(true);
    try {
      const result = await trpcClient.ai.adhd.analyzeRoadblock.query({
        authToken: token,
        projectId,
        currentContent: currentContent.slice(-500),
        timeStuck: 5,
      });

      const newMessage: CopilotMessage = {
        id: `msg-${Date.now()}`,
        message: `${result.analysis}\n\nTry:\n${result.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        tone: "supportive",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setLastInteractionTime(Date.now());
      setIsMinimized(false); // Show the message
      soundEffects.click();
    } catch (error) {
      console.error("Failed to analyze roadblock:", error);
    } finally {
      setIsThinking(false);
    }
  }, [token, projectId, currentContent, trpcClient]);

  const handleClose = () => {
    setIsVisible(false);
    soundEffects.click();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    soundEffects.click();
  };

  const handleCycleCharacter = () => {
    const characters: Array<"robot" | "star" | "heart" | "lightning"> = ["robot", "star", "heart", "lightning"];
    const currentIndex = characters.indexOf(copilotCharacter);
    const nextIndex = (currentIndex + 1) % characters.length;
    setCopilotCharacter(characters[nextIndex]);
    soundEffects.click();
  };

  if (!shouldShow || !isVisible) return null;

  const characterIcons = {
    robot: Bot,
    star: Sparkles,
    heart: Heart,
    lightning: Zap,
  };

  const CharacterIcon = characterIcons[copilotCharacter];

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isMinimized ? "w-16 h-16" : "w-96"
      }`}
    >
      {isMinimized ? (
        // Minimized floating button
        <button
          onClick={handleMinimize}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all animate-bounce cursor-pointer group"
        >
          <CharacterIcon className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          {messages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-bold text-white">{messages.length}</span>
            </div>
          )}
        </button>
      ) : (
        // Expanded panel
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCycleCharacter}
                className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg hover:scale-110 transition-all"
              >
                <CharacterIcon className="w-5 h-5 text-white" />
              </button>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">ADHD Copilot</h3>
                <p className="text-xs text-gray-600">Your focus buddy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMinimize}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded transition"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-green-700" />
              <span className="text-green-800 font-medium">
                {sessionDuration} min
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3 h-3 text-green-700" />
              <span className="text-green-800 font-medium">
                {wordsWritten} words
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 max-h-80 overflow-y-auto space-y-3">
            {messages.length === 0 && !isThinking && (
              <div className="text-center py-8">
                <CharacterIcon className="w-12 h-12 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Hey {user?.name || "there"}! I'm here to help you stay focused. 💚
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3 ${
                  msg.tone === "celebratory"
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200"
                    : msg.tone === "supportive"
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
                    : "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200"
                }`}
              >
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </p>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-t border-green-200">
            <div className="flex space-x-2">
              <button
                onClick={() => fetchEncouragement("general_check_in")}
                disabled={isThinking}
                className="flex-1 px-3 py-2 bg-white border-2 border-green-200 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-50 transition disabled:opacity-50"
              >
                Check In
              </button>
              <button
                onClick={fetchRoadblockAnalysis}
                disabled={isThinking}
                className="flex-1 px-3 py-2 bg-white border-2 border-green-200 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-50 transition disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <Lightbulb className="w-3 h-3" />
                <span>I'm Stuck</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
