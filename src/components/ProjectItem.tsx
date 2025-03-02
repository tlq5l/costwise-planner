import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Project } from "@/types";

interface ProjectItemProps {
  project: Project;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const latestAnalysis = project.analyses[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg group-hover:text-gray-900 transition-colors dark:group-hover:text-white">
              {project.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>
                {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </div>
          
          {latestAnalysis && (
            <div className="text-right">
              <div className="text-lg font-semibold">
                {Math.round(latestAnalysis.totalArea)} sq.ft
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total area
              </div>
            </div>
          )}
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 dark:text-gray-300">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {project.analyses.length} analysis{project.analyses.length !== 1 ? 'es' : ''}
          </div>
          
          <Link to={`/project/${project.id}`}>
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-medium text-gray-900 flex items-center dark:text-white"
            >
              View details
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectItem;