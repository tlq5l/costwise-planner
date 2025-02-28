import type {
  ClassifiedRoom,
  ProcessedRoboflowResponse,
  RoomAnalysisResult,
  FurnitureDetectionResponse,
  FurnitureItem,
  CombinedFloorPlanAnalysis
} from "@/types";
import { detectAndClassifyRoomsFromBase64 } from "./roboflow";
import { calculateTotalArea } from "./roomClassifier";
import {
  detectFurnitureFromBase64,
  assignFurnitureToRooms,
  countFurnitureByType,
  countFurnitureByRoom
} from "./furnitureDetection";

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Simulate API processing time
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Processes a floor plan image to detect rooms and furniture
 */
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
    
    // Get furniture detection results
    const furnitureDetection = await detectFurnitureFromBase64(base64Image);

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
      furnitureDetection,
    };
  } catch (error) {
    console.error("Error processing floor plan:", error);
    throw new Error("Failed to process floor plan");
  }
};

/**
 * Combines room and furniture detection into a unified analysis
 */
export const combineFloorPlanAnalysis = (
  roomDetection: ProcessedRoboflowResponse,
  furnitureDetection: FurnitureDetectionResponse
): CombinedFloorPlanAnalysis => {
  // Get the rooms and furniture
  const rooms = roomDetection.predictions;
  const furniture = furnitureDetection.predictions;
  
  // Assign furniture to rooms
  const assignedFurniture = assignFurnitureToRooms(furniture, rooms);
  
  // Calculate room totals
  const totalArea = calculateTotalArea(rooms);
  const roomCount = rooms.length;
  
  // Count furniture by type
  const furnitureTotals = countFurnitureByType(assignedFurniture);
  
  // Count furniture by room
  const roomFurnitureCounts = countFurnitureByRoom(assignedFurniture);
  
  return {
    rooms,
    furniture: assignedFurniture,
    image: roomDetection.image, // Both should have the same image dimensions
    roomTotals: {
      totalArea,
      roomCount
    },
    furnitureTotals,
    roomFurnitureCounts
  };
};

/**
 * Process room detection with step-by-step animation for UI
 * This version also processes furniture detection after rooms
 */
export async function processWithAnimation(
  file: File
): Promise<RoomAnalysisResult> {
  try {
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

    // Process both room and furniture detection
    const roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);
    const furnitureDetection = await detectFurnitureFromBase64(base64Image);
    
    // Calculate total area
    const totalArea = calculateTotalArea(roomDetection.predictions);

    // Return the combined results
    return {
      id: generateId(),
      totalArea,
      createdAt: new Date(),
      fileName: file.name,
      imageUrl,
      status: 'completed',
      roomDetection,
      furnitureDetection,
    };
  } catch (error) {
    console.error("Error processing floor plan with animation:", error);
    throw new Error("Failed to process floor plan");
  }
}