import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project } from '@/types';

// Sample initial data
const initialProjects: Project[] = [
  {
    id: "1",
    name: "Modern Farmhouse",
    description: "Single-family residence with open floor plan and high ceilings",
    analyses: [
      {
        id: "101",
        totalArea: 2250,
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
    analyses: [
      {
        id: "102",
        totalArea: 1850,
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
    analyses: [
      {
        id: "103",
        totalArea: 1920,
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

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'analyses'>) => void;
  updateProject: (updatedProject: Project) => void;
  // Optional: Methods we might add in future phases
  deleteProject?: (id: string) => void;
  getProjectById?: (id: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Storage key for local storage persistence
const STORAGE_KEY = 'floor_plan_analyzer_projects';

export function ProjectsProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, otherwise use initialProjects
  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    if (savedProjects) {
      try {
        // Parse dates correctly from localStorage
        const parsed = JSON.parse(savedProjects);
        return parsed.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          analyses: project.analyses.map((analysis: any) => ({
            ...analysis,
            createdAt: new Date(analysis.createdAt)
          }))
        }));
      } catch (error) {
        console.error('Error parsing projects from localStorage:', error);
        return initialProjects;
      }
    }
    return initialProjects;
  });

  // Persist to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'analyses'>) => {
    const newProject: Project = {
      ...projectData,
      id: Math.random().toString(36).substring(2, 15), // Simple ID generation
      analyses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Put new projects at the beginning of the array so they appear first in the list
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === updatedProject.id
          ? { ...updatedProject, updatedAt: new Date() }
          : project
      )
    );
  };

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

// Custom hook to use the projects context
export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}