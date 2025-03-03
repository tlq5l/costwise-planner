import type {
    CombinedFloorPlanAnalysis,
    FurnitureDetectionResponse,
    ProcessedRoboflowResponse,
    RoomAnalysisResult
} from "@/types";
import { processFloorPlan } from "./analysis/floorPlanProcessor";
import {
    assignFurnitureToRooms,
    countFurnitureByRoom,
    countFurnitureByType
} from "./furnitureDetection";
import { calculateTotalArea, classifyRoomsByFurniture } from "./roomClassifier";

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
 export const processFloorPlan = async (
  file: File
): Promise<RoomAnalysisResult> => {
  try {
    // 1) Simulate some processing delay (optional)
    await delay(1000);

    // 2) Convert file to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 3) Create a preview URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);

    // 4) Furniture detection from base64
    const furnitureDetection = await detectFurnitureFromBase64(base64Image);

    // 5) Room detection & classification
    const roomDetection = await detectAndClassifyRoomsFromBase64(base64Image);

    // 6) Assign furniture to rooms
    const assignedFurniture = assignFurnitureToRooms(
      furnitureDetection.predictions,
      roomDetection.predictions
    );

    // 7) Enhanced room classification using furniture
    const enhancedRooms = classifyRoomsByFurniture(
      roomDetection.predictions,
      assignedFurniture
    );

    const enhancedRoomDetection: ProcessedRoboflowResponse = {
      ...roomDetection,
      predictions: enhancedRooms
    };
    const enhancedFurnitureDetection: FurnitureDetectionResponse = {
      ...furnitureDetection,
      predictions: assignedFurniture
    };

    const totalArea = calculateTotalArea(enhancedRooms);

    // 8) Attempt a final cost reasoning with Gemini
    // We'll build a partial ProcessedRoboflowResponse containing the new data
    const geminiInput: ProcessedRoboflowResponse = {
      ...enhancedRoomDetection,
      // scaleFactor is optional if we want Gemini to see a scaled area
      image: enhancedRoomDetection.image
    };

    let geminiEstimation: EstimationResult | null = null;
    try {
      // We expect GeminiReasoningService to return EstimationResult
      geminiEstimation = await import("@/services/GeminiReasoningService")
        .then(({ analyzeFloorPlan }) => analyzeFloorPlan(geminiInput));
    } catch (geminiErr) {
      console.warn("Gemini reasoning failed, will fallback to basic estimate:", geminiErr);
    }

    // 9) If Gemini fails or is unavailable, fallback to a basic cost function
    if (!geminiEstimation) {
      geminiEstimation = basicFallbackCost(enhancedRoomDetection);
    }

    // 10) Merge the Gemini cost result with the final RoomAnalysisResult
    geminiEstimation.fileName = file.name;
    geminiEstimation.imageUrl = imageUrl;
    geminiEstimation.roomDetection = enhancedRoomDetection;
    geminiEstimation.furnitureDetection = enhancedFurnitureDetection;
    geminiEstimation.status = "completed";

    return geminiEstimation;
  } catch (error) {
    console.error("Error processing floor plan with Gemini logic:", error);
    throw new Error("Failed to process floor plan");
  }
};

function basicFallbackCost(roomData: ProcessedRoboflowResponse): EstimationResult {
  // This fallback returns a simplified cost distribution
  const totalAreaM2 = calculateTotalArea(roomData.predictions);
  const baseCost = totalAreaM2 * 300; // $300 per m² as a naive guess

  const distribution: { [key: string]: number } = {
    "Foundation": 0.1,
    "Framing": 0.15,
    "Exterior Finishes": 0.12,
    "Plumbing": 0.08,
    "Electrical": 0.09,
    "HVAC": 0.07,
    "Interior Finishes": 0.18,
    "Cabinetry & Countertops": 0.11,
    "Landscaping": 0.05,
    "Permits & Fees": 0.05,
  };

  const categories: EstimationCategory[] = Object.entries(distribution).map(([name, pct], idx) => {
    const cost = Math.round(baseCost * pct);
    return {
      id: `cat_${idx}`,
      name,
      cost,
      description: `Cost for ${name.toLowerCase()} (fallback)`,
    };
  });

  const totalCost = categories.reduce((acc, cat) => acc + cat.cost, 0);

  return {
    id: `fallback_${Date.now()}`,
    totalCost,
    categories,
    currency: "USD",
    createdAt: new Date(),
    fileName: "",
    imageUrl: "",
    status: "completed",
    roomDetection: roomData,
    furnitureDetection: undefined,
    estimatedArea: totalAreaM2,
  };
}

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
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