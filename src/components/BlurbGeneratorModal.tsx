import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Sparkles, Copy, Check, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface Blurb {
  text: string;
  wordCount: number;
}

interface BlurbData {
  short: Blurb;
  medium: Blurb;
  long: Blurb;
  hookLine: string;
  targetKeywords: string[];
}

interface BlurbGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  blurbs: BlurbData | null;
  projectTitle: string;
  genre: string;
  isLoading?: boolean;
}

export function BlurbGeneratorModal({
  isOpen,
  onClose,
  blurbs,
  projectTitle,
  genre,
  isLoading = false,
}: BlurbGeneratorModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast.success(`${section} copied to clipboard!`);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
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
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 p-3 rounded-xl shadow-lg">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        AI-Generated Book Blurbs
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Compelling descriptions optimized for Amazon KDP
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

                {/* Book Info */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-6 border-2 border-orange-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Book:</p>
                  <p className="text-lg font-bold text-gray-900 mb-1">{projectTitle}</p>
                  <p className="text-sm text-gray-600">Genre: {genre}</p>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                    <p className="text-gray-600">Crafting compelling blurbs...</p>
                  </div>
                )}

                {/* Blurbs Content */}
                {!isLoading && blurbs && (
                  <div className="space-y-6">
                    {/* Hook Line */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                          Hook Line
                        </h3>
                        <button
                          onClick={() => copyToClipboard(blurbs.hookLine, "Hook Line")}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition text-sm font-semibold text-gray-700"
                        >
                          {copiedSection === "Hook Line" ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-lg text-gray-900 italic leading-relaxed">
                        "{blurbs.hookLine}"
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Perfect for social media posts and quick teasers
                      </p>
                    </div>

                    {/* Short Blurb */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Short Blurb</h3>
                          <p className="text-xs text-gray-600">{blurbs.short.wordCount} words</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(blurbs.short.text, "Short Blurb")}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition text-sm font-semibold text-gray-700"
                        >
                          {copiedSection === "Short Blurb" ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {blurbs.short.text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Ideal for: Quick previews, back cover, social media
                      </p>
                    </div>

                    {/* Medium Blurb */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Medium Blurb</h3>
                          <p className="text-xs text-gray-600">{blurbs.medium.wordCount} words</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(blurbs.medium.text, "Medium Blurb")}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-green-300 rounded-lg hover:bg-green-50 transition text-sm font-semibold text-gray-700"
                        >
                          {copiedSection === "Medium Blurb" ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {blurbs.medium.text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Ideal for: Amazon KDP description, standard book listings
                      </p>
                    </div>

                    {/* Long Blurb */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Long Blurb</h3>
                          <p className="text-xs text-gray-600">{blurbs.long.wordCount} words</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(blurbs.long.text, "Long Blurb")}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition text-sm font-semibold text-gray-700"
                        >
                          {copiedSection === "Long Blurb" ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {blurbs.long.text}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Ideal for: Detailed book pages, author websites, press kits
                      </p>
                    </div>

                    {/* Keywords */}
                    {blurbs.targetKeywords.length > 0 && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          🎯 SEO Keywords Incorporated
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {blurbs.targetKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                          These keywords have been naturally woven into the blurbs for better search visibility
                        </p>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                      <p className="text-sm text-gray-700 flex items-start">
                        <span className="text-orange-600 mr-2 text-lg">💡</span>
                        <span>
                          <strong>Pro Tip:</strong> Use the medium blurb for Amazon KDP, the short one for social media, and the long one for your author website. Mix and match elements to create your perfect description!
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
