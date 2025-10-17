import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Crown, 
  Sparkles, 
  Building2, 
  Check, 
  X, 
  TrendingUp,
  FileText,
  Download,
  Zap
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/billing/")({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [selectedCreditAmount, setSelectedCreditAmount] = useState(50);

  if (!token || !user) {
    void navigate({ to: "/login" });
    return null;
  }

  const billingQuery = useQuery(
    trpc.billing.getUserBillingInfo.queryOptions({ token })
  );

  const upgradeMutation = useMutation(
    trpc.billing.upgradeSubscription.mutationOptions({
      onSuccess: (data) => {
        toast.success("Subscription upgraded successfully! 🎉");
        // Update auth store with new subscription data
        setAuth(token, {
          ...user,
          subscriptionTier: data.subscriptionTier,
          aiCredits: data.aiCredits,
          subscriptionExpiresAt: data.subscriptionExpiresAt,
        });
        billingQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const purchaseCreditsMutation = useMutation(
    trpc.billing.purchaseAICredits.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Successfully purchased ${selectedCreditAmount} AI credits! ✨`);
        // Update auth store with new credits
        setAuth(token, {
          ...user,
          aiCredits: data.newBalance,
        });
        billingQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleUpgrade = (tier: "PRO" | "ENTERPRISE") => {
    if (upgradeMutation.isPending) return;
    
    const confirmMessage = tier === "PRO" 
      ? "Upgrade to PRO for $12/month?" 
      : "Upgrade to ENTERPRISE for $49/month?";
    
    if (window.confirm(confirmMessage)) {
      upgradeMutation.mutate({ token, newTier: tier });
    }
  };

  const handlePurchaseCredits = () => {
    if (purchaseCreditsMutation.isPending) return;
    
    if (window.confirm(`Purchase ${selectedCreditAmount} AI credits for $${(selectedCreditAmount * 0.10).toFixed(2)}?`)) {
      purchaseCreditsMutation.mutate({ token, amount: selectedCreditAmount });
    }
  };

  if (billingQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const billingInfo = billingQuery.data;

  const tierPlans = [
    {
      name: "Free",
      tier: "FREE",
      price: "$0",
      icon: Sparkles,
      color: "gray",
      features: [
        { text: "3 projects", included: true },
        { text: "5 exports per month", included: true },
        { text: "20 chapters per project", included: true },
        { text: "10 AI credits per month", included: true },
        { text: "EPUB export only", included: true },
        { text: "Watermarked exports", included: false },
        { text: "PDF & MOBI export", included: false },
        { text: "Template marketplace", included: false },
      ],
      current: user.subscriptionTier === "FREE",
    },
    {
      name: "Pro",
      tier: "PRO",
      price: "$12",
      period: "/month",
      icon: Crown,
      color: "purple",
      features: [
        { text: "20 projects", included: true },
        { text: "50 exports per month", included: true },
        { text: "100 chapters per project", included: true },
        { text: "100 AI credits per month", included: true },
        { text: "All export formats (PDF, EPUB, MOBI)", included: true },
        { text: "No watermarks", included: true },
        { text: "Premium templates", included: true },
        { text: "Priority support", included: true },
      ],
      current: user.subscriptionTier === "PRO",
      popular: true,
    },
    {
      name: "Enterprise",
      tier: "ENTERPRISE",
      price: "$49",
      period: "/month",
      icon: Building2,
      color: "blue",
      features: [
        { text: "Unlimited projects", included: true },
        { text: "Unlimited exports", included: true },
        { text: "Unlimited chapters", included: true },
        { text: "500 AI credits per month", included: true },
        { text: "All export formats", included: true },
        { text: "White-label options", included: true },
        { text: "API access", included: true },
        { text: "Dedicated support", included: true },
      ],
      current: user.subscriptionTier === "ENTERPRISE",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription & Billing
          </h1>
          <p className="text-lg text-gray-600">
            Manage your subscription, credits, and usage
          </p>
        </div>

        {/* Current Usage Stats */}
        {billingInfo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-8 h-8 text-amber-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {billingInfo.aiCredits}
                </span>
              </div>
              <p className="text-sm text-gray-600">AI Credits</p>
              <p className="text-xs text-gray-500 mt-1">
                {billingInfo.limits.aiCreditsPerMonth} per month
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {billingInfo.usage.projects}
                </span>
              </div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-xs text-gray-500 mt-1">
                {billingInfo.limits.maxProjects === -1
                  ? "Unlimited"
                  : `${billingInfo.limits.maxProjects} max`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <Download className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {billingInfo.usage.exportsThisMonth}
                </span>
              </div>
              <p className="text-sm text-gray-600">Exports This Month</p>
              <p className="text-xs text-gray-500 mt-1">
                {billingInfo.limits.maxExportsPerMonth === -1
                  ? "Unlimited"
                  : `${billingInfo.limits.maxExportsPerMonth} max`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-green-100">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {billingInfo.lifetimeCredits}
                </span>
              </div>
              <p className="text-sm text-gray-600">Lifetime Credits</p>
              <p className="text-xs text-gray-500 mt-1">Total earned/purchased</p>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tierPlans.map((plan) => {
              const Icon = plan.icon;
              const colorClasses = {
                gray: "from-gray-600 to-gray-700 border-gray-200",
                purple: "from-purple-600 to-purple-700 border-purple-200",
                blue: "from-blue-600 to-blue-700 border-blue-200",
              };

              return (
                <div
                  key={plan.tier}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${
                    plan.popular ? "ring-4 ring-purple-500 ring-opacity-50" : ""
                  } ${plan.current ? "border-green-500" : colorClasses[plan.color as keyof typeof colorClasses]}`}
                >
                  {plan.popular && (
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center py-2 text-sm font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  {plan.current && (
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-2 text-sm font-bold">
                      CURRENT PLAN
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && (
                        <span className="text-gray-600 ml-2">{plan.period}</span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {!plan.current && plan.tier !== "FREE" && (
                      <button
                        onClick={() => handleUpgrade(plan.tier as "PRO" | "ENTERPRISE")}
                        disabled={upgradeMutation.isPending}
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${
                          plan.color === "purple"
                            ? "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                            : "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        } transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {upgradeMutation.isPending ? "Processing..." : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                    
                    {plan.current && (
                      <div className="w-full py-3 px-6 rounded-xl font-semibold text-green-700 bg-green-100 text-center">
                        Current Plan
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Purchase AI Credits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Purchase AI Credits
            </h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Need more AI credits? Purchase additional credits at $0.10 per credit.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[25, 50, 100, 250].map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedCreditAmount(amount)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCreditAmount === amount
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                <div className="text-2xl font-bold text-gray-900">{amount}</div>
                <div className="text-sm text-gray-600">credits</div>
                <div className="text-sm font-semibold text-amber-600 mt-1">
                  ${(amount * 0.10).toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handlePurchaseCredits}
            disabled={purchaseCreditsMutation.isPending}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchaseCreditsMutation.isPending
              ? "Processing..."
              : `Purchase ${selectedCreditAmount} Credits for $${(selectedCreditAmount * 0.10).toFixed(2)}`}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Note: This is a demo. No actual payment will be processed.
          </p>
        </div>
      </div>
    </div>
  );
}
