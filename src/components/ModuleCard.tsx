import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, Download, Trash2, Rocket, User, Clock, FileOutput, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { soundEffects } from "~/utils/soundEffects";

type Project = {
  id: number;
  title: string;
  description: string | null;
  genre: string;
  status: string;
  coverImage: string | null;
  workflowCategory: string | null;
  healthStatus: string;
  lastRunAt: string | null;
  _count: {
    chapters: number;
    exports: number;
  };
};

type ModuleCardProps = {
  project: Project;
  onDelete: (id: number) => void;
  onAssignAgent?: (projectId: number) => void;
  onExportToCanva?: (projectId: number) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, projectId: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, projectId: number) => void;
};

export function ModuleCard({
  project,
  onDelete,
  onAssignAgent,
  onExportToCanva,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ModuleCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
    review: "bg-purple-100 text-purple-800 border-purple-200",
    finalized: "bg-green-100 text-green-800 border-green-200",
  };

  const statusEmojis = {
    draft: "📝",
    "in-progress": "⚡",
    review: "👀",
    finalized: "✅",
  };

  const healthColors = {
    active: "ring-green-500",
    error: "ring-red-500",
    pending: "ring-yellow-500",
    warning: "ring-orange-500",
  };

  const healthIcons = {
    active: CheckCircle,
    error: AlertCircle,
    pending: Clock,
    warning: AlertTriangle,
  };

  const statusColor =
    statusColors[project.status as keyof typeof statusColors] ||
    statusColors.draft;
  
  const statusEmoji =
    statusEmojis[project.status as keyof typeof statusEmojis] || "📝";

  const healthColor =
    healthColors[project.healthStatus as keyof typeof healthColors] ||
    healthColors.active;

  const HealthIcon =
    healthIcons[project.healthStatus as keyof typeof healthIcons] ||
    healthIcons.active;

  const handleExportToCanva = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEffects.export();
    onExportToCanva?.(project.id);
  };

  const handleAssignAgent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEffects.assign();
    onAssignAgent?.(project.id);
  };

  const formatLastRun = (lastRunAt: string | null) => {
    if (!lastRunAt) return "Never run";
    const date = new Date(lastRunAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, project.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, project.id)}
      onMouseEnter={() => {
        setShowTooltip(true);
        setShowQuickActions(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setShowQuickActions(false);
      }}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group transform hover:-translate-y-1 cursor-move ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${healthColor} ring-4`}
    >
      {/* Health status indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg`}>
          <HealthIcon className={`w-4 h-4 ${
            project.healthStatus === "active" ? "text-green-500" :
            project.healthStatus === "error" ? "text-red-500" :
            project.healthStatus === "pending" ? "text-yellow-500" :
            "text-orange-500"
          }`} />
        </div>
      </div>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute top-2 left-14 z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs animate-fade-in">
          <div className="font-bold mb-1">{project.title}</div>
          <div className="space-y-1 text-gray-300">
            <div>📊 {project._count.chapters} chapters, {project._count.exports} exports</div>
            <div>🕐 Last run: {formatLastRun(project.lastRunAt)}</div>
            <div>📁 Category: {project.workflowCategory || "Content"}</div>
          </div>
        </div>
      )}

      {/* Quick actions on hover */}
      {showQuickActions && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={handleAssignAgent}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-110"
            title="Assign Agent"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportToCanva}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-110"
            title="Export to Canva"
          >
            <FileOutput className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="w-20 h-20 text-white opacity-40 group-hover:scale-110 group-hover:animate-float transition-transform" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 backdrop-blur-sm ${statusColor}`}
          >
            {statusEmoji} {project.status}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-bold text-sm opacity-90">
              {project.genre}
            </div>
            <div className="text-white text-xs opacity-75 bg-black/30 px-2 py-1 rounded">
              {project.workflowCategory || "Content"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description yet..."}
        </p>

        <div className="flex items-center justify-between mb-5 text-sm">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold">{project._count.chapters}</span>
            <span className="text-gray-500 dark:text-gray-500">chapters</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-semibold">{project._count.exports}</span>
            <span className="text-gray-500 dark:text-gray-500">exports</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id.toString() }}
            onClick={() => soundEffects.launch()}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all text-center shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span>Launch Studio</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(project.id);
            }}
            className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border-2 border-transparent hover:border-red-200 dark:hover:border-red-800"
            title="Delete project"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
