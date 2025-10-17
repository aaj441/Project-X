import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/signup/")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; email: string; password: string }>();

  const signupMutation = useMutation(
    trpc.auth.signup.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast.success("Account created successfully!");
        void navigate({ to: "/" });
      },
      onError: (error) => {
        toast.error(error.message || "Signup failed");
      },
    })
  );

  const onSubmit = (data: { name: string; email: string; password: string }) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Hero content */}
        <div className="text-white space-y-6 hidden md:block">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-white p-3 rounded-xl shadow-2xl">
              <BookOpen className="w-10 h-10 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold">EBook Studio</h1>
              <p className="text-indigo-100 font-medium">Your Creative Generator</p>
            </div>
          </div>
          <h2 className="text-5xl font-extrabold leading-tight">
            Transform Ideas Into Bestselling E-Books
          </h2>
          <p className="text-xl text-indigo-100 leading-relaxed">
            Join thousands of creators who are using AI to craft beautifully designed e-books and selling them on Amazon for quick profit.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="font-bold text-xl mb-4">What you'll get:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold">AI Content Generator</p>
                  <p className="text-indigo-100 text-sm">Let AI write entire chapters for you</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="font-semibold">Professional Templates</p>
                  <p className="text-indigo-100 text-sm">Beautiful designs ready for publishing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold">Instant Export</p>
                  <p className="text-indigo-100 text-sm">Download and sell on Amazon immediately</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="font-semibold">Fast & Easy</p>
                  <p className="text-indigo-100 text-sm">Create complete e-books in minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signup form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8 md:hidden">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EBook Studio
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Start Creating Today
            </h2>
            <p className="text-gray-600">
              Set up your creative studio in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-900 mb-2"
              >
                👤 Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-lg"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-900 mb-2"
              >
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-lg"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-900 mb-2"
              >
                🔒 Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-lg"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password.message}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                At least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
            >
              {signupMutation.isPending ? "Creating your studio..." : "🚀 Create My Studio"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-bold"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
