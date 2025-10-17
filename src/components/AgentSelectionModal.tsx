import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Bot, Sparkles, Check } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  type: string;
  description: string | null;
  capabilities: string | null;
  status: string;
}

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  currentAgentId: number | null;
  onSelectAgent: (agentId: number | null) => void;
  isLoading: boolean;
}

export function AgentSelectionModal({
  isOpen,
  onClose,
  agents,
  currentAgentId,
  onSelectAgent,
  isLoading,
}: AgentSelectionModalProps) {
  const getAgentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      content: "from-purple-500 to-pink-500",
      analytics: "from-blue-500 to-cyan-500",
      hr: "from-green-500 to-emerald-500",
      design: "from-orange-500 to-red-500",
      finance: "from-yellow-500 to-amber-500",
      learning: "from-indigo-500 to-purple-500",
      automation: "from-gray-500 to-slate-500",
    };
    return colors[type] || "from-gray-500 to-gray-600";
  };

  const getAgentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      content: "✍️",
      analytics: "📊",
      hr: "👥",
      design: "🎨",
      finance: "💰",
      learning: "📚",
      automation: "⚙️",
    };
    return icons[type] || "🤖";
  };

  const handleSelectAgent = (agentId: number | null) => {
    onSelectAgent(agentId);
    onClose();
  };

  const activeAgents = agents.filter((agent) => agent.status === "active");

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
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        Select AI Agent
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        Choose an AI assistant for your project
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

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Option to clear agent */}
                  <button
                    onClick={() => handleSelectAgent(null)}
                    disabled={isLoading}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      currentAgentId === null
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-3 rounded-lg">
                          <span className="text-2xl">🚫</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">No Agent</h3>
                          <p className="text-sm text-gray-600">
                            Work without AI assistance
                          </p>
                        </div>
                      </div>
                      {currentAgentId === null && (
                        <Check className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </button>

                  {/* Agent options */}
                  {activeAgents.map((agent) => {
                    const capabilities = agent.capabilities
                      ? JSON.parse(agent.capabilities)
                      : [];

                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        disabled={isLoading}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          currentAgentId === agent.id
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div
                              className={`bg-gradient-to-br ${getAgentTypeColor(
                                agent.type
                              )} p-3 rounded-lg shadow-md`}
                            >
                              <span className="text-2xl">
                                {getAgentTypeIcon(agent.type)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-bold text-gray-900">
                                  {agent.name}
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                  {agent.type}
                                </span>
                              </div>
                              {agent.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {agent.description}
                                </p>
                              )}
                              {capabilities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {capabilities.slice(0, 4).map((cap: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 font-medium"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                  {capabilities.length > 4 && (
                                    <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                                      +{capabilities.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {currentAgentId === agent.id && (
                            <Check className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeAgents.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      No Agents Available
                    </p>
                    <p className="text-gray-500">
                      AI agents will be available soon to assist with your
                      project.
                    </p>
                  </div>
                )}

                <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
                  <p className="text-sm text-gray-700 flex items-start">
                    <Sparkles className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" />
                    <span>
                      <strong>AI Agents</strong> can help with content
                      generation, analysis, and optimization. Choose one that
                      matches your project needs!
                    </span>
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
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
