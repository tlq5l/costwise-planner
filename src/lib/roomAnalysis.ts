import type { ClassifiedRoom, ProcessedRoboflowResponse, RoomAnalysisResult } from "@/types";
import { detectAndClassifyRoomsFromBase64 } from "./roboflow";
import { calculateTotalArea } from "./roomClassifier";

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Simulate API processing time
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const processFloorPlan = async (
  file: File
): Promise<RoomAnalysisResult> => {
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
    const totalArea = calculateTotalArea(roomDetection.predictions);

    return {
      id: generateId(),
      totalArea,
      createdAt: new Date(),
      fileName: file.name,
      imageUrl,
      status: 'completed',
      roomDetection,
    };
  } catch (error) {
    console.error("Error processing floor plan:", error);
    throw new Error("Failed to process floor plan");
  }
};

/*
NOTE: In a real implementation, you could add more sophisticated room analysis here,
such as room adjacency detection, natural light analysis, etc.
*/