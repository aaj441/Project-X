import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTRPC, useTRPCClient } from "~/trpc/react";
import { useAuthStore, useIsAuthenticated } from "~/stores/authStore";
import { Header } from "~/components/Header";
import toast from "react-hot-toast";
import {
  Plus,
  Sparkles,
  Download,
  FileText,
  Trash2,
  Save,
  Edit3,
  X,
  BookOpen,
  ImageIcon,
  Bot,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Markdown from "markdown-to-jsx";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { KDPMetadataModal, KDPMetadataFormData } from "~/components/KDPMetadataModal";
import { CoverDesignModal } from "~/components/CoverDesignModal";
import { AIToolsPanel } from "~/components/AIToolsPanel";
import { InlineAIToolbar } from "~/components/InlineAIToolbar";
import { AISuggestionsPanel } from "~/components/AISuggestionsPanel";
import { AgentSelectionModal } from "~/components/AgentSelectionModal";
import { TitleSuggestionsModal } from "~/components/TitleSuggestionsModal";
import { MetadataSuggestionsModal } from "~/components/MetadataSuggestionsModal";
import { BlurbGeneratorModal } from "~/components/BlurbGeneratorModal";
import { useAutoSave } from "~/hooks/useAutoSave";
import { AutoSaveIndicator } from "~/components/AutoSaveIndicator";
import { ADHDCopilot } from "~/components/ADHDCopilot";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectEditor,
});

