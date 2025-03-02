import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import FileUploader from "@/components/FileUploader";
import RoomAnalysisResult from "@/components/RoomAnalysisResult";
import ProjectItem from "@/components/ProjectItem";
import ProjectAnalytics from "@/components/ProjectAnalytics";
import { RoomAnalysisResult as RoomAnalysisResultType } from "@/types";
import { useProjects } from "@/context/ProjectsContext";

const Home = () => {
  const [analysisResult, setAnalysisResult] = useState<RoomAnalysisResultType | null>(null);
  const { projects } = useProjects(); // Get projects from context
  
  const handleAnalysisComplete = (result: RoomAnalysisResultType) => {
    setAnalysisResult(result);
    
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
      <Header title="Floor Plan Analyzer" />
      
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
                AI-Powered Room Area Calculator
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Upload your floor plan and get detailed room measurements in seconds, powered by advanced AI analysis.
              </p>
            </motion.div>

            {/* Quick Intro & Dashboard Overview Section */}
            <section className="py-6">
              <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium">Projects in Progress</h3>
                  <p className="text-4xl mt-2 font-bold">{projects.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium">Estimated Cost Savings</h3>
                  <p className="text-4xl mt-2 font-bold">$28,000</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium">Leftover Materials</h3>
                  <p className="text-4xl mt-2 font-bold">12 Items</p>
                </div>
              </div>
            </section>
            
            <FileUploader onAnalysisComplete={handleAnalysisComplete} />

            {analysisResult && (
              <>
                <RoomAnalysisResult result={analysisResult} />
                {/* Insert the new ProjectAnalytics section here */}
                <ProjectAnalytics />
              </>
            )}
          </div>
        </section>
        
        {!analysisResult && (
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
                {projects.map((project) => (
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
                <span className="text-white font-medium text-xs">F</span>
              </div>
              <span className="text-sm font-medium">Floor Plan Analyzer</span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Floor Plan Analyzer. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;