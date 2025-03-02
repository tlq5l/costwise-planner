import DeleteProjectDialog from "@/components/DeleteProjectDialog";
import EditProjectModal from "@/components/EditProjectModal";
import Header from "@/components/Header";
import ProjectAnalytics from "@/components/ProjectAnalytics";
import { useProjects } from "@/context/ProjectsContext";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Download, Edit, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, isLoading } = useProjects();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Find the project with the matching ID
  const project = projects.find(p => p.id === projectId);

  // If project doesn't exist, show a message
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Project Details" />
        <main className="pt-24 pb-20">
          <div className="container px-4 md:px-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The project you're looking for doesn't exist or may have been deleted.
              </p>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Format dates for display
  const formattedDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Project Details" />
      <main className="pt-24 pb-20">
        <div className="container px-4 md:px-6">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>

          {/* Project header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{project.name}</h1>

                <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm text-gray-600 dark:text-gray-400">
                  {project.description && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span>{project.description}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>Created {formattedDate(project.createdAt)}</span>
                  </div>

                  <div>
                    <span>Last updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast({
                      title: "Exporting project",
                      description: "Your project is being prepared for export",
                    });
                  }}
                  className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-white border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-gray-700 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>

          {/* Project Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium">Total Area</h3>
                <p className="text-4xl mt-2 font-bold">
                  {project.analyses.length > 0
                    ? `${Math.round(project.analyses[0].totalArea)} sq.ft`
                    : "No data"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium">Analyses</h3>
                <p className="text-4xl mt-2 font-bold">{project.analyses.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium">Last Analysis</h3>
                <p className="text-4xl mt-2 font-bold">
                  {project.analyses.length > 0
                    ? formatDistanceToNow(project.analyses[0].createdAt, { addSuffix: true })
                    : "No analyses"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Project Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Analyses</h2>
              <Link
                to={`/project/${project.id}/analyze`}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                New Analysis
              </Link>
            </div>

            {project.analyses.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {project.analyses.map((analysis) => (
                    <div key={analysis.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{analysis.fileName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created {formatDistanceToNow(analysis.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{Math.round(analysis.totalArea)} sq.ft</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Total area</div>
                          </div>
                          <Link
                            to={`/project/${project.id}/analysis/${analysis.id}`}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No analyses yet for this project.</p>
                <Link
                  to={`/project/${project.id}/analyze`}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  Start First Analysis
                </Link>
              </div>
            )}
          </motion.div>

          {/* Project Analytics */}
          {project.analyses.length > 0 && (
            <ProjectAnalytics />
          )}
        </div>
      </main>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white" />
              <p>Processing...</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {project && isEditModalOpen && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
        />
      )}

      {/* Delete Project Confirmation */}
      {project && isDeleteDialogOpen && (
        <DeleteProjectDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          projectId={project.id}
          projectName={project.name}
        />
      )}
    </div>
  );
};

export default ProjectDetail;