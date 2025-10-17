import { useAuthStore } from "~/stores/authStore";
import { Sparkles, Crown, Building2 } from "lucide-react";

export function SubscriptionBadge() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const tierConfig = {
    FREE: {
      icon: Sparkles,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      label: "Free",
    },
    PRO: {
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Pro",
    },
    ENTERPRISE: {
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Enterprise",
    },
  };

  const config = tierConfig[user.subscriptionTier as keyof typeof tierConfig] || tierConfig.FREE;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-600">
          {user.aiCredits} credits
        </span>
      </div>
    </div>
  );
}
