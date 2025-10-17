import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Sparkles,
  Brain,
  BookOpen,
  CheckCircle,
  BarChart3,
  Megaphone,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";

type AIToolsPanelProps = {
  projectId: number;
  onRefresh: () => void;
};

export function AIToolsPanel({ projectId, onRefresh }: AIToolsPanelProps) {
  const [activeModal, setActiveModal] = useState<
    | "voice"
    | "outline"
    | "consistency"
    | "readability"
    | "marketing"
    | null
  >(null);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
        AI Power Tools
      </h3>
      <div className="space-y-3">
        <button
          onClick={() => setActiveModal("voice")}
          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all text-left border-2 border-blue-100"
        >
          <Brain className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-gray-900">Voice Analysis</div>
            <div className="text-sm text-gray-600">
              Clone your writing style
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal("outline")}
          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all text-left border-2 border-purple-100"
        >
          <BookOpen className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-gray-900">Generate Outline</div>
            <div className="text-sm text-gray-600">
              AI-powered book structure
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal("consistency")}
          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all text-left border-2 border-green-100"
        >
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-gray-900">Check Consistency</div>
            <div className="text-sm text-gray-600">
              Find contradictions & plot holes
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal("marketing")}
          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all text-left border-2 border-orange-100"
        >
          <Megaphone className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-gray-900">Marketing Kit</div>
            <div className="text-sm text-gray-600">
              Generate promotional materials
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      <VoiceAnalysisModal
        isOpen={activeModal === "voice"}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
      />
      <OutlineGeneratorModal
        isOpen={activeModal === "outline"}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
        onSuccess={onRefresh}
      />
      <ConsistencyCheckModal
        isOpen={activeModal === "consistency"}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
      />
      <MarketingGeneratorModal
        isOpen={activeModal === "marketing"}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
      />
    </div>
  );
}

function VoiceAnalysisModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    content: string;
  }>();

  const analyzeVoiceMutation = useMutation(
    trpc.ai.analyzeVoice.mutationOptions({
      onSuccess: (data) => {
        toast.success("Voice analysis complete!");
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to analyze voice");
      },
    })
  );

  const onSubmit = (data: { name: string; content: string }) => {
    analyzeVoiceMutation.mutate({
      authToken: token || "",
      projectId,
      ...data,
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Voice Analysis
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Clone your unique writing style
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📝 Sample Name
                    </label>
                    <input
                      type="text"
                      {...register("name", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., My Writing Style, Chapter 3 Sample"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      ✍️ Writing Sample (500+ characters)
                    </label>
                    <textarea
                      {...register("content", { required: true, minLength: 500 })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      rows={12}
                      placeholder="Paste 3-5 pages of your writing here. The AI will analyze your sentence structure, vocabulary, tone, pacing, and voice to help generate content that sounds like YOU."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Minimum 500 characters. More is better for accurate analysis!
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-600 mr-2 text-lg">💡</span>
                      <span>
                        The AI will analyze your writing for sentence complexity, vocabulary level, tone, pacing, and stylistic choices. Future AI generations will match YOUR voice, not generic AI writing!
                      </span>
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={analyzeVoiceMutation.isPending}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {analyzeVoiceMutation.isPending
                        ? "Analyzing..."
                        : "🧠 Analyze My Voice"}
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

function OutlineGeneratorModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const { register, handleSubmit } = useForm<{
    structureType: "linear" | "story_arc" | "framework" | "anthology";
    chapterCount: number;
  }>();

  const generateOutlineMutation = useMutation(
    trpc.ai.generateOutline.mutationOptions({
      onSuccess: () => {
        toast.success("Outline generated! Check your project settings.");
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate outline");
      },
    })
  );

  const onSubmit = (data: {
    structureType: "linear" | "story_arc" | "framework" | "anthology";
    chapterCount: number;
  }) => {
    generateOutlineMutation.mutate({
      authToken: token || "",
      projectId,
      ...data,
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Generate Outline
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        AI-powered book structure
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📖 Structure Type
                    </label>
                    <select
                      {...register("structureType")}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      defaultValue="linear"
                    >
                      <option value="linear">Linear (Traditional)</option>
                      <option value="story_arc">Story Arc (Narrative)</option>
                      <option value="framework">Framework (Systems)</option>
                      <option value="anthology">Anthology (Collection)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      🔢 Number of Chapters
                    </label>
                    <input
                      type="number"
                      {...register("chapterCount", { min: 3, max: 50 })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      defaultValue={12}
                      min={3}
                      max={50}
                    />
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-purple-600 mr-2 text-lg">✨</span>
                      <span>
                        AI will analyze your project and create a detailed outline with chapter titles, synopses, key points, and pacing notes!
                      </span>
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generateOutlineMutation.isPending}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {generateOutlineMutation.isPending
                        ? "Generating..."
                        : "📚 Generate Outline"}
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

function ConsistencyCheckModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [results, setResults] = useState<any>(null);

  const checkConsistencyMutation = useMutation(
    trpc.ai.checkConsistency.mutationOptions({
      onSuccess: (data) => {
        setResults(data);
        toast.success("Consistency check complete!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to check consistency");
      },
    })
  );

  const handleCheck = () => {
    checkConsistencyMutation.mutate({
      authToken: token || "",
      projectId,
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl shadow-lg">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Consistency Check
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Find contradictions & plot holes
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

                {!results ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-6">
                      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Ready to Check Consistency
                      </h3>
                      <p className="text-gray-600 mb-6">
                        AI will analyze your entire manuscript for:
                      </p>
                      <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Character inconsistencies</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Timeline contradictions</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Location/setting issues</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Factual contradictions</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Plot holes</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Tone/voice shifts</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={handleCheck}
                      disabled={checkConsistencyMutation.isPending}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {checkConsistencyMutation.isPending
                        ? "Analyzing..."
                        : "🔍 Run Consistency Check"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Overall Consistency: {results.overallConsistency}
                      </h3>
                      <p className="text-gray-700">{results.summary}</p>
                    </div>

                    {results.issues && results.issues.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">
                          Issues Found ({results.issues.length})
                        </h4>
                        <div className="space-y-3">
                          {results.issues.map((issue: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border-2 ${
                                issue.severity === "major"
                                  ? "bg-red-50 border-red-200"
                                  : issue.severity === "moderate"
                                  ? "bg-yellow-50 border-yellow-200"
                                  : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      issue.severity === "major"
                                        ? "bg-red-200 text-red-800"
                                        : issue.severity === "moderate"
                                        ? "bg-yellow-200 text-yellow-800"
                                        : "bg-blue-200 text-blue-800"
                                    }`}
                                  >
                                    {issue.severity}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {issue.type}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Chapters: {issue.chapters.join(", ")}
                                </span>
                              </div>
                              <p className="text-gray-900 mb-2">
                                {issue.description}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.strengths && results.strengths.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">
                          ✅ Strengths
                        </h4>
                        <ul className="space-y-2">
                          {results.strengths.map((strength: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start text-gray-700"
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => setResults(null)}
                      className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Run Another Check
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function MarketingGeneratorModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const generateMarketingMutation = useMutation(
    trpc.ai.generateMarketing.mutationOptions({
      onSuccess: (data) => {
        setResults(data);
        toast.success("Marketing assets generated!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate marketing");
      },
    })
  );

  const assetTypes = [
    { value: "social-twitter", label: "Twitter/X Posts", icon: "🐦" },
    { value: "social-instagram", label: "Instagram Captions", icon: "📸" },
    { value: "social-linkedin", label: "LinkedIn Posts", icon: "💼" },
    { value: "email-announcement", label: "Email Announcement", icon: "📧" },
    { value: "amazon-description", label: "Amazon Description", icon: "📦" },
    { value: "press-release", label: "Press Release", icon: "📰" },
  ];

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = () => {
    if (selectedTypes.length === 0) {
      toast.error("Please select at least one asset type");
      return;
    }
    generateMarketingMutation.mutate({
      authToken: token || "",
      projectId,
      assetTypes: selectedTypes as any,
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-3 rounded-xl shadow-lg">
                      <Megaphone className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Marketing Kit Generator
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Create promotional materials
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

                {results.length === 0 ? (
                  <div>
                    <p className="text-gray-700 mb-4">
                      Select the marketing assets you want to generate:
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {assetTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => toggleType(type.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTypes.includes(type.value)
                              ? "bg-orange-50 border-orange-500"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <div className="font-semibold text-gray-900">
                            {type.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={
                        generateMarketingMutation.isPending ||
                        selectedTypes.length === 0
                      }
                      className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {generateMarketingMutation.isPending
                        ? "Generating..."
                        : `🚀 Generate ${selectedTypes.length} Asset${selectedTypes.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-100">
                      <p className="text-sm text-gray-700 flex items-center">
                        <Megaphone className="w-5 h-5 text-orange-600 mr-2" />
                        <span>
                          Your marketing assets are ready! Copy and use them to promote your book.
                        </span>
                      </p>
                    </div>

                    {results.map((asset, idx) => (
                      <div
                        key={idx}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6"
                      >
                        <h4 className="font-bold text-gray-900 mb-3">
                          {assetTypes.find((t) => t.value === `${asset.type}-${asset.platform}` || t.value.startsWith(asset.type))?.label || asset.type}
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                          {typeof asset.parsedContent === "string"
                            ? asset.parsedContent
                            : JSON.stringify(asset.parsedContent, null, 2)}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              typeof asset.parsedContent === "string"
                                ? asset.parsedContent
                                : JSON.stringify(asset.parsedContent, null, 2)
                            );
                            toast.success("Copied to clipboard!");
                          }}
                          className="mt-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition"
                        >
                          📋 Copy
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setResults([]);
                        setSelectedTypes([]);
                      }}
                      className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Generate More Assets
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
