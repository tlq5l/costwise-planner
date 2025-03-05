import type {
    ClassifiedRoom,
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
 * then enhances room classification with furniture detection and OCR-extracted dimensions
 */
import { createObjectURL, fileToBase64 } from "../utils/fileUtils";
import { extractDimensionsFromImage, assignDimensionsToRooms, updateRoomWithOcrDimensions } from "../dimensionExtraction";
import type { DimensionAnnotation, OcrAnalysisResult } from "@/types";

export const processFloorPlan = async (
  file: File,
  furnitureDetection?: FurnitureDetectionResponse,
  roomDetection?: ProcessedRoboflowResponse
): Promise<RoomAnalysisResult> => {
  try {
    // Create a URL for the image preview using environment-aware utility
    const imageUrl = createObjectURL(file);

    // Convert file to base64 (needed for both Roboflow and OCR)
    const base64Image = await fileToBase64(file);

    // If detection results aren't provided, fetch them
    if (!furnitureDetection) {
      const fetchedFurnitureDetection = await detectFurnitureFromBase64(base64Image);
      furnitureDetection = fetchedFurnitureDetection;
    }

    if (!roomDetection) {
      const fetchedRoomDetection = await detectAndClassifyRoomsFromBase64(base64Image);
      roomDetection = fetchedRoomDetection;
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

    // STEP 3: Extract and process dimensions using OCR
    let ocrDimensions: DimensionAnnotation[] = [];
    let roomDimensions = new Map<string, DimensionAnnotation[]>();
    let ocrEnhancedRooms = [...enhancedRooms]; // Create a copy to modify

    try {
      // Extract dimensions from the image using OCR
      ocrDimensions = await extractDimensionsFromImage(base64Image);
      
      if (ocrDimensions.length > 0) {
        console.log(`Extracted ${ocrDimensions.length} dimensions via OCR:`, ocrDimensions);
        
        // Assign dimensions to rooms based on spatial proximity
        roomDimensions = assignDimensionsToRooms(ocrDimensions, enhancedRooms);
        
        // Update room dimensions with OCR-verified values
        ocrEnhancedRooms = enhancedRooms.map(room => {
          const dimensions = roomDimensions.get(room.detection_id) || [];
          if (dimensions.length > 0) {
            return updateRoomWithOcrDimensions(room, dimensions);
          }
          return room;
        });
      }
    } catch (ocrError) {
      console.warn("OCR dimension extraction failed, continuing with AI estimates:", ocrError);
      // Continue with AI-based estimates if OCR fails
    }

    // Create enhanced room detection object with OCR-verified dimensions
    const enhancedRoomDetection: ProcessedRoboflowResponse = {
      ...roomDetection,
      predictions: ocrEnhancedRooms
    };

    // Create enhanced furniture detection object
    const enhancedFurnitureDetection: FurnitureDetectionResponse = {
      ...furnitureDetection,
      predictions: assignedFurniture
    };

    // Calculate total area with enhanced room classification and OCR dimensions
    const totalArea = calculateTotalAreaWithOcr(ocrEnhancedRooms);

    // Store OCR analysis results
    const ocrAnalysisResult: OcrAnalysisResult = {
      dimensions: ocrDimensions,
      roomDimensions: roomDimensions
    };

    // Try to get Gemini-enhanced result, but fallback if it fails
    try {
      // Import dynamically to avoid circular dependencies
      const { analyzeFloorPlan } = await import("@/services/GeminiReasoningService");

      // Call Gemini for enhanced analysis, passing the OCR-enhanced room data
      const geminiResult = await analyzeFloorPlan(enhancedRoomDetection);

      // Check if this is already a fallback result from the Gemini service
      if (geminiResult?.id?.includes('fallback_')) {
        // It's already a fallback result, so make sure we preserve that ID type
        return {
          ...geminiResult,
          totalArea: totalArea > 0 ? totalArea : (geminiResult.estimatedArea || 100),
          fileName: file.name,
          imageUrl,
          roomDetection: enhancedRoomDetection,
          furnitureDetection: enhancedFurnitureDetection,
          ocrAnalysis: ocrAnalysisResult,
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
        ocrAnalysis: ocrAnalysisResult,
        status: 'completed'
      };
    } catch (geminiError) {
      console.warn("Gemini reasoning failed, using fallback:", geminiError);

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
        ocrAnalysis: ocrAnalysisResult,
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

/**
 * Calculate total area using OCR-verified values when available
 *
 * @param rooms Array of rooms, some with OCR-verified dimensions
 * @returns Total area in square meters
 */
export function calculateTotalAreaWithOcr(rooms: ClassifiedRoom[]): number {
  let totalArea = 0;
  
  for (const room of rooms) {
    // Use OCR-verified area if available, otherwise use AI-estimated area
    if (room.ocrAreaM2) {
      totalArea += room.ocrAreaM2;
    } else if (room.dimensions && room.dimensions.areaM2) {
      totalArea += room.dimensions.areaM2;
    }
  }
  
  return totalArea;
}