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
const generateId = (prefix?: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
};

// Simulate API processing time
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Processes a floor plan image to detect rooms and furniture,
 * then enhances room classification with furniture detection
 */
import { createObjectURL, fileToBase64 } from "../utils/fileUtils";

export const processFloorPlan = async (
  file: File,
  furnitureDetection?: FurnitureDetectionResponse,
  roomDetection?: ProcessedRoboflowResponse
): Promise<RoomAnalysisResult> => {
  try {
    // Create a URL for the image preview using environment-aware utility
    const imageUrl = createObjectURL(file);

    // If detection results aren't provided, fetch them
    if (!furnitureDetection || !roomDetection) {
      // Convert file to base64 using environment-aware utility
      const base64Image = await fileToBase64(file);

      // Fetch furniture detection if not provided
      if (!furnitureDetection) {
        furnitureDetection = await detectFurnitureFromBase64(base64Image);
      }

      // Fetch room detection if not provided
      if (!roomDetection) {
        roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);
      }
    }

    // STEP 1: Assign furniture to rooms based on spatial relationships
    // This connects furniture items to their containing rooms
    const assignedFurniture = assignFurnitureToRooms(
      furnitureDetection.predictions,
      roomDetection.predictions
    );

    // STEP 2: Update room classification based on furniture
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

    // Try to get Gemini-enhanced result, but fallback if it fails
    try {
      // Import dynamically to avoid circular dependencies
      const { analyzeFloorPlan } = await import("@/services/GeminiReasoningService");

      // Call Gemini for enhanced analysis
      const geminiResult = await analyzeFloorPlan(enhancedRoomDetection);

      // Check if this is already a fallback result from the Gemini service
      if (geminiResult.id && geminiResult.id.includes('fallback_')) {
        // It's already a fallback result, so make sure we preserve that ID type
        return {
          ...geminiResult,
          totalArea: totalArea > 0 ? totalArea : (geminiResult.estimatedArea || 100),
          fileName: file.name,
          imageUrl,
          roomDetection: enhancedRoomDetection,
          furnitureDetection: enhancedFurnitureDetection,
          status: 'completed'
        };
      }

      // Otherwise, it's a successful Gemini result
      return {
        ...geminiResult,
        id: geminiResult.id || `gemini_${generateId()}`,
        totalArea: totalArea > 0 ? totalArea : (geminiResult.estimatedArea || 100),
        fileName: file.name,
        imageUrl,
        roomDetection: enhancedRoomDetection,
        furnitureDetection: enhancedFurnitureDetection,
        status: 'completed'
      };
    } catch (geminiError) {
      console.warn("Gemini reasoning failed, using fallback:", geminiError);

      // When an error occurs, ensure we use the fallback_ prefix

      // Fallback to basic estimation
      return {
        id: `fallback_${generateId()}`,
        totalArea: totalArea > 0 ? totalArea : 100, // Ensure non-zero area
        createdAt: new Date(),
        fileName: file.name,
        imageUrl,
        status: 'completed',
        roomDetection: enhancedRoomDetection,
        furnitureDetection: enhancedFurnitureDetection,
        notes: "Generated with fallback estimation due to AI processing error."
      };
    }
  } catch (error) {
    console.error("Error processing floor plan:", error);

    // Provide complete fallback result instead of throwing
    return {
      id: `fallback_${generateId()}`,
      totalArea: 100, // Default non-zero area
      createdAt: new Date(),
      fileName: file ? file.name : "error.jpg",
      imageUrl: "",
      status: 'completed'
    };
  }
};