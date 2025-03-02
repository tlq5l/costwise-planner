import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useProjects } from "@/context/ProjectsContext";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewProjectModal = ({ isOpen, onClose }: NewProjectModalProps) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const { addProject } = useProjects();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      // Basic validation
      alert("Please enter a project name");
      return;
    }

    // Create project description with location if provided
    const projectDescription = location ?
      `${description ? description + " • " : ""}Location: ${location}` :
      description;

    // Add the new project using the context
    addProject({
      name,
      description: projectDescription,
    });

    // Reset form and close modal
    setName("");
    setLocation("");
    setDescription("");
    onClose();
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
          <h2 className="text-xl font-semibold">New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium mb-1">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label htmlFor="project-location" className="block text-sm font-medium mb-1">
              Location
            </label>
            <input
              id="project-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="City, State or Address"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Brief description of the project"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Create Project
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewProjectModal;