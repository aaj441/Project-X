import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { X, BookOpen, DollarSign, Tag, Shield, Sparkles } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface KDPMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KDPMetadataFormData) => void;
  isLoading: boolean;
  initialData?: Partial<KDPMetadataFormData>;
  projectId?: number;
  authToken?: string;
}

export interface KDPMetadataFormData {
  isbn?: string;
  authorName?: string;
  publisherName?: string;
  publicationDate?: string;
  categories?: string;
  keywords?: string;
  seriesName?: string;
  seriesNumber?: number;
  price?: number;
  currency?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  enableDRM?: boolean;
}

export function KDPMetadataModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  projectId,
  authToken,
}: KDPMetadataModalProps) {
  const trpc = useTRPC();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<KDPMetadataFormData>({
    defaultValues: initialData,
  });

  const generateKeywordsMutation = useMutation(
    trpc.ai.generateKeywords.mutationOptions({
      onSuccess: (data) => {
        setValue("keywords", data.keywordsString);
        toast.success("AI keywords generated!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate keywords");
      },
    })
  );

  const handleGenerateKeywords = () => {
    if (!projectId || !authToken) {
      toast.error("Project information not available");
      return;
    }
    generateKeywordsMutation.mutate({
      authToken,
      projectId,
    });
  };

  const handleFormSubmit = (data: KDPMetadataFormData) => {
    onSubmit(data);
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-3 rounded-xl shadow-lg">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Amazon KDP Metadata
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Optimize for Kindle Direct Publishing
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
                  className="space-y-6"
                >
                  {/* Book Details Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-orange-600" />
                      Book Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ISBN (Optional)
                        </label>
                        <input
                          type="text"
                          {...register("isbn")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="978-0-123456-78-9"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Author Name
                        </label>
                        <input
                          type="text"
                          {...register("authorName")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Publisher Name
                        </label>
                        <input
                          type="text"
                          {...register("publisherName")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Publisher or self-published"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Publication Date
                        </label>
                        <input
                          type="date"
                          {...register("publicationDate")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categories & Keywords Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-blue-600" />
                      Categories & Keywords
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Categories (BISAC codes, comma-separated)
                        </label>
                        <textarea
                          {...register("categories")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="FIC000000, FIC009000"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter BISAC category codes for better discoverability
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-900">
                            Keywords (up to 7, comma-separated)
                          </label>
                          {projectId && authToken && (
                            <button
                              type="button"
                              onClick={handleGenerateKeywords}
                              disabled={generateKeywordsMutation.isPending}
                              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold shadow-md"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>
                                {generateKeywordsMutation.isPending
                                  ? "Generating..."
                                  : "AI Suggest"}
                              </span>
                            </button>
                          )}
                        </div>
                        <textarea
                          {...register("keywords")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="thriller, suspense, mystery, detective"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Amazon KDP allows up to 7 keywords for search optimization
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Series Information Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      📚 Series Information (Optional)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Series Name
                        </label>
                        <input
                          type="text"
                          {...register("seriesName")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., The Adventure Series"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Book Number in Series
                        </label>
                        <input
                          type="number"
                          {...register("seriesNumber", { valueAsNumber: true })}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="1"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register("price", { valueAsNumber: true })}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="9.99"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Currency
                        </label>
                        <select
                          {...register("currency")}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Settings Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-gray-600" />
                      Additional Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Target Age Min (Optional)
                          </label>
                          <input
                            type="number"
                            {...register("ageRangeMin", { valueAsNumber: true })}
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            placeholder="e.g., 8"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Target Age Max (Optional)
                          </label>
                          <input
                            type="number"
                            {...register("ageRangeMax", { valueAsNumber: true })}
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            placeholder="e.g., 12"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          id="enableDRM"
                          {...register("enableDRM")}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label
                          htmlFor="enableDRM"
                          className="text-sm font-medium text-gray-900"
                        >
                          Enable DRM (Digital Rights Management)
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        DRM helps protect your content from unauthorized copying, but may limit how readers can use your book.
                      </p>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="text-orange-600 mr-2 text-lg">💡</span>
                      <span>
                        <strong>Pro Tip:</strong> Complete metadata helps readers discover your book on Amazon. Use relevant keywords and accurate categories to improve visibility!
                      </span>
                    </p>
                  </div>

                  {/* Action Buttons */}
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                    >
                      {isLoading ? "Saving..." : "Save KDP Metadata"}
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
