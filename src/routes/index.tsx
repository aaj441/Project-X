import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore, useIsAuthenticated } from "~/stores/authStore";
import { Header } from "~/components/Header";
import { MilestoneWall } from "~/components/MilestoneWall";
import { ModuleCard } from "~/components/ModuleCard";
import { CreateProjectModal } from "~/components/CreateProjectModal";
import { CategoryPlanets } from "~/components/CategoryPlanets";
import { BigIdeaPot } from "~/components/BigIdeaPot";
import { QuickActionMenu } from "~/components/QuickActionMenu";
import { AccessHierarchyPanel } from "~/components/AccessHierarchyPanel";
import { useModuleStore } from "~/stores/moduleStore";
import { soundEffects } from "~/utils/soundEffects";
import toast from "react-hot-toast";
import { Plus, Sparkles, AlertCircle, TrendingUp } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useIsAuthenticated();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);
  const activeCategory = useModuleStore((state) => state.activeCategory);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const projectsQuery = useQuery(
    trpc.projects.list.queryOptions({
      authToken: token || "",
    })
  );

  const moduleStatsQuery = useQuery(
    trpc.modules.getStats.queryOptions({
      authToken: token || "",
    })
  );

  const createProjectMutation = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: () => {
        soundEffects.success();
        toast.success("Module created successfully!");
        setIsCreateModalOpen(false);
        void projectsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create module");
      },
    })
  );

  const deleteProjectMutation = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        soundEffects.success();
        toast.success("Module deleted successfully!");
        void projectsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete module");
      },
    })
  );

  const exportToCanvaMutation = useMutation(
    trpc.exports.toCanva.mutationOptions({
      onSuccess: (data) => {
        soundEffects.export();
        toast.success("Canva export ready!");
        
        // Trigger download
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to export to Canva");
      },
    })
  );

  const handleCreateProject = (data: {
    title: string;
    description: string;
    genre: string;
    language: string;
    workflowCategory: string;
  }) => {
    createProjectMutation.mutate({
      authToken: token || "",
      ...data,
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this module?")) {
      deleteProjectMutation.mutate({
        authToken: token || "",
        projectId,
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: number) => {
    e.preventDefault();
    if (draggedProjectId && draggedProjectId !== targetProjectId) {
      // Here you would update the order in the backend
      // For now, just play a sound effect
      soundEffects.success();
      toast.success("Module reordered!");
    }
  };

  const handleAssignAgent = (projectId: number) => {
    // Placeholder for agent assignment
    toast.success("Agent assignment coming soon!");
  };

  const handleExportToCanva = (projectId: number) => {
    exportToCanvaMutation.mutate({
      authToken: token || "",
      projectId,
    });
  };

  const handleSearch = (keywords: string) => {
    if (keywords.trim()) {
      toast.success(`Searching for: ${keywords}`);
      // This would call a tRPC procedure to search/filter projects
    }
  };

  const handleShuffle = () => {
    soundEffects.shuffle();
    toast.success("Shuffling trending ideas...");
    // This would call a tRPC procedure to get shuffled/recommended projects
  };

  const filteredProjects = projectsQuery.data?.filter((project) => {
    if (!activeCategory) return true;
    return project.workflowCategory === activeCategory;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Upgrade Banner for Free Users */}
      {user?.subscriptionTier === "FREE" && projectsQuery.data && projectsQuery.data.length >= 2 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    You're using {projectsQuery.data.length} of 3 free modules
                  </p>
                  <p className="text-sm text-amber-50">
                    Upgrade to PRO for 20 modules, 100 AI credits/month, and all export formats
                  </p>
                </div>
              </div>
              <Link
                to="/billing"
                className="bg-white text-orange-600 px-6 py-2 rounded-xl font-bold hover:bg-orange-50 transition-all flex items-center gap-2 flex-shrink-0"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Upgrade Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Low Credits Warning */}
      {user && user.aiCredits <= 3 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-bold">Low on AI credits!</span> You have {user.aiCredits} credits remaining.
                </p>
              </div>
              <Link
                to="/billing"
                className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex-shrink-0"
              >
                Get More Credits
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Rocket/Cloud Theme Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 text-white overflow-hidden">
        {/* Animated cloud background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full blur-xl animate-float"></div>
          <div className="absolute top-20 right-20 w-40 h-20 bg-white rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-20 left-1/4 w-36 h-18 bg-white rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>
        
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-2 mb-6">
              <Sparkles className="w-12 h-12 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-extrabold">
                Xavier Studio
              </h1>
              <Sparkles className="w-12 h-12 animate-pulse" />
            </div>
            <p className="text-2xl md:text-3xl font-light text-indigo-100 dark:text-indigo-200 mb-4">
              Where Modules Launch Into Orbit
            </p>
            <p className="text-lg text-indigo-200 dark:text-indigo-300 max-w-2xl mx-auto">
              Your creative command center for AI-powered content creation, analytics, and automation
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => {
                soundEffects.launch();
                if (user?.subscriptionTier === "FREE" && projectsQuery.data && projectsQuery.data.length >= 3) {
                  toast.error("You've reached the free tier limit of 3 modules. Please upgrade to create more!");
                  void navigate({ to: "/billing" });
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="group bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all transform hover:scale-105 flex items-center space-x-3 shadow-2xl"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span>Launch New Module</span>
            </button>
          </div>

          {/* User Stats */}
          {projectsQuery.data && projectsQuery.data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl font-bold mb-2">
                  {projectsQuery.data.length}
                </div>
                <div className="text-indigo-100 dark:text-indigo-200 font-medium">
                  Active Modules
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl font-bold mb-2">
                  {projectsQuery.data.reduce((sum, p) => sum + p._count.chapters, 0)}
                </div>
                <div className="text-indigo-100 dark:text-indigo-200 font-medium">
                  Chapters Created
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl font-bold mb-2">
                  {projectsQuery.data.reduce((sum, p) => sum + p._count.exports, 0)}
                </div>
                <div className="text-indigo-100 dark:text-indigo-200 font-medium">
                  Successful Launches
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Wall - Compact Version */}
      {user && (user.streakCount > 0 || (user.achievements && JSON.parse(user.achievements as string).length > 0)) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MilestoneWall compact={true} />
        </div>
      )}

      {/* Big Idea Pot - Brainstorming Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BigIdeaPot />
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {projectsQuery.isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your modules...</p>
            </div>
          </div>
        ) : projectsQuery.data && projectsQuery.data.length > 0 ? (
          <>
            <CategoryPlanets />
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {activeCategory ? `${activeCategory} Modules` : "Your Modules"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredProjects?.length || 0} modules ready for launch
                </p>
              </div>
              <button
                onClick={() => {
                  soundEffects.launch();
                  if (user?.subscriptionTier === "FREE" && projectsQuery.data && projectsQuery.data.length >= 3) {
                    toast.error("You've reached the free tier limit of 3 modules. Please upgrade to create more!");
                    void navigate({ to: "/billing" });
                  } else {
                    setIsCreateModalOpen(true);
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>New Module</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects?.map((project) => (
                <ModuleCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onAssignAgent={handleAssignAgent}
                  onExportToCanva={handleExportToCanva}
                  isDragging={draggedProjectId === project.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto border-2 border-indigo-100 dark:border-indigo-800">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to Launch Your First Module?
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Your creative studio is waiting. Just throw in your ideas, pick a category, and let our AI generator craft beautifully designed content that's ready to launch. It's like having a professional team at your fingertips.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 text-left">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">How it works:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span>Create a module with your idea and category</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span>Let AI generate content or write your own</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span>Export as beautifully formatted files</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                    <span>Launch and profit!</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  soundEffects.launch();
                  setIsCreateModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Launch Your First Module
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        isLoading={createProjectMutation.isPending}
      />

      <QuickActionMenu
        onAddModule={() => {
          soundEffects.launch();
          if (user?.subscriptionTier === "FREE" && projectsQuery.data && projectsQuery.data.length >= 3) {
            toast.error("You've reached the free tier limit of 3 modules. Please upgrade to create more!");
            void navigate({ to: "/billing" });
          } else {
            setIsCreateModalOpen(true);
          }
        }}
        onShuffleIdeas={handleShuffle}
        onRunWorkflow={() => toast.success("Workflow execution coming soon!")}
        onExport={() => {
          soundEffects.export();
          toast.success("Bulk export coming soon!");
        }}
      />

      <AccessHierarchyPanel
        agentAssignments={moduleStatsQuery.data?.agentAssignments || []}
        recentRuns={moduleStatsQuery.data?.recentRuns || []}
        trendingWorkflows={moduleStatsQuery.data?.trendingWorkflows || []}
      />
    </div>
  );
}
