import { useAuthStore } from "~/stores/authStore";
import { soundEffects } from "~/utils/soundEffects";
import {
  Trophy,
  Flame,
  Zap,
  Star,
  Award,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface MilestoneWallProps {
  compact?: boolean;
}

export function MilestoneWall({ compact = false }: MilestoneWallProps) {
  const user = useAuthStore((state) => state.user);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  const achievements: Achievement[] = user?.achievements
    ? JSON.parse(user.achievements as string)
    : [];

  const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 to-orange-600",
  };

  const rarityBorders = {
    common: "border-gray-400",
    rare: "border-blue-400",
    epic: "border-purple-400",
    legendary: "border-yellow-400",
  };

  useEffect(() => {
    // Check for new achievements
    if (achievements.length > 0) {
      const latestAchievement = achievements[achievements.length - 1];
      const unlockedDate = new Date(latestAchievement.unlockedAt);
      const now = new Date();
      const hoursSinceUnlock = (now.getTime() - unlockedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUnlock < 1) {
        setRecentAchievement(latestAchievement);
        setShowConfetti(true);
        soundEffects.success();
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [achievements]);

  if (!user) return null;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
          Your Milestones
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-4 mb-2">
              <Flame className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{user.streakCount}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-4 mb-2">
              <Star className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
            <div className="text-xs text-gray-600">Achievements</div>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-4 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.floor((user.totalWordsWritten || 0) / 1000)}k
            </div>
            <div className="text-xs text-gray-600">Words</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-indigo-200 shadow-xl overflow-hidden">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-vapor-trail"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl shadow-lg">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Milestone Wall</h2>
            <p className="text-sm text-gray-600">Your creative journey</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          <span className="text-sm font-semibold text-purple-600">
            {achievements.length} unlocked
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              STREAK
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{user.streakCount}</div>
          <div className="text-sm text-gray-600">
            Days in a row • Best: {user.longestStreak}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-purple-500" />
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              ACHIEVEMENTS
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{achievements.length}</div>
          <div className="text-sm text-gray-600">Milestones unlocked</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              WORDS
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor((user.totalWordsWritten || 0) / 1000)}k
          </div>
          <div className="text-sm text-gray-600">Total words written</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-500" />
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
              PROGRESS
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.min(100, Math.floor((achievements.length / 20) * 100))}%
          </div>
          <div className="text-sm text-gray-600">To next milestone</div>
        </div>
      </div>

      {/* Recent Achievement Banner */}
      {recentAchievement && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mb-8 shadow-lg border-2 border-yellow-300 animate-pulse-slow">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-full p-4">
              <Award className="w-10 h-10 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-yellow-900 mb-1">
                NEW ACHIEVEMENT UNLOCKED!
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {recentAchievement.title}
              </div>
              <div className="text-sm text-yellow-100">
                {recentAchievement.description}
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl p-4 shadow-md border-2 ${
                rarityBorders[achievement.rarity]
              } hover:scale-105 transition-transform cursor-pointer group`}
            >
              <div
                className={`bg-gradient-to-br ${
                  rarityColors[achievement.rarity]
                } text-white rounded-lg p-3 mb-3 text-center`}
              >
                <div className="text-3xl mb-1">{achievement.icon}</div>
                <div className="text-xs font-bold uppercase">
                  {achievement.rarity}
                </div>
              </div>
              <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                {achievement.title}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Start Your Journey!
          </p>
          <p className="text-sm text-gray-500">
            Complete tasks to unlock achievements and build your milestone wall
          </p>
        </div>
      )}
    </div>
  );
}
