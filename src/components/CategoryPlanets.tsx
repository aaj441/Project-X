import { useModuleStore } from "~/stores/moduleStore";
import { soundEffects } from "~/utils/soundEffects";
import {
  FileText,
  BarChart3,
  Users,
  Palette,
  DollarSign,
  GraduationCap,
  Zap,
  Globe,
} from "lucide-react";

const CATEGORIES = [
  { id: "Content", name: "Content", icon: FileText, color: "from-blue-500 to-cyan-500" },
  { id: "Analytics", name: "Analytics", icon: BarChart3, color: "from-purple-500 to-pink-500" },
  { id: "HR", name: "HR", icon: Users, color: "from-green-500 to-emerald-500" },
  { id: "Design", name: "Design", icon: Palette, color: "from-orange-500 to-red-500" },
  { id: "Finance", name: "Finance", icon: DollarSign, color: "from-yellow-500 to-amber-500" },
  { id: "Learning", name: "Learning", icon: GraduationCap, color: "from-indigo-500 to-purple-500" },
  { id: "Automation", name: "Automation", icon: Zap, color: "from-pink-500 to-rose-500" },
];

export function CategoryPlanets() {
  const activeCategory = useModuleStore((state) => state.activeCategory);
  const setActiveCategory = useModuleStore((state) => state.setActiveCategory);

  const handleCategoryClick = (categoryId: string) => {
    soundEffects.click();
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 rounded-3xl p-8 mb-8 overflow-hidden border-2 border-indigo-100 dark:border-indigo-900">
      {/* Background stars effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>

      <div className="relative flex items-center justify-center gap-4 flex-wrap">
        {/* Central "All" planet */}
        <button
          onClick={() => {
            soundEffects.click();
            setActiveCategory(null);
          }}
          className={`group relative transition-all duration-300 ${
            activeCategory === null ? "scale-110" : "hover:scale-105"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg transition-all ${
              activeCategory === null
                ? "ring-4 ring-indigo-400 dark:ring-indigo-500 shadow-2xl"
                : "hover:shadow-xl"
            } animate-float`}
          >
            <Globe className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">All</span>
          </div>
        </button>

        {/* Category planets */}
        {CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const delay = index * 0.3;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`group relative transition-all duration-300 ${
                isActive ? "scale-110" : "hover:scale-105"
              }`}
              style={{ animationDelay: `${delay}s` }}
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg transition-all ${
                  isActive
                    ? "ring-4 ring-white dark:ring-gray-700 shadow-2xl"
                    : "hover:shadow-xl"
                } animate-float`}
                style={{ animationDelay: `${delay}s` }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeCategory}</span> modules
          </p>
        </div>
      )}
    </div>
  );
}
