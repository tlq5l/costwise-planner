import type { EstimationCategory, EstimationResult, ProcessedRoboflowResponse } from "@/types";
import { detectAndClassifyRoomsFromBase64 } from "./roboflow";

// Generate a unique ID
const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15);
};

// Simulate API processing time
const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

// Mock categories for construction cost estimation
const constructionCategories: Omit<EstimationCategory, "id">[] = [
	{
		name: "Foundation",
		cost: 0,
		description: "Concrete foundation and footings",
	},
	{
		name: "Framing",
		cost: 0,
		description: "Structural framing including walls, floors, and roof",
	},
	{
		name: "Exterior Finishes",
		cost: 0,
		description: "Siding, windows, doors, and roof covering",
	},
	{
		name: "Plumbing",
		cost: 0,
		description: "Water supply, drainage, and fixtures",
	},
	{
		name: "Electrical",
		cost: 0,
		description: "Wiring, outlets, switches, and fixtures",
	},
	{
		name: "HVAC",
		cost: 0,
		description: "Heating, ventilation, and air conditioning",
	},
	{
		name: "Interior Finishes",
		cost: 0,
		description: "Drywall, paint, flooring, and trim",
	},
	{
		name: "Cabinetry & Countertops",
		cost: 0,
		description: "Kitchen and bathroom cabinets and countertops",
	},
	{
		name: "Landscaping",
		cost: 0,
		description: "Grading, planting, and hardscaping",
	},
	{
		name: "Permits & Fees",
		cost: 0,
		description: "Building permits and inspection fees",
	},
];

// Generate costs based on room detection results
const generateCosts = async (
	imageBase64: string,
	roomDetection?: ProcessedRoboflowResponse
): Promise<EstimationCategory[]> => {
	// Get room detection results from Roboflow if not provided
	const detection = roomDetection || await detectAndClassifyRoomsFromBase64(imageBase64);

	// Calculate total area based on detected rooms
	const totalArea = detection.predictions.reduce((sum, room) => {
		return sum + room.width * room.height;
	}, 0);

	// Base cost range in dollars per square foot
	const baseCostPerSqFt = 150 + Math.random() * 100;

	// Total project cost based on detected area
	const totalProjectCost = baseCostPerSqFt * totalArea;

	// Distribution percentages for each category (should sum to 1)
	const distribution = {
		Foundation: 0.1,
		Framing: 0.15,
		"Exterior Finishes": 0.12,
		Plumbing: 0.08,
		Electrical: 0.09,
		HVAC: 0.07,
		"Interior Finishes": 0.18,
		"Cabinetry & Countertops": 0.11,
		Landscaping: 0.05,
		"Permits & Fees": 0.05,
	};

	// Apply some randomization to make estimates look more realistic
	return constructionCategories.map((category) => {
		const baseDistribution =
			distribution[category.name as keyof typeof distribution];
		const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
		const cost = Math.round(totalProjectCost * baseDistribution * randomFactor);

		return {
			id: generateId(),
			name: category.name,
			cost,
			description: category.description,
		};
	});
};

export const processFloorPlan = async (
	file: File
): Promise<EstimationResult> => {
	try {
		// Simulate processing time
		await delay(1000);

		// Convert file to base64
		const base64Image = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result as string;
				// Remove data URL prefix
				resolve(base64.split(',')[1]);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		// Create a URL for the image preview
		const imageUrl = URL.createObjectURL(file);

		// Get room detection and classification results
		const roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);

		// Calculate total area
		const estimatedArea = roomDetection.predictions.reduce((sum, room) => {
			return sum + (room.dimensions.areaFt);
		}, 0);

		// Generate cost categories based on room detection
		const categories = await generateCosts(base64Image, roomDetection);

		// Calculate total
		const totalCost = categories.reduce((sum, category) => sum + category.cost, 0);

		return {
			id: generateId(),
			totalCost,
			categories,
			currency: "USD",
			createdAt: new Date(),
			fileName: file.name,
			imageUrl,
			status: 'completed',
			roomDetection,
			estimatedArea
		};
	} catch (error) {
		console.error("Error processing floor plan:", error);
		throw new Error("Failed to process floor plan");
	}
};

/*
NOTE: In a real implementation, you would use the Google Generative AI SDK:

import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see README.md)
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_AI_API_KEY);

// For multimodal input (images)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const processFloorPlanWithGemini = async (file: File): Promise<EstimationResult> => {
  // Convert file to appropriate format for Gemini API
  const imageData = await fileToGenerativePart(file);

  // Call Gemini model with the image
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: "Analyze this floor plan and provide a detailed construction cost estimate" },
          imageData
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 4096,
    }
  });

  // Process the response
  const response = result.response;
  // ... parse the response and convert to EstimationResult format

  return estimationResult;
};

// Helper function to convert file to format required by Gemini
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await fileToBase64(file);
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type
    }
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
*/