import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, Download, Trash2 } from "lucide-react";

type Project = {
  id: number;
  title: string;
  description: string | null;
  genre: string;
  status: string;
  coverImage: string | null;
  _count: {
    chapters: number;
    exports: number;
  };
};

type ProjectCardProps = {
  project: Project;
  onDelete: (id: number) => void;
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
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

  const statusColor =
    statusColors[project.status as keyof typeof statusColors] ||
    statusColors.draft;
  
  const statusEmoji =
    statusEmojis[project.status as keyof typeof statusEmojis] || "📝";

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group transform hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white opacity-40 group-hover:scale-110 transition-transform" />
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
          <div className="text-white font-bold text-sm opacity-90">
            {project.genre}
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description yet..."}
        </p>

        <div className="flex items-center justify-between mb-5 text-sm">
          <div className="flex items-center space-x-1 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">{project._count.chapters}</span>
            <span className="text-gray-500">chapters</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Download className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{project._count.exports}</span>
            <span className="text-gray-500">exports</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id.toString() }}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all text-center shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Open Studio
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(project.id);
            }}
            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
            title="Delete project"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
