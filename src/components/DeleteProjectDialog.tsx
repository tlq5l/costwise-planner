import { useProjects } from "@/context/ProjectsContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const DeleteProjectDialog = ({
  isOpen,
  onClose,
  projectId,
  projectName
}: DeleteProjectDialogProps) => {
  const { deleteProject } = useProjects();
  const navigate = useNavigate();

  const handleDelete = () => {
    deleteProject(projectId);

    toast({
      title: "Project deleted",
      description: `"${projectName}" has been permanently deleted`,
    });

    // Close the dialog
    onClose();

    // Navigate back to home page
    navigate("/");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold">Delete Project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>"{projectName}"</strong>?
          </p>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            This action is permanent and cannot be undone. All analyses associated with this project will also be deleted.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Project
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteProjectDialog;