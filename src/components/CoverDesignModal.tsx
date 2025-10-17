import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { X, Image, Upload, Sparkles, Loader2 } from "lucide-react";

interface CoverDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoverUrl?: string;
  onCoverUpdate: (coverUrl: string) => void;
  onGenerateUploadUrl: (fileExtension: string) => Promise<{ uploadUrl: string; publicUrl: string }>;
  onGenerateAICover: (prompt: string, style?: string) => Promise<{ coverUrl: string }>;
  isLoading: boolean;
}

interface AICoverFormData {
  prompt: string;
  style: string;
}

export function CoverDesignModal({
  isOpen,
  onClose,
  currentCoverUrl,
  onCoverUpdate,
  onGenerateUploadUrl,
  onGenerateAICover,
  isLoading,
}: CoverDesignModalProps) {
  const [mode, setMode] = useState<"choose" | "upload" | "ai">("choose");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AICoverFormData>();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get file extension
      const extension = selectedFile.name.split(".").pop() || "jpg";

      // Get presigned URL from backend
      const { uploadUrl, publicUrl } = await onGenerateUploadUrl(extension);

      // Upload file directly to MinIO
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploadProgress(100);

      // Update project with new cover URL
      onCoverUpdate(publicUrl);

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setMode("choose");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload cover image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAIGenerate = async (data: AICoverFormData) => {
    try {
      const result = await onGenerateAICover(data.prompt, data.style);
      onCoverUpdate(result.coverUrl);
      reset();
      setMode("choose");
    } catch (error) {
      console.error("AI generation error:", error);
    }
  };

  const handleClose = () => {
    setMode("choose");
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    <div className="bg-gradient-to-br from-pink-600 to-purple-600 p-3 rounded-xl shadow-lg">
                      <Image className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Cover Design Tool
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Create or upload your book cover
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Current Cover Preview */}
                {currentCoverUrl && mode === "choose" && (
                  <div className="mb-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Current Cover</h3>
                    <img
                      src={currentCoverUrl}
                      alt="Current cover"
                      className="w-48 h-auto rounded-lg shadow-lg mx-auto"
                    />
                  </div>
                )}

                {/* Mode Selection */}
                {mode === "choose" && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setMode("upload")}
                      className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border-2 border-blue-200 transition-all group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Upload Custom Cover
                          </h3>
                          <p className="text-sm text-gray-600">
                            Upload your own professionally designed cover image
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setMode("ai")}
                      className="w-full p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border-2 border-purple-200 transition-all group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            Generate with AI
                          </h3>
                          <p className="text-sm text-gray-600">
                            Let AI create a stunning cover design for you
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Upload Mode */}
                {mode === "upload" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                      <label className="block text-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="space-y-4">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-w-xs mx-auto rounded-lg shadow-lg"
                            />
                          ) : (
                            <div className="py-12">
                              <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                              <p className="text-lg font-semibold text-gray-900 mb-2">
                                Click to select cover image
                              </p>
                              <p className="text-sm text-gray-600">
                                PNG, JPG, or GIF (recommended: 1600x2560px)
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Selected:</strong> {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}

                    {isUploading && (
                      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          <p className="text-sm font-semibold text-gray-900">
                            Uploading cover...
                          </p>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("choose");
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isUploading ? "Uploading..." : "Upload Cover"}
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Generation Mode */}
                {mode === "ai" && (
                  <form onSubmit={handleSubmit(handleAIGenerate)} className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            ✨ Describe your ideal cover
                          </label>
                          <textarea
                            {...register("prompt", {
                              required: "Please describe your cover design",
                            })}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={4}
                            placeholder="e.g., A mysterious forest at twilight with a glowing path, dark fantasy style, ethereal atmosphere..."
                          />
                          {errors.prompt && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.prompt.message}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Be specific about colors, mood, elements, and style
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            🎨 Style Preference
                          </label>
                          <select
                            {...register("style")}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="professional">Professional & Clean</option>
                            <option value="artistic">Artistic & Creative</option>
                            <option value="minimalist">Minimalist & Modern</option>
                            <option value="dramatic">Dramatic & Bold</option>
                            <option value="elegant">Elegant & Sophisticated</option>
                            <option value="playful">Playful & Fun</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-200">
                      <p className="text-sm text-gray-700 flex items-start">
                        <span className="text-purple-600 mr-2 text-lg">💡</span>
                        <span>
                          <strong>Tip:</strong> AI will create a unique cover based on your book's title and genre. The more detail you provide, the better the result!
                        </span>
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setMode("choose")}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>Generate Cover</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