function ProjectEditor() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useIsAuthenticated();
  
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [isKDPMetadataModalOpen, setIsKDPMetadataModalOpen] = useState(false);
  const [isCoverDesignModalOpen, setIsCoverDesignModalOpen] = useState(false);
  const [isAgentSelectionModalOpen, setIsAgentSelectionModalOpen] = useState(false);
  const [isTitleSuggestionsModalOpen, setIsTitleSuggestionsModalOpen] = useState(false);
  const [isMetadataSuggestionsModalOpen, setIsMetadataSuggestionsModalOpen] = useState(false);
  const [isBlurbGeneratorModalOpen, setIsBlurbGeneratorModalOpen] = useState(false);
  const [textSelection, setTextSelection] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [isStreamingRewrite, setIsStreamingRewrite] = useState(false);
  const [isStreamingExpand, setIsStreamingExpand] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    id: number;
    text: string;
    type: "continuation" | "improvement" | "alternative";
    timestamp: number;
  }>>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<Array<{
    title: string;
    rationale: string;
    marketability: "high" | "medium" | "low";
  }>>([]);
  const [metadataSuggestions, setMetadataSuggestions] = useState<any>(null);
  const [blurbData, setBlurbData] = useState<any>(null);
  const [sessionStartTime] = useState(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const projectQuery = useQuery(
    trpc.projects.get.queryOptions({
      authToken: token || "",
      projectId: parseInt(projectId),
    })
  );

  const templatesQuery = useQuery(trpc.templates.list.queryOptions());

  const agentsQuery = useQuery(
    trpc.agents.list.queryOptions({
      authToken: token || "",
    })
  );

  const createChapterMutation = useMutation(
    trpc.chapters.create.mutationOptions({
      onSuccess: () => {
        toast.success("Chapter created!");
        setIsAddChapterModalOpen(false);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create chapter");
      },
    })
  );

  const updateChapterMutation = useMutation(
    trpc.chapters.update.mutationOptions({
      onSuccess: () => {
        toast.success("Chapter saved!");
        setIsEditing(false);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save chapter");
      },
    })
  );

  const deleteChapterMutation = useMutation(
    trpc.chapters.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Chapter deleted!");
        setSelectedChapterId(null);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete chapter");
      },
    })
  );

  const generateChapterMutation = useMutation(
    trpc.ai.generateChapter.mutationOptions({
      onSuccess: () => {
        toast.success("Chapter generated with AI!");
        setIsAIModalOpen(false);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate content");
      },
    })
  );

  const createExportMutation = useMutation(
    trpc.exports.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Export created! Downloading...");
        window.open(data.fileUrl, "_blank");
        setIsExportModalOpen(false);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create export");
      },
    })
  );

  const updateProjectMutation = useMutation(
    trpc.projects.update.mutationOptions({
      onSuccess: () => {
        toast.success("Project updated!");
        setIsKDPMetadataModalOpen(false);
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update project");
      },
    })
  );

  const generateCoverUploadUrlMutation = useMutation(
    trpc.kdp.generateCoverUploadUrl.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to generate upload URL");
      },
    })
  );

  const generateAICoverMutation = useMutation(
    trpc.kdp.generateAICover.mutationOptions({
      onSuccess: () => {
        toast.success("AI cover generated successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate AI cover");
      },
    })
  );

  const assignAgentMutation = useMutation(
    trpc.agents.assign.mutationOptions({
      onSuccess: () => {
        toast.success("Agent assigned successfully!");
        void projectQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to assign agent");
      },
    })
  );

  const suggestTitlesMutation = useMutation(
    trpc.ai.suggestTitles.mutationOptions({
      onSuccess: (data) => {
        setTitleSuggestions(data.suggestions);
        setIsTitleSuggestionsModalOpen(true);
        toast.success("Title suggestions generated!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate title suggestions");
      },
    })
  );

  const suggestMetadataMutation = useMutation(
    trpc.ai.suggestMetadata.mutationOptions({
      onSuccess: (data) => {
        setMetadataSuggestions(data.suggestions);
        setIsMetadataSuggestionsModalOpen(true);
        toast.success("Metadata recommendations generated!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate metadata suggestions");
      },
    })
  );

  const generateBlurbMutation = useMutation(
    trpc.ai.generateBlurb.mutationOptions({
      onSuccess: (data) => {
        setBlurbData(data.blurbs);
        setIsBlurbGeneratorModalOpen(true);
        toast.success("Book blurbs generated!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate blurbs");
      },
    })
  );

  // Auto-save functionality
  const { saveStatus, lastSavedAt, triggerSave, isAutoSaveEnabled } = useAutoSave({
    enabled: isEditing && selectedChapterId !== null,
    content: editContent,
    onSave: async () => {
      if (!selectedChapterId) return;
      await updateChapterMutation.mutateAsync({
        authToken: token || "",
        chapterId: selectedChapterId,
        content: editContent,
      });
    },
  });

  const selectedChapter = projectQuery.data?.chapters.find(
    (ch) => ch.id === selectedChapterId
  );

  const handleTextSelect = useCallback(() => {
    if (!textareaRef.current || !isEditing) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = editContent.substring(start, end);

    if (selectedText.length > 5) {
      setTextSelection({ text: selectedText, start, end });

      // Calculate toolbar position
      const rect = textareaRef.current.getBoundingClientRect();
      const lineHeight = 24; // approximate
      const lines = editContent.substring(0, start).split("\n").length;
      
      setToolbarPosition({
        top: rect.top + window.scrollY + (lines * lineHeight),
        left: rect.left + window.scrollX + 100,
      });
    } else {
      setTextSelection(null);
      setToolbarPosition(null);
    }
  }, [editContent, isEditing]);

  const handleInlineRewrite = useCallback(async (instruction: string) => {
    if (!textSelection || !selectedChapterId) return;

    setIsStreamingRewrite(true);
    setStreamedContent("");
    
    try {
      const surroundingStart = Math.max(0, textSelection.start - 200);
      const surroundingEnd = Math.min(editContent.length, textSelection.end + 200);
      const surroundingContext = editContent.substring(surroundingStart, surroundingEnd);

      const stream = await trpcClient.ai.rewriteTextStream.query({
        authToken: token || "",
        chapterId: selectedChapterId,
        selectedText: textSelection.text,
        instruction,
        surroundingContext,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        if (!chunk.done) {
          fullContent += chunk.content;
          setStreamedContent(fullContent);
        }
      }

      // Replace the selected text with the rewritten version
      const newContent =
        editContent.substring(0, textSelection.start) +
        fullContent +
        editContent.substring(textSelection.end);
      
      setEditContent(newContent);
      setTextSelection(null);
      setToolbarPosition(null);
      toast.success("Text rewritten!");
    } catch (error: any) {
      toast.error(error.message || "Failed to rewrite text");
    } finally {
      setIsStreamingRewrite(false);
      setStreamedContent("");
    }
  }, [textSelection, selectedChapterId, editContent, token, trpcClient]);

  const handleInlineExpand = useCallback(async (expandType?: "detail" | "examples" | "dialogue" | "description") => {
    if (!textSelection || !selectedChapterId) return;

    setIsStreamingExpand(true);
    setStreamedContent("");
    
    try {
      const surroundingStart = Math.max(0, textSelection.start - 200);
      const surroundingEnd = Math.min(editContent.length, textSelection.end + 200);
      const surroundingContext = editContent.substring(surroundingStart, surroundingEnd);

      const stream = await trpcClient.ai.expandTextStream.query({
        authToken: token || "",
        chapterId: selectedChapterId,
        selectedText: textSelection.text,
        expandType,
        surroundingContext,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        if (!chunk.done) {
          fullContent += chunk.content;
          setStreamedContent(fullContent);
        }
      }

      // Replace the selected text with the expanded version
      const newContent =
        editContent.substring(0, textSelection.start) +
        fullContent +
        editContent.substring(textSelection.end);
      
      setEditContent(newContent);
      setTextSelection(null);
      setToolbarPosition(null);
      toast.success("Text expanded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to expand text");
    } finally {
      setIsStreamingExpand(false);
      setStreamedContent("");
    }
  }, [textSelection, selectedChapterId, editContent, token, trpcClient]);

  const handleFetchSuggestions = useCallback(async () => {
    if (!selectedChapterId || !isEditing || editContent.length < 50) return;

    setIsFetchingSuggestions(true);
    setSuggestions([]);
    
    try {
      const stream = await trpcClient.ai.getSuggestionsStream.query({
        authToken: token || "",
        chapterId: selectedChapterId,
        currentContent: editContent,
      });

      for await (const suggestion of stream) {
        setSuggestions(prev => [...prev, suggestion]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch suggestions");
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [selectedChapterId, isEditing, editContent, token, trpcClient]);

  const handleInsertSuggestion = useCallback((suggestionText: string) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const newContent =
      editContent.substring(0, cursorPosition) +
      "\n\n" +
      suggestionText +
      editContent.substring(cursorPosition);
    
    setEditContent(newContent);
    toast.success("Suggestion inserted!");
  }, [editContent]);

  const handleSaveChapter = () => {
    if (!selectedChapterId) return;
    updateChapterMutation.mutate({
      authToken: token || "",
      chapterId: selectedChapterId,
      content: editContent,
    });
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      deleteChapterMutation.mutate({
        authToken: token || "",
        chapterId,
      });
    }
  };

  const handleStartEditing = () => {
    if (selectedChapter) {
      setEditContent(selectedChapter.content);
      setIsEditing(true);
    }
  };

  const handleKDPMetadataSubmit = (data: KDPMetadataFormData) => {
    updateProjectMutation.mutate({
      authToken: token || "",
      projectId: parseInt(projectId),
      ...data,
    });
  };

  const handleCoverUpdate = (coverUrl: string) => {
    updateProjectMutation.mutate({
      authToken: token || "",
      projectId: parseInt(projectId),
      coverImage: coverUrl,
    });
  };

  const handleGenerateCoverUploadUrl = async (fileExtension: string) => {
    const result = await generateCoverUploadUrlMutation.mutateAsync({
      authToken: token || "",
      projectId: parseInt(projectId),
      fileExtension,
    });
    return result;
  };

  const handleGenerateAICover = async (prompt: string, style?: string) => {
    const result = await generateAICoverMutation.mutateAsync({
      authToken: token || "",
      projectId: parseInt(projectId),
      prompt,
      style,
    });
    return result;
  };

  const handleAssignAgent = (agentId: number | null) => {
    assignAgentMutation.mutate({
      authToken: token || "",
      projectId: parseInt(projectId),
      agentId,
    });
  };

  const handleSelectTitle = (title: string) => {
    updateProjectMutation.mutate({
      authToken: token || "",
      projectId: parseInt(projectId),
      title,
    });
  };

  const handleApplyMetadataSuggestions = (data: {
    genre?: string;
    categories?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
  }) => {
    updateProjectMutation.mutate({
      authToken: token || "",
      projectId: parseInt(projectId),
      ...data,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {projectQuery.isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      ) : projectQuery.data ? (
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Chapters List */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 flex-1 line-clamp-1">
                  {projectQuery.data.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {projectQuery.data.description || "Your creative project"}
              </p>
              <button
                onClick={() => setIsAddChapterModalOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-md transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Chapter</span>
              </button>
            </div>

            <div className="p-4 space-y-2">
              {projectQuery.data.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedChapterId === chapter.id
                      ? "bg-indigo-50 border-2 border-indigo-600"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">
                          Chapter {index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            chapter.status === "ai-generated"
                              ? "bg-purple-100 text-purple-800"
                              : chapter.status === "edited"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {chapter.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {chapter.title}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chapter.id);
                      }}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="flex h-full">
              <div className={`${showSuggestionsPanel ? "flex-1" : "w-full"} transition-all`}>
                {selectedChapter ? (
                  <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {selectedChapter.title}
                        </h1>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setIsAIModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>AI Generate</span>
                          </button>
                          {isEditing && (
                            <button
                              onClick={() => {
                                setShowSuggestionsPanel(!showSuggestionsPanel);
                                if (!showSuggestionsPanel && editContent.length >= 50) {
                                  handleFetchSuggestions();
                                }
                              }}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                                showSuggestionsPanel
                                  ? "bg-purple-600 text-white"
                                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              }`}
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>AI Suggestions</span>
                            </button>
                          )}
                          {!isEditing ? (
                            <button
                              onClick={handleStartEditing}
                              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <AutoSaveIndicator
                                status={saveStatus}
                                lastSavedAt={lastSavedAt}
                                onRetry={triggerSave}
                              />
                              <button
                                onClick={triggerSave}
                                disabled={updateChapterMutation.isPending || saveStatus === "saving"}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                              >
                                <Save className="w-4 h-4" />
                                <span>
                                  {saveStatus === "saving"
                                    ? "Saving..."
                                    : "Save Now"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="relative">
                          <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                            <p className="text-sm text-gray-700 flex items-center">
                              <Edit3 className="w-4 h-4 mr-2 text-indigo-600" />
                              <span className="font-medium">Editing mode active.</span>
                              <span className="ml-1">
                                {isAutoSaveEnabled 
                                  ? "Your work is being auto-saved. Use markdown for formatting!" 
                                  : "Remember to save your work. Use markdown for formatting!"}
                              </span>
                              {isAutoSaveEnabled && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                  Auto-save ON
                                </span>
                              )}
                            </p>
                          </div>
                          <textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onMouseUp={handleTextSelect}
                            onKeyUp={handleTextSelect}
                            className="w-full h-[600px] p-6 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm shadow-inner"
                            placeholder="Write your chapter content here... (supports markdown)"
                          />
                          {textSelection && toolbarPosition && !isStreamingRewrite && !isStreamingExpand && (
                            <InlineAIToolbar
                              position={toolbarPosition}
                              selectedText={textSelection.text}
                              onRewrite={handleInlineRewrite}
                              onExpand={handleInlineExpand}
                              onClose={() => {
                                setTextSelection(null);
                                setToolbarPosition(null);
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <article className="prose prose-lg max-w-none">
                          {selectedChapter.content ? (
                            <Markdown>{selectedChapter.content}</Markdown>
                          ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-xl font-semibold text-gray-700 mb-2">
                                This chapter is waiting for your creativity
                              </p>
                              <p className="text-gray-500 mb-6">
                                Click "AI Generate" to let our AI write it, or "Edit" to write it yourself
                              </p>
                              <div className="flex justify-center space-x-3">
                                <button
                                  onClick={() => setIsAIModalOpen(true)}
                                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg transform hover:scale-105 font-bold"
                                >
                                  <Sparkles className="w-5 h-5" />
                                  <span>AI Generate</span>
                                </button>
                                <button
                                  onClick={handleStartEditing}
                                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105 font-bold"
                                >
                                  <Edit3 className="w-5 h-5" />
                                  <span>Write It Myself</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-indigo-50">
                    <div className="text-center max-w-md">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <FileText className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Select a Chapter to Edit
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Choose a chapter from the sidebar to start writing, or create a new one to begin your creative journey.
                      </p>
                      <button
                        onClick={() => setIsAddChapterModalOpen(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105"
                      >
                        Create Your First Chapter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {showSuggestionsPanel && (
                <div className="w-96 border-l border-gray-200 h-full">
                  <AISuggestionsPanel
                    suggestions={suggestions}
                    isLoading={isFetchingSuggestions}
                    onInsertSuggestion={handleInsertSuggestion}
                    onClose={() => setShowSuggestionsPanel(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <div className="w-80 bg-gradient-to-br from-gray-50 to-indigo-50 border-l border-gray-200 p-6 overflow-y-auto">
            {/* Agent Assignment */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-purple-600" />
                AI Agent
              </h3>
              <div className="space-y-3">
                {projectQuery.data?.agent ? (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Current Agent:
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                        {projectQuery.data.agent.type}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">
                      {projectQuery.data.agent.name}
                    </p>
                    {projectQuery.data.agent.description && (
                      <p className="text-xs text-gray-600">
                        {projectQuery.data.agent.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                    <p className="text-sm text-gray-600">
                      No agent assigned
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setIsAgentSelectionModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md transform hover:scale-105 font-bold"
                >
                  <Bot className="w-5 h-5" />
                  <span>
                    {projectQuery.data?.agent ? "Change Agent" : "Select Agent"}
                  </span>
                </button>
              </div>
            </div>

            {/* AI Power Tools */}
            <AIToolsPanel 
              projectId={parseInt(projectId)} 
              onRefresh={() => projectQuery.refetch()}
            />

            {/* AI Metadata Tools */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI Metadata Tools
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    suggestTitlesMutation.mutate({
                      authToken: token || "",
                      projectId: parseInt(projectId),
                    });
                  }}
                  disabled={suggestTitlesMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {suggestTitlesMutation.isPending ? "Generating..." : "Suggest Titles"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    suggestMetadataMutation.mutate({
                      authToken: token || "",
                      projectId: parseInt(projectId),
                    });
                  }}
                  disabled={suggestMetadataMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>
                    {suggestMetadataMutation.isPending ? "Analyzing..." : "AI Metadata"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    generateBlurbMutation.mutate({
                      authToken: token || "",
                      projectId: parseInt(projectId),
                    });
                  }}
                  disabled={generateBlurbMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all shadow-md transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  <span>
                    {generateBlurbMutation.isPending ? "Writing..." : "Generate Blurb"}
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📚</span>
                Amazon KDP Ready
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsCoverDesignModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-md transform hover:scale-105 font-bold"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Design Cover</span>
                </button>
                <button
                  onClick={() => setIsKDPMetadataModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all shadow-md transform hover:scale-105 font-bold"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>KDP Metadata</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                Quick Actions
              </h3>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md transform hover:scale-105 font-bold"
              >
                <Download className="w-5 h-5" />
                <span>Export E-Book</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Project Stats
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Chapters</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {projectQuery.data.chapters.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Genre</span>
                  <span className="font-bold text-blue-600">
                    {projectQuery.data.genre}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Exports</span>
                  <span className="text-2xl font-bold text-green-600">
                    {projectQuery.data.exports.length}
                  </span>
                </div>
              </div>
            </div>

            {projectQuery.data.exports.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">📚</span>
                  Recent Exports
                </h4>
                <div className="space-y-2">
                  {projectQuery.data.exports.slice(0, 3).map((exp) => (
                    <a
                      key={exp.id}
                      href={exp.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all font-medium"
                    >
                      📄 {exp.format.toUpperCase()} -{" "}
                      {new Date(exp.generatedAt).toLocaleDateString()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Streaming Indicator Overlay */}
      {(isStreamingRewrite || isStreamingExpand) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
              <h3 className="text-xl font-bold text-gray-900">
                {isStreamingRewrite ? "AI is rewriting..." : "AI is expanding..."}
              </h3>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 max-h-96 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                {streamedContent || "Thinking..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      <AddChapterModal
        isOpen={isAddChapterModalOpen}
        onClose={() => setIsAddChapterModalOpen(false)}
        onSubmit={(title) => {
          createChapterMutation.mutate({
            authToken: token || "",
            projectId: parseInt(projectId),
            title,
          });
        }}
        isLoading={createChapterMutation.isPending}
      />

      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSubmit={(prompt, context) => {
          if (!selectedChapterId) return;
          generateChapterMutation.mutate({
            authToken: token || "",
            chapterId: selectedChapterId,
            prompt,
            context,
          });
        }}
        isLoading={generateChapterMutation.isPending}
        projectQuery={projectQuery.data}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        templates={templatesQuery.data || []}
        onSubmit={(format, templateId) => {
          createExportMutation.mutate({
            authToken: token || "",
            projectId: parseInt(projectId),
            format,
            templateId,
          });
        }}
        isLoading={createExportMutation.isPending}
      />

      {/* KDP Metadata Modal */}
      <KDPMetadataModal
        isOpen={isKDPMetadataModalOpen}
        onClose={() => setIsKDPMetadataModalOpen(false)}
        onSubmit={handleKDPMetadataSubmit}
        isLoading={updateProjectMutation.isPending}
        projectId={parseInt(projectId)}
        authToken={token || ""}
        initialData={
          projectQuery.data
            ? {
                isbn: projectQuery.data.isbn || undefined,
                authorName: projectQuery.data.authorName || undefined,
                publisherName: projectQuery.data.publisherName || undefined,
                publicationDate: projectQuery.data.publicationDate
                  ? new Date(projectQuery.data.publicationDate).toISOString().split("T")[0]
                  : undefined,
                categories: projectQuery.data.categories || undefined,
                keywords: projectQuery.data.keywords || undefined,
                seriesName: projectQuery.data.seriesName || undefined,
                seriesNumber: projectQuery.data.seriesNumber || undefined,
                price: projectQuery.data.price || undefined,
                currency: projectQuery.data.currency || undefined,
                ageRangeMin: projectQuery.data.ageRangeMin || undefined,
                ageRangeMax: projectQuery.data.ageRangeMax || undefined,
                enableDRM: projectQuery.data.enableDRM || false,
              }
            : undefined
        }
      />

      {/* Cover Design Modal */}
      <CoverDesignModal
        isOpen={isCoverDesignModalOpen}
        onClose={() => setIsCoverDesignModalOpen(false)}
        currentCoverUrl={projectQuery.data?.coverImage || undefined}
        onCoverUpdate={handleCoverUpdate}
        onGenerateUploadUrl={handleGenerateCoverUploadUrl}
        onGenerateAICover={handleGenerateAICover}
        isLoading={generateAICoverMutation.isPending}
      />

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        isOpen={isAgentSelectionModalOpen}
        onClose={() => setIsAgentSelectionModalOpen(false)}
        agents={agentsQuery.data || []}
        currentAgentId={projectQuery.data?.agentId || null}
        onSelectAgent={handleAssignAgent}
        isLoading={assignAgentMutation.isPending}
      />

      {/* Title Suggestions Modal */}
      <TitleSuggestionsModal
        isOpen={isTitleSuggestionsModalOpen}
        onClose={() => setIsTitleSuggestionsModalOpen(false)}
        suggestions={titleSuggestions}
        currentTitle={projectQuery.data?.title || ""}
        onSelectTitle={handleSelectTitle}
        isLoading={suggestTitlesMutation.isPending}
      />

      {/* Metadata Suggestions Modal */}
      <MetadataSuggestionsModal
        isOpen={isMetadataSuggestionsModalOpen}
        onClose={() => setIsMetadataSuggestionsModalOpen(false)}
        suggestions={metadataSuggestions}
        currentMetadata={{
          genre: projectQuery.data?.genre,
          categories: projectQuery.data?.categories,
          ageRangeMin: projectQuery.data?.ageRangeMin,
          ageRangeMax: projectQuery.data?.ageRangeMax,
        }}
        onApplySuggestions={handleApplyMetadataSuggestions}
        isLoading={suggestMetadataMutation.isPending}
      />

      {/* Blurb Generator Modal */}
      <BlurbGeneratorModal
        isOpen={isBlurbGeneratorModalOpen}
        onClose={() => setIsBlurbGeneratorModalOpen(false)}
        blurbs={blurbData}
        projectTitle={projectQuery.data?.title || ""}
        genre={projectQuery.data?.genre || ""}
        isLoading={generateBlurbMutation.isPending}
      />

      {/* ADHD Copilot - Floating AI Assistant */}
      {selectedChapter && isEditing && (
        <ADHDCopilot
          projectId={parseInt(projectId)}
          currentContent={editContent}
          wordsWritten={editContent.split(/\s+/).filter(Boolean).length}
          sessionStartTime={sessionStartTime}
        />
      )}
    </div>
  );
}

// Add Chapter Modal Component
function AddChapterModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<{ title: string }>();

  const handleFormSubmit = (data: { title: string }) => {
    onSubmit(data.title);
    reset();
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
                      <Plus className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Add New Chapter
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Expand your story
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

                <form
                  onSubmit={handleSubmit(handleFormSubmit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📖 Chapter Title
                    </label>
                    <input
                      type="text"
                      {...register("title", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="e.g., Introduction, Chapter 1, Getting Started..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Give your chapter a descriptive title
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-100">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-indigo-600 mr-2 text-lg">✨</span>
                      <span>
                        After creating the chapter, you can use AI to generate content or write it yourself!
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
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {isLoading ? "Creating..." : "Create Chapter"}
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

// AI Generation Modal Component
function AIGenerationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  projectQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, context?: string) => void;
  isLoading: boolean;
  projectQuery?: any;
}) {
  const { register, handleSubmit, reset } = useForm<{
    prompt: string;
    context: string;
  }>();

  const handleFormSubmit = (data: { prompt: string; context: string }) => {
    onSubmit(data.prompt, data.context);
    reset();
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
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        AI Content Generator
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Let AI work its magic
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

                <form
                  onSubmit={handleSubmit(handleFormSubmit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      ✨ What do you want to write about?
                    </label>
                    <textarea
                      {...register("prompt", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="e.g., Write an engaging introduction that hooks the reader and explains why this topic matters..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Be specific! The more detail you provide, the better the AI can understand your vision.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      🎨 Additional Style & Context (optional)
                    </label>
                    <textarea
                      {...register("context")}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="e.g., Use a conversational tone, include examples, make it inspiring..."
                    />
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-purple-600 mr-2 text-lg">💡</span>
                      <span>
                        Our AI will generate high-quality content based on your project's genre ({projectQuery?.genre}) and language. You can always edit the result afterward!
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
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                          <span>Generating Magic...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Generate Content</span>
                        </>
                      )}
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

// Export Modal Component
function ExportModal({
  isOpen,
  onClose,
  templates,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  templates: any[];
  onSubmit: (format: string, templateId?: number) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<{
    format: string;
    templateId: string;
  }>();

  const handleFormSubmit = (data: { format: string; templateId: string }) => {
    onSubmit(
      data.format,
      data.templateId ? parseInt(data.templateId) : undefined
    );
    reset();
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl shadow-lg">
                      <Download className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Export Your E-Book
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Ready for Amazon!
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

                <form
                  onSubmit={handleSubmit(handleFormSubmit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📦 Export Format
                    </label>
                    <select
                      {...register("format", { required: true })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                    >
                      <option value="html">HTML (Web Ready)</option>
                      <option value="pdf">PDF (Simulated)</option>
                      <option value="epub">EPUB (Simulated)</option>
                      <option value="mobi">MOBI (Simulated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      🎨 Design Template
                    </label>
                    <select
                      {...register("templateId")}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                    >
                      <option value="">Default (Clean & Professional)</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-100">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2 text-lg">🚀</span>
                      <span>
                        Your beautifully formatted e-book will be ready to download and sell on Amazon or any other platform!
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
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {isLoading ? "Exporting..." : "💰 Export & Profit"}
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
