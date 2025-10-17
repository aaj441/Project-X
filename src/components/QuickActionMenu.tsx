import { useState } from "react";
import { Plus, Shuffle, Play, FileDown, X, Menu, Volume2, VolumeX } from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";
import { useModuleStore } from "~/stores/moduleStore";

type QuickActionMenuProps = {
  onAddModule?: () => void;
  onShuffleIdeas?: () => void;
  onRunWorkflow?: () => void;
  onExport?: () => void;
};

export function QuickActionMenu({
  onAddModule,
  onShuffleIdeas,
  onRunWorkflow,
  onExport,
}: QuickActionMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const soundEnabled = useModuleStore((state) => state.soundEnabled);
  const toggleSound = useModuleStore((state) => state.toggleSound);

  const actions = [
    {
      icon: Plus,
      label: "Add Module",
      onClick: () => {
        soundEffects.click();
        onAddModule?.();
      },
      color: "from-indigo-600 to-purple-600",
    },
    {
      icon: Shuffle,
      label: "Shuffle Ideas",
      onClick: () => {
        soundEffects.shuffle();
        onShuffleIdeas?.();
      },
      color: "from-purple-600 to-pink-600",
    },
    {
      icon: Play,
      label: "Run Workflow",
      onClick: () => {
        soundEffects.launch();
        onRunWorkflow?.();
      },
      color: "from-green-600 to-emerald-600",
    },
    {
      icon: FileDown,
      label: "Export",
      onClick: () => {
        soundEffects.export();
        onExport?.();
      },
      color: "from-orange-600 to-red-600",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action buttons - shown when expanded */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {/* Sound toggle */}
          <button
            onClick={() => {
              toggleSound();
              soundEffects.click();
            }}
            className="group flex items-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-xl shadow-lg transition-all border-2 border-gray-200 dark:border-gray-700"
            title={soundEnabled ? "Disable sound" : "Enable sound"}
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Sound
            </span>
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`group flex items-center gap-3 bg-gradient-to-r ${action.color} text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-semibold whitespace-nowrap">
                  {action.label}
                </span>
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Main toggle button */}
      <button
        onClick={() => {
          soundEffects.click();
          setIsExpanded(!isExpanded);
        }}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 flex items-center justify-center ${
          isExpanded ? "rotate-45" : ""
        }`}
      >
        {isExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );
}
