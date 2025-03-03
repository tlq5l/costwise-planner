import type {
    FurnitureDetectionResponse,
    ProcessedRoboflowResponse,
    RoomAnalysisResult
} from "@/types";
import {
    assignFurnitureToRooms,
    detectFurnitureFromBase64
} from "../furnitureDetection";
import { detectAndClassifyRoomsFromBase64 } from "../roboflow";
import { calculateTotalArea, classifyRoomsByFurniture } from "../roomClassifier";

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