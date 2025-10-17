import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, Waves, TreePine, Coffee, Cloud, X } from "lucide-react";
import { ambientSounds } from "~/utils/soundEffects";
import { useModuleStore } from "~/stores/moduleStore";

interface AmbientSound {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    name: "Gentle Rain",
    icon: Cloud,
    color: "from-blue-400 to-cyan-500",
    description: "Soft rainfall for deep focus",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    icon: Waves,
    color: "from-cyan-400 to-blue-600",
    description: "Calming ocean sounds",
  },
  {
    id: "forest",
    name: "Forest Ambience",
    icon: TreePine,
    color: "from-green-400 to-emerald-600",
    description: "Birds and rustling leaves",
  },
  {
    id: "cafe",
    name: "Coffee Shop",
    icon: Coffee,
    color: "from-amber-400 to-orange-600",
    description: "Bustling cafe atmosphere",
  },
];

interface StudioSoundBoardProps {
  compact?: boolean;
}

export function StudioSoundBoard({ compact = false }: StudioSoundBoardProps) {
  const soundEnabled = useModuleStore((state) => state.soundEnabled);
  const toggleSound = useModuleStore((state) => state.toggleSound);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [showWaveAnimation, setShowWaveAnimation] = useState(false);

  useEffect(() => {
    // Check if there's a currently playing ambient track
    const currentTrack = ambientSounds.getCurrentTrack();
    if (currentTrack) {
      setActiveSound(currentTrack);
      setShowWaveAnimation(true);
    }
  }, []);

  const handleSoundSelect = (soundId: string) => {
    if (activeSound === soundId) {
      // Stop current sound
      ambientSounds.stop();
      setActiveSound(null);
      setShowWaveAnimation(false);
    } else {
      // Play new sound
      ambientSounds.play(soundId, volume);
      setActiveSound(soundId);
      setShowWaveAnimation(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (activeSound) {
      // Restart with new volume
      ambientSounds.play(activeSound, newVolume);
    }
  };

  const handleStopAll = () => {
    ambientSounds.stop();
    setActiveSound(null);
    setShowWaveAnimation(false);
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-gray-900 text-sm">Ambient Sounds</span>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg hover:bg-indigo-100 transition"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AMBIENT_SOUNDS.slice(0, 4).map((sound) => {
            const Icon = sound.icon;
            return (
              <button
                key={sound.id}
                onClick={() => handleSoundSelect(sound.id)}
                disabled={!soundEnabled}
                className={`p-3 rounded-xl transition-all ${
                  activeSound === sound.id
                    ? `bg-gradient-to-br ${sound.color} text-white shadow-lg scale-105`
                    : "bg-white hover:bg-gray-50 text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className="w-5 h-5 mx-auto" />
                <div className="text-xs mt-1 font-medium">{sound.name.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-indigo-200 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
            <Music className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Studio Sound Board</h2>
            <p className="text-sm text-gray-600">Set your creative ambience</p>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className={`p-3 rounded-xl transition-all ${
            soundEnabled
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Wave Animation */}
      {showWaveAnimation && activeSound && (
        <div className="mb-6 bg-white rounded-xl p-4 border-2 border-indigo-200">
          <div className="flex items-center justify-center space-x-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
          <div className="text-center mt-3">
            <span className="text-sm font-semibold text-gray-700">
              Now Playing: {AMBIENT_SOUNDS.find((s) => s.id === activeSound)?.name}
            </span>
          </div>
        </div>
      )}

      {/* Sound Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {AMBIENT_SOUNDS.map((sound) => {
          const Icon = sound.icon;
          const isActive = activeSound === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              disabled={!soundEnabled}
              className={`group relative p-6 rounded-2xl transition-all ${
                isActive
                  ? `bg-gradient-to-br ${sound.color} text-white shadow-2xl scale-105`
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:shadow-lg"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex flex-col items-center space-y-3">
                <Icon className={`w-10 h-10 ${isActive ? "animate-pulse" : ""}`} />
                <div className="text-center">
                  <div className="font-bold text-sm mb-1">{sound.name}</div>
                  <div className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                    {sound.description}
                  </div>
                </div>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Volume Control */}
      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
        <div className="flex items-center space-x-4">
          <Volume2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            disabled={!soundEnabled || !activeSound}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <span className="text-sm font-semibold text-gray-700 w-12 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Stop All Button */}
      {activeSound && (
        <button
          onClick={handleStopAll}
          className="w-full mt-4 p-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center space-x-2"
        >
          <X className="w-5 h-5" />
          <span>Stop All Sounds</span>
        </button>
      )}

      {/* Info */}
      <div className="mt-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 border-2 border-indigo-200">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Ambient sounds can help you focus and create the perfect atmosphere for writing. Experiment with different sounds to find what works best for you!
        </p>
      </div>
    </div>
  );
}
