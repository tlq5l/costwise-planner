import type { Project, RoomAnalysisResult } from "@/types";
import axios from "axios";

// Define the LocalStorage types
interface StoredProject
	extends Omit<Project, "createdAt" | "updatedAt" | "analyses"> {
	createdAt: string;
	updatedAt: string;
	analyses: StoredAnalysis[];
}

interface StoredAnalysis extends Omit<RoomAnalysisResult, "createdAt"> {
	createdAt: string;
}

// This would be an environment variable in a real application
const API_BASE_URL = process.env.API_URL || "https://api.example.com";

// Configure axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Projects API
export const projectsApi = {
	// Get all projects
	async getProjects(): Promise<Project[]> {
		try {
			// For now, use local storage instead of actual API call
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			if (storedProjects) {
				const projects = JSON.parse(storedProjects) as StoredProject[];
				return projects.map((project) => ({
					...project,
					createdAt: new Date(project.createdAt),
					updatedAt: new Date(project.updatedAt),
					analyses: project.analyses.map((analysis) => ({
						...analysis,
						createdAt: new Date(analysis.createdAt),
					})),
				}));
			}
			return [];

			// This would be the actual API call in a real implementation:
			// const response = await api.get('/projects');
			// return response.data;
		} catch (error) {
			console.error("Error fetching projects:", error);
			throw error;
		}
	},

	// Get a project by ID
	async getProjectById(id: string): Promise<Project | null> {
		try {
			// For now, use local storage
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			if (storedProjects) {
				const projects = JSON.parse(storedProjects) as StoredProject[];
				const project = projects.find((p) => p.id === id);
				if (project) {
					return {
						...project,
						createdAt: new Date(project.createdAt),
						updatedAt: new Date(project.updatedAt),
						analyses: project.analyses.map((analysis) => ({
							...analysis,
							createdAt: new Date(analysis.createdAt),
						})),
					};
				}
			}
			return null;

			// This would be the actual API call:
			// const response = await api.get(`/projects/${id}`);
			// return response.data;
		} catch (error) {
			console.error(`Error fetching project ${id}:`, error);
			throw error;
		}
	},

	// Create a new project
	async createProject(
		projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "analyses">,
	): Promise<Project> {
		try {
			// Create new project with ID and dates
			const newProject: Project = {
				...projectData,
				id: Math.random().toString(36).substring(2, 15),
				analyses: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// For now, update local storage
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			const projects = storedProjects
				? (JSON.parse(storedProjects) as StoredProject[])
				: [];
			const updatedProjects = [...projects, newProject];
			localStorage.setItem(
				"floor_plan_analyzer_projects",
				JSON.stringify(updatedProjects),
			);

			return newProject;

			// This would be the actual API call:
			// const response = await api.post('/projects', projectData);
			// return response.data;
		} catch (error) {
			console.error("Error creating project:", error);
			throw error;
		}
	},

	// Update a project
	async updateProject(updatedProject: Project): Promise<Project> {
		try {
			// For now, update local storage
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			if (storedProjects) {
				const projects = JSON.parse(storedProjects) as StoredProject[];
				const updatedProjects = projects.map((project) =>
					project.id === updatedProject.id
						? { ...updatedProject, updatedAt: new Date() }
						: project,
				);
				localStorage.setItem(
					"floor_plan_analyzer_projects",
					JSON.stringify(updatedProjects),
				);
			}

			return {
				...updatedProject,
				updatedAt: new Date(),
			};

			// This would be the actual API call:
			// const response = await api.put(`/projects/${updatedProject.id}`, updatedProject);
			// return response.data;
		} catch (error) {
			console.error(`Error updating project ${updatedProject.id}:`, error);
			throw error;
		}
	},

	// Delete a project
	async deleteProject(id: string): Promise<void> {
		try {
			// For now, update local storage
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			if (storedProjects) {
				const projects = JSON.parse(storedProjects) as StoredProject[];
				const updatedProjects = projects.filter((project) => project.id !== id);
				localStorage.setItem(
					"floor_plan_analyzer_projects",
					JSON.stringify(updatedProjects),
				);
			}

			// This would be the actual API call:
			// await api.delete(`/projects/${id}`);
		} catch (error) {
			console.error(`Error deleting project ${id}:`, error);
			throw error;
		}
	},

	// Add an analysis to a project
	async addAnalysisToProject(
		projectId: string,
		analysis: RoomAnalysisResult,
	): Promise<Project> {
		try {
			// For now, update local storage
			const storedProjects = localStorage.getItem(
				"floor_plan_analyzer_projects",
			);
			if (storedProjects) {
				const projects = JSON.parse(storedProjects) as StoredProject[];
				const updatedProjects = projects.map((project) => {
					if (project.id === projectId) {
						return {
							...project,
							analyses: [analysis, ...project.analyses],
							updatedAt: new Date(),
						};
					}
					return project;
				});
				localStorage.setItem(
					"floor_plan_analyzer_projects",
					JSON.stringify(updatedProjects),
				);

				// Return the updated project
				const updatedProject = updatedProjects.find((p) => p.id === projectId);
				if (updatedProject) {
					return {
						...updatedProject,
						createdAt: new Date(updatedProject.createdAt),
						updatedAt: new Date(),
						analyses: updatedProject.analyses.map((a) => ({
							...a,
							createdAt: new Date(a.createdAt),
						})),
					};
				}
			}

			throw new Error(`Project ${projectId} not found`);

			// This would be the actual API call:
			// const response = await api.post(`/projects/${projectId}/analyses`, analysis);
			// return response.data;
		} catch (error) {
			console.error(`Error adding analysis to project ${projectId}:`, error);
			throw error;
		}
	},
};

// Analyses API
export const analysesApi = {
	// Process a floor plan image
	async processFloorPlan(
		file: File,
		projectId?: string,
	): Promise<RoomAnalysisResult> {
		try {
			// This would be the actual API call to process the floor plan
			// For now, we'll use the existing local processing function

			// Create a FormData object
			const formData = new FormData();
			formData.append("file", file);
			if (projectId) {
				formData.append("projectId", projectId);
			}

			// Mock API call - in reality this would be:
			// const response = await api.post('/analyses/process', formData, {
			//   headers: { 'Content-Type': 'multipart/form-data' }
			// });
			// return response.data;

			// For now, just return a mock result
			return {
				id: Math.random().toString(36).substring(2, 15),
				totalArea: 2000,
				createdAt: new Date(),
				fileName: file.name,
				imageUrl: URL.createObjectURL(file),
				status: "completed",
			};
		} catch (error) {
			console.error("Error processing floor plan:", error);
			throw error;
		}
	},
};

export default api;
