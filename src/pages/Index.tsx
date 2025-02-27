
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import FileUploader from "@/components/FileUploader";
import EstimationResult from "@/components/EstimationResult";
import ProjectItem from "@/components/ProjectItem";
import { EstimationResult as EstimationResultType, Project } from "@/types";

// Sample recent projects data
const recentProjects: Project[] = [
  {
    id: "1",
    name: "Modern Farmhouse",
    description: "Single-family residence with open floor plan and high ceilings",
    estimations: [
      {
        id: "101",
        totalCost: 425000,
        categories: [],
        currency: "USD",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        fileName: "farmhouse_floorplan.png",
        imageUrl: "",
        status: "completed"
      }
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "2",
    name: "Urban Loft Renovation",
    description: "Converting industrial space to modern living area with exposed brick",
    estimations: [
      {
        id: "102",
        totalCost: 285000,
        categories: [],
        currency: "USD",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        fileName: "loft_plans.jpg",
        imageUrl: "",
        status: "completed"
      }
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    id: "3",
    name: "Coastal Cottage",
    description: "Beach-adjacent residence with wrap-around porch and open kitchen",
    estimations: [
      {
        id: "103",
        totalCost: 380000,
        categories: [],
        currency: "USD",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fileName: "cottage_blueprint.pdf",
        imageUrl: "",
        status: "completed"
      }
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
];

const Home = () => {
  const [estimation, setEstimation] = useState<EstimationResultType | null>(null);
  
  const handleEstimationComplete = (result: EstimationResultType) => {
    setEstimation(result);
    
    // Scroll to the results after a short delay
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.8,
        behavior: "smooth"
      });
    }, 200);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="pt-24 pb-20">
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                AI-Powered Construction Cost Estimation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Upload your floor plan and get an accurate cost breakdown in seconds, powered by advanced AI analysis.
              </p>
            </motion.div>
            
            <FileUploader onEstimationComplete={handleEstimationComplete} />
            
            {estimation && (
              <EstimationResult result={estimation} />
            )}
          </div>
        </section>
        
        {!estimation && (
          <section className="py-12">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col md:flex-row justify-between items-baseline mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
                <a 
                  href="#" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-300"
                >
                  View all projects
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProjects.map((project) => (
                  <ProjectItem key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <footer className="py-10 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mr-2">
                <span className="text-white font-medium text-xs">C</span>
              </div>
              <span className="text-sm font-medium">CostWise Planner</span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} CostWise. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
