import { useState } from "react";
import { ChevronRight, ChevronLeft, User, Clock, TrendingUp, Rocket } from "lucide-react";

type AgentAssignment = {
  projectId: number;
  projectTitle: string;
  agentName: string;
  agentType: string;
};

type RecentRun = {
  projectId: number;
  projectTitle: string;
  timestamp: string;
  status: string;
};

type TrendingWorkflow = {
  name: string;
  category: string;
  usageCount: number;
};

type AccessHierarchyPanelProps = {
  agentAssignments?: AgentAssignment[];
  recentRuns?: RecentRun[];
  trendingWorkflows?: TrendingWorkflow[];
};

export function AccessHierarchyPanel({
  agentAssignments = [],
  recentRuns = [],
  trendingWorkflows = [],
}: AccessHierarchyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-r-xl shadow-lg hover:shadow-xl transition-all"
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed left-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 shadow-2xl z-30 transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Studio Control</span>
          </h2>

          {/* Agent Assignments */}
          <section className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Agent Assignments</span>
            </h3>
            <div className="space-y-2">
              {agentAssignments.length > 0 ? (
                agentAssignments.map((assignment) => (
                  <div
                    key={assignment.projectId}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {assignment.projectTitle}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Agent: <span className="font-medium text-indigo-600 dark:text-indigo-400">{assignment.agentName}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Type: {assignment.agentType}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No agents assigned yet
                </p>
              )}
            </div>
          </section>

          {/* Recent Module Runs */}
          <section className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Recent Runs</span>
            </h3>
            <div className="space-y-2">
              {recentRuns.length > 0 ? (
                recentRuns.map((run, index) => (
                  <div
                    key={`${run.projectId}-${index}`}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {run.projectTitle}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : run.status === "running"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No recent activity
                </p>
              )}
            </div>
          </section>

          {/* Trending Workflows */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Workflows</span>
            </h3>
            <div className="space-y-2">
              {trendingWorkflows.length > 0 ? (
                trendingWorkflows.map((workflow, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800"
                  >
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {workflow.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {workflow.category}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {workflow.usageCount} uses
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No trending workflows
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
