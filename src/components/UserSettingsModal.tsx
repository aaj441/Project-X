import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, User, Sparkles, Zap, Minimize2, Rocket, Focus, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: string;
  currentPreferences: any;
  onSave: (data: { uxProfile?: string; preferences?: any }) => void;
  isLoading?: boolean;
}

const UX_PROFILES = [
  {
    id: "novice",
    name: "Novice",
    icon: User,
    color: "from-blue-500 to-cyan-500",
    description: "Perfect for beginners",
    features: [
      "Simplified interface with helpful tooltips",
      "Guided workflows and onboarding",
      "Step-by-step instructions",
      "Reduced complexity and clutter",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    description: "For power users",
    features: [
      "All features visible and accessible",
      "Keyboard shortcuts enabled",
      "Advanced AI tools and settings",
      "Batch operations and automation",
    ],
  },
  {
    id: "minimalist",
    name: "Minimalist",
    icon: Minimize2,
    color: "from-gray-500 to-slate-500",
    description: "Clean and distraction-free",
    features: [
      "Essential features only",
      "Minimal UI elements",
      "Focus on content creation",
      "Reduced visual noise",
    ],
  },
  {
    id: "fast-publish",
    name: "Fast Publish",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    description: "Optimized for speed",
    features: [
      "Streamlined creation workflow",
      "Quick export options",
      "One-click AI generation",
      "Rapid iteration tools",
    ],
  },
  {
    id: "adhd-friendly",
    name: "ADHD-Friendly",
    icon: Focus,
    color: "from-green-500 to-emerald-500",
    description: "Designed for focus",
    features: [
      "Reduced distractions and animations",
      "Clear progress indicators",
      "Breaking tasks into small steps",
      "Focus mode and timers",
    ],
  },
];

export function UserSettingsModal({
  isOpen,
  onClose,
  currentProfile,
  currentPreferences,
  onSave,
  isLoading = false,
}: UserSettingsModalProps) {
  const [selectedProfile, setSelectedProfile] = useState(currentProfile || "novice");
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      autoSave: currentPreferences?.autoSave ?? true,
      autoSaveInterval: currentPreferences?.autoSaveInterval ?? 3,
      showTooltips: currentPreferences?.showTooltips ?? true,
      keyboardShortcuts: currentPreferences?.keyboardShortcuts ?? true,
      aiSuggestions: currentPreferences?.aiSuggestions ?? "on-demand",
      focusMode: currentPreferences?.focusMode ?? false,
      wordCountGoal: currentPreferences?.wordCountGoal ?? 0,
      notificationEmail: currentPreferences?.notifications?.email ?? true,
      notificationPush: currentPreferences?.notifications?.push ?? false,
      notificationAchievements: currentPreferences?.notifications?.achievements ?? true,
      notificationCollaboration: currentPreferences?.notifications?.collaboration ?? true,
    },
  });

  const autoSaveEnabled = watch("autoSave");

  const handleFormSubmit = (data: any) => {
    const preferences = {
      autoSave: data.autoSave,
      autoSaveInterval: data.autoSaveInterval,
      showTooltips: data.showTooltips,
      keyboardShortcuts: data.keyboardShortcuts,
      aiSuggestions: data.aiSuggestions,
      focusMode: data.focusMode,
      wordCountGoal: data.wordCountGoal,
      notifications: {
        email: data.notificationEmail,
        push: data.notificationPush,
        achievements: data.notificationAchievements,
        collaboration: data.notificationCollaboration,
      },
    };

    onSave({
      uxProfile: selectedProfile,
      preferences,
    });
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        User Settings
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Customize your Xavier Studio experience
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

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                  {/* UX Profile Selection */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                      Choose Your Experience
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {UX_PROFILES.map((profile) => {
                        const Icon = profile.icon;
                        const isSelected = selectedProfile === profile.id;
                        return (
                          <button
                            key={profile.id}
                            type="button"
                            onClick={() => setSelectedProfile(profile.id)}
                            className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50 shadow-lg transform scale-105"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-indigo-600 rounded-full p-1">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className={`bg-gradient-to-br ${profile.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">{profile.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
                            <ul className="space-y-1">
                              {profile.features.map((feature, idx) => (
                                <li key={idx} className="text-xs text-gray-500 flex items-start">
                                  <span className="text-indigo-600 mr-1">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Editor Preferences */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      ⚙️ Editor Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register("autoSave")}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-gray-900">Auto-Save</span>
                            <p className="text-xs text-gray-600">Automatically save your work</p>
                          </div>
                        </label>
                        {autoSaveEnabled && (
                          <div className="mt-3 ml-8">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Save interval (seconds)
                            </label>
                            <input
                              type="number"
                              {...register("autoSaveInterval", { min: 1, max: 60 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register("showTooltips")}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-gray-900">Show Tooltips</span>
                            <p className="text-xs text-gray-600">Display helpful hints</p>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register("keyboardShortcuts")}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-gray-900">Keyboard Shortcuts</span>
                            <p className="text-xs text-gray-600">Enable hotkeys</p>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register("focusMode")}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-gray-900">Focus Mode</span>
                            <p className="text-xs text-gray-600">Minimize distractions</p>
                          </div>
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Suggestions
                        </label>
                        <select
                          {...register("aiSuggestions")}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="always">Always show suggestions</option>
                          <option value="on-demand">Show on demand</option>
                          <option value="never">Never show suggestions</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Daily Word Count Goal
                        </label>
                        <input
                          type="number"
                          {...register("wordCountGoal", { min: 0 })}
                          placeholder="0 = no goal"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Set to 0 to disable</p>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      🔔 Notifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("notificationEmail")}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Email Notifications</span>
                          <p className="text-xs text-gray-600">Updates via email</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("notificationPush")}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Push Notifications</span>
                          <p className="text-xs text-gray-600">Browser alerts</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("notificationAchievements")}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Achievements</span>
                          <p className="text-xs text-gray-600">Milestone alerts</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("notificationCollaboration")}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Collaboration</span>
                          <p className="text-xs text-gray-600">Team updates</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {isLoading ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
