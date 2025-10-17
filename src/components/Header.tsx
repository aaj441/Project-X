import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { BookOpen, LogOut, User, CreditCard, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { SubscriptionBadge } from "~/components/SubscriptionBadge";
import { ThemeToggle } from "~/components/ThemeToggle";
import { UserSettingsModal } from "~/components/UserSettingsModal";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";

export function Header() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const updateProfileMutation = useMutation(
    trpc.users.updateProfile.mutationOptions({
      onSuccess: (data) => {
        // Update the auth store with new user data
        if (user && token) {
          setAuth(token, { ...user, ...data.user });
        }
        toast.success("Settings saved successfully!");
        setIsSettingsModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save settings");
      },
    })
  );

  const handleSaveSettings = (data: { uxProfile?: string; preferences?: any }) => {
    updateProfileMutation.mutate({
      authToken: token || "",
      ...data,
    });
  };

  const handleLogout = () => {
    logout();
    toast.success("Come back soon! 👋");
    void navigate({ to: "/login" });
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-md group-hover:shadow-lg transition-all transform group-hover:scale-105">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Xavier Studio
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Your Creative Command Center
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <SubscriptionBadge />
            <ThemeToggle />
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border-2 border-gray-200 hover:border-indigo-300 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <Link
              to="/billing"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border-2 border-purple-200 hover:border-purple-300 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-800 dark:hover:bg-purple-900/50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing</span>
            </Link>
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-100 dark:border-indigo-800">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 rounded-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Creator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentProfile={user?.uxProfile || "novice"}
        currentPreferences={user?.preferences}
        onSave={handleSaveSettings}
        isLoading={updateProfileMutation.isPending}
      />
    </header>
  );
}
