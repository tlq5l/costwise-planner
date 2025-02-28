import type {
  CombinedFloorPlanAnalysis,
  FurnitureDetectionResponse,
  ProcessedRoboflowResponse,
  RoomAnalysisResult
} from "@/types";
import {
  assignFurnitureToRooms,
  countFurnitureByRoom,
  countFurnitureByType,
  detectFurnitureFromBase64
} from "./furnitureDetection";
import { detectAndClassifyRoomsFromBase64 } from "./roboflow";
import { calculateTotalArea, classifyRoomsByFurniture } from "./roomClassifier";

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Simulate API processing time
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Processes a floor plan image to detect rooms and furniture,
 * then enhances room classification with furniture detection
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

    // STEP 1: First detect furniture - this provides semantic clues for room classification
    // The furniture items will help us determine the function of each room
    const furnitureDetection = await detectFurnitureFromBase64(base64Image);

    // STEP 2: Then detect and initially classify rooms based on size and shape
    // This gives us the room boundaries but classification may still be preliminary
    const roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);

    // STEP 3: Assign furniture to rooms based on spatial relationships
    // This connects furniture items to their containing rooms
    const assignedFurniture = assignFurnitureToRooms(
      furnitureDetection.predictions,
      roomDetection.predictions
    );

    // STEP 4: Update room classification based on furniture
    // This is where we enhance the initial classification with semantic information from furniture
    const enhancedRooms = classifyRoomsByFurniture(
      roomDetection.predictions,
      assignedFurniture
    );

    // Create enhanced room detection object
    const enhancedRoomDetection: ProcessedRoboflowResponse = {
      ...roomDetection,
      predictions: enhancedRooms
    };

    // Create enhanced furniture detection object
    const enhancedFurnitureDetection: FurnitureDetectionResponse = {
      ...furnitureDetection,
      predictions: assignedFurniture
    };

    // Calculate total area with enhanced room classification
    const totalArea = calculateTotalArea(enhancedRooms);

    return {
      id: generateId(),
      totalArea,
      createdAt: new Date(),
      fileName: file.name,
      imageUrl,
      status: 'completed',
      roomDetection: enhancedRoomDetection,
      furnitureDetection: enhancedFurnitureDetection,
    };
  } catch (error) {
    console.error("Error processing floor plan:", error);
    throw new Error("Failed to process floor plan");
  }
};

/**
 * Combines room and furniture detection into a unified analysis
 * with enhanced room classification
 */
export const combineFloorPlanAnalysis = (
  roomDetection: ProcessedRoboflowResponse,
  furnitureDetection: FurnitureDetectionResponse
): CombinedFloorPlanAnalysis => {
  // Get the rooms and furniture
  const rooms = roomDetection.predictions;
  const furniture = furnitureDetection.predictions;

  // Assign furniture to rooms if not already done
  const assignedFurniture = furniture.some(item => item.room)
    ? furniture
    : assignFurnitureToRooms(furniture, rooms);

  // Enhance room classification with furniture data
  const enhancedRooms = classifyRoomsByFurniture(rooms, assignedFurniture);

  // Calculate room totals
  const totalArea = calculateTotalArea(enhancedRooms);
  const roomCount = enhancedRooms.length;

  // Count furniture by type
  const furnitureTotals = countFurnitureByType(assignedFurniture);

  // Count furniture by room
  const roomFurnitureCounts = countFurnitureByRoom(assignedFurniture);

  return {
    rooms: enhancedRooms,
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
 * and enhances room classification
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

    // First detect furniture
    const furnitureDetection = await detectFurnitureFromBase64(base64Image);

    // Then detect rooms
    const roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);

    // Assign furniture to rooms
    const assignedFurniture = assignFurnitureToRooms(
      furnitureDetection.predictions,
      roomDetection.predictions
    );

    // Update room classification using furniture
    const enhancedRooms = classifyRoomsByFurniture(
      roomDetection.predictions,
      assignedFurniture
    );

    // Create enhanced room detection
    const enhancedRoomDetection: ProcessedRoboflowResponse = {
      ...roomDetection,
      predictions: enhancedRooms
    };

    // Create enhanced furniture detection
    const enhancedFurnitureDetection: FurnitureDetectionResponse = {
      ...furnitureDetection,
      predictions: assignedFurniture
    };

    // Calculate total area
    const totalArea = calculateTotalArea(enhancedRooms);

    // Return the combined results
    return {
      id: generateId(),
      totalArea,
      createdAt: new Date(),
      fileName: file.name,
      imageUrl,
      status: 'completed',
      roomDetection: enhancedRoomDetection,
      furnitureDetection: enhancedFurnitureDetection,
    };
  } catch (error) {
    console.error("Error processing floor plan with animation:", error);
    throw new Error("Failed to process floor plan");
  }
}

/**
 * Process a floor plan image to generate construction cost estimation
 * using the enhanced room classification
 */
export const processFloorPlanForCost = async (
  file: File
): Promise<RoomAnalysisResult> => {
  try {
    // First process the floor plan normally to get room and furniture detection
    const analysis = await processFloorPlan(file);

    // You can extend this function to generate cost estimates based on the enhanced room classification
    // This is just a placeholder for now
    return {
      ...analysis,
      // Add cost estimation properties here
    };
  } catch (error) {
    console.error("Error processing floor plan for cost estimation:", error);
    throw new Error("Failed to process floor plan for cost estimation");
  }
};