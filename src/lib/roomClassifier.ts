import type { ClassifiedRoom, FurnitureItem, RoboflowPoint, RoboflowPrediction } from "@/types";
import { FurnitureType, RoomType } from "@/types";

// Color mappings for different room types
export const ROOM_COLORS: Record<RoomType, string> = {
  [RoomType.BEDROOM]: "#4f46e5", // indigo-600
  [RoomType.BATHROOM]: "#0ea5e9", // sky-500
  [RoomType.KITCHEN]: "#16a34a", // green-600
  [RoomType.LIVING_ROOM]: "#f97316", // orange-500
  [RoomType.DINING_ROOM]: "#8b5cf6", // violet-500
  [RoomType.HALLWAY]: "#94a3b8", // slate-400
  [RoomType.CLOSET]: "#a1a1aa", // zinc-400
  [RoomType.LAUNDRY]: "#2dd4bf", // teal-400
  [RoomType.GARAGE]: "#737373", // neutral-500
  [RoomType.OFFICE]: "#f43f5e", // rose-500
  [RoomType.OTHER]: "#a8a29e", // stone-400
  [RoomType.UNKNOWN]: "#cbd5e1", // slate-300
};

// Dimension constants for classification (in square meters)
const ROOM_SIZE_THRESHOLDS = {
  TINY: 3,     // Closets, small bathrooms (converted from ~30 sq.ft)
  SMALL: 7.5,  // Bathrooms, small bedrooms (converted from ~80 sq.ft)
  MEDIUM: 14,  // Bedrooms, kitchens (converted from ~150 sq.ft)
  LARGE: 23,   // Master bedrooms, living rooms (converted from ~250 sq.ft)
  HUGE: 37,    // Great rooms, large living spaces (converted from ~400 sq.ft)
};

// Aspect ratio thresholds for classification
const ASPECT_RATIO = {
  NARROW: 0.4,  // hallways, long narrow spaces
  SQUARE: 0.85, // nearly square rooms
};

// Default pixels to meters conversion (approximate, can be adjusted)
// This would ideally be calculated based on known dimensions
export const DEFAULT_PIXELS_TO_METERS = 0.03048; // Converted from 0.1 feet (1 foot = 0.3048 meters)

/**
 * Calculate a dynamic scale factor based on a known reference measurement
 * @param referenceLength Length in meters of a known reference
 * @param referencePixels Corresponding length in pixels
 * @returns Calculated pixels-to-meters conversion factor
 */
export function calculateDynamicScale(
  referenceLength: number,
  referencePixels: number
): number {
  if (referencePixels <= 0 || referenceLength <= 0) {
    console.warn("Invalid reference measurements provided for scale calculation");
    return DEFAULT_PIXELS_TO_METERS;
  }

  return referenceLength / referencePixels;
}

/**
 * Calculate polygon area using the Shoelace formula (Surveyor's formula)
 * This provides an accurate area calculation for any polygon shape
 */
export function calculatePolygonArea(points: { x: number; y: number }[]): number {
  let area = 0;
  const n = points.length;

  // Need at least 3 points to form a polygon
  if (n < 3) return 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  area = Math.abs(area) / 2;
  return area;
}

/**
 * Try to identify a room type from the Roboflow class name
 */
export function identifyRoomTypeFromClass(className: string): RoomType {
  if (!className || typeof className !== 'string') return RoomType.UNKNOWN;

  const lowerClass = className.toLowerCase().trim();

  // Direct matches for common room types
  if (lowerClass === 'room') return RoomType.UNKNOWN; // Generic room needs further classification
  if (lowerClass === 'bathroom' || lowerClass.includes('bath') || lowerClass.includes('wc') || lowerClass.includes('toilet')) return RoomType.BATHROOM;
  if (lowerClass === 'bedroom' || lowerClass.includes('bed')) return RoomType.BEDROOM;
  if (lowerClass === 'kitchen' || lowerClass.includes('kit')) return RoomType.KITCHEN;
  if (lowerClass === 'living' || lowerClass.includes('living') || lowerClass === 'lounge') return RoomType.LIVING_ROOM;
  if (lowerClass === 'dining' || lowerClass.includes('dining')) return RoomType.DINING_ROOM;
  if (lowerClass === 'hallway' || lowerClass.includes('hall') || lowerClass.includes('corridor') || lowerClass.includes('entrance')) return RoomType.HALLWAY;
  if (lowerClass === 'closet' || lowerClass.includes('closet') || lowerClass.includes('storage') || lowerClass.includes('wardrobe')) return RoomType.CLOSET;
  if (lowerClass === 'laundry' || lowerClass.includes('laundry') || lowerClass.includes('utility')) return RoomType.LAUNDRY;
  if (lowerClass === 'garage' || lowerClass.includes('garage') || lowerClass.includes('parking')) return RoomType.GARAGE;
  if (lowerClass === 'office' || lowerClass.includes('office') || lowerClass.includes('study')) return RoomType.OFFICE;

  // Default to UNKNOWN if no match found
  return RoomType.UNKNOWN;
}

/**
 * Calculates dimensions and classifies a room based on size and aspect ratio
 */
export function classifyRoom(room: RoboflowPrediction, pixelsToMeters: number = DEFAULT_PIXELS_TO_METERS): ClassifiedRoom {
  // Calculate dimensions
  const width = room.width;
  const height = room.height;

  // Calculate area using the Shoelace formula for more accuracy with irregular shapes
  const area = calculatePolygonArea(room.points);

  const widthM = width * pixelsToMeters;
  const heightM = height * pixelsToMeters;
  const areaM2 = area * pixelsToMeters * pixelsToMeters;

  // Convert to imperial units (feet)
  const metersToFeet = 3.28084;
  const widthFt = widthM * metersToFeet;
  const heightFt = heightM * metersToFeet;
  const areaFt = areaM2 * metersToFeet * metersToFeet;

  // Calculate aspect ratio (always <= 1.0, representing narrowness)
  const aspectRatio = Math.min(width / height, height / width);

  // Determine room type based on dimensions and current classification
  let roomType = RoomType.UNKNOWN;

  // First try to use existing class information from Roboflow
  if (room.class && room.class !== "") {
    roomType = identifyRoomTypeFromClass(room.class);
  }

  // If we still have an unknown room, use size and aspect ratio
  if (roomType === RoomType.UNKNOWN) {
    // Very narrow rooms are likely hallways
    if (aspectRatio < ASPECT_RATIO.NARROW) {
      roomType = RoomType.HALLWAY;
    }
    // Classification by size
    else if (areaM2 < ROOM_SIZE_THRESHOLDS.TINY) {
      roomType = RoomType.CLOSET;
    }
    else if (areaM2 < ROOM_SIZE_THRESHOLDS.SMALL) {
      roomType = RoomType.BATHROOM;
    }
    else if (areaM2 < ROOM_SIZE_THRESHOLDS.MEDIUM) {
      roomType = RoomType.BEDROOM;
    }
    else if (areaM2 < ROOM_SIZE_THRESHOLDS.LARGE) {
      // More square rooms are likely living or dining rooms
      roomType = aspectRatio > ASPECT_RATIO.SQUARE
        ? RoomType.DINING_ROOM
        : RoomType.BEDROOM;
    }
    else if (areaM2 < ROOM_SIZE_THRESHOLDS.HUGE) {
      roomType = RoomType.LIVING_ROOM;
    }
    else {
      roomType = RoomType.LIVING_ROOM;
    }
  }

  return {
    ...room,
    roomType,
    color: ROOM_COLORS[roomType],
    dimensions: {
      width,
      height,
      widthM,
      heightM,
      area,
      areaM2,
      widthFt,
      heightFt,
      areaFt,
    },
    isVisible: true,
    isHighlighted: false,
    isProcessing: false
  };
}

/**
 * Processes all predictions in a Roboflow response and enhances with room classification
 */
export function classifyRooms(predictions: RoboflowPrediction[], pixelsToMeters: number = DEFAULT_PIXELS_TO_METERS): ClassifiedRoom[] {
  return predictions.map(prediction => classifyRoom(prediction, pixelsToMeters));
}

/**
 * Infer room type based on the furniture items present in a room
 */
export function inferRoomTypeFromFurniture(furniture: FurnitureItem[]): RoomType {
  if (!furniture || furniture.length === 0) {
    return RoomType.UNKNOWN;
  }

  // Create a counter for each furniture type
  const furnitureCounts: Record<FurnitureType, number> = {} as Record<FurnitureType, number>;

  // Count occurrences of each furniture type
  for (const item of furniture) {
    if (!furnitureCounts[item.furnitureType]) {
      furnitureCounts[item.furnitureType] = 0;
    }
    furnitureCounts[item.furnitureType]++;
  }

  // Create a score for each room type based on furniture
  const roomScores: Record<RoomType, number> = {
    [RoomType.UNKNOWN]: 0,
    [RoomType.BEDROOM]: 0,
    [RoomType.BATHROOM]: 0,
    [RoomType.KITCHEN]: 0,
    [RoomType.LIVING_ROOM]: 0,
    [RoomType.DINING_ROOM]: 0,
    [RoomType.HALLWAY]: 0,
    [RoomType.CLOSET]: 0,
    [RoomType.LAUNDRY]: 0,
    [RoomType.GARAGE]: 0,
    [RoomType.OFFICE]: 0,
    [RoomType.OTHER]: 0,
  };

  // Assign scores based on furniture types with improved weighting
  // Bedroom indicators - strong indicators with higher weight
  if (furnitureCounts[FurnitureType.BED]) {
    roomScores[RoomType.BEDROOM] += furnitureCounts[FurnitureType.BED] * 15; // Increased weighting
  }

  // Bathroom indicators - with strong distinctive elements
  if (furnitureCounts[FurnitureType.TOILET]) {
    roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.TOILET] * 15; // Increased weighting
  }
  if (furnitureCounts[FurnitureType.BATHTUB]) {
    roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.BATHTUB] * 12; // Increased weighting
  }
  if (furnitureCounts[FurnitureType.SINK]) {
    // Added conditional logic for sinks - more likely a bathroom if toilet is present
    if (furnitureCounts[FurnitureType.TOILET] || furnitureCounts[FurnitureType.BATHTUB]) {
      roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.SINK] * 5;
    } else if (furnitureCounts[FurnitureType.STOVE] || furnitureCounts[FurnitureType.REFRIGERATOR]) {
      // More likely a kitchen if stove or refrigerator is present
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.SINK] * 5;
    } else {
      // Default sink scoring when no context
      roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.SINK] * 3;
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.SINK] * 2;
    }
  }

  // Kitchen indicators - with strong distinctive elements
  if (furnitureCounts[FurnitureType.STOVE]) {
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.STOVE] * 15; // Increased weighting
  }
  if (furnitureCounts[FurnitureType.REFRIGERATOR]) {
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.REFRIGERATOR] * 15; // Increased weighting
  }
  if (furnitureCounts[FurnitureType.COUNTER]) {
    // More likely a kitchen counter if stove or refrigerator present
    if (furnitureCounts[FurnitureType.STOVE] || furnitureCounts[FurnitureType.REFRIGERATOR]) {
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.COUNTER] * 8;
    } else {
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.COUNTER] * 5;
    }
  }

  // Living room indicators
  if (furnitureCounts[FurnitureType.SOFA]) {
    roomScores[RoomType.LIVING_ROOM] += furnitureCounts[FurnitureType.SOFA] * 12; // Increased weighting
  }

  // Dining room indicators
  if (furnitureCounts[FurnitureType.TABLE]) {
    // Tables with chairs are strong indicators of dining rooms
    if (furnitureCounts[FurnitureType.CHAIR] && furnitureCounts[FurnitureType.CHAIR] >= 2) {
      roomScores[RoomType.DINING_ROOM] += furnitureCounts[FurnitureType.TABLE] * 10;
    } else {
      // Tables can be in different rooms, with different weights
      roomScores[RoomType.DINING_ROOM] += furnitureCounts[FurnitureType.TABLE] * 5;
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.TABLE] * 2;
      roomScores[RoomType.OFFICE] += furnitureCounts[FurnitureType.TABLE] * 2;
    }
  }

  // Chair consideration - if many chairs and a table, likely dining room
  if (furnitureCounts[FurnitureType.CHAIR] && furnitureCounts[FurnitureType.CHAIR] >= 3 && furnitureCounts[FurnitureType.TABLE]) {
    roomScores[RoomType.DINING_ROOM] += 10; // Increased weighting
  } else if (furnitureCounts[FurnitureType.CHAIR] && furnitureCounts[FurnitureType.CHAIR] >= 2 && !furnitureCounts[FurnitureType.TABLE]) {
    // Multiple chairs without a table could be a living room
    roomScores[RoomType.LIVING_ROOM] += 5;
  } else if (furnitureCounts[FurnitureType.CHAIR]) {
    // Individual chairs can be anywhere
    roomScores[RoomType.DINING_ROOM] += furnitureCounts[FurnitureType.CHAIR] * 1;
    roomScores[RoomType.OFFICE] += furnitureCounts[FurnitureType.CHAIR] * 1;
    roomScores[RoomType.LIVING_ROOM] += furnitureCounts[FurnitureType.CHAIR] * 0.5;
  }

  // Storage indicators for closets
  if (furnitureCounts[FurnitureType.CABINET]) {
    // Cabinets alone suggest closet; with kitchen items suggest kitchen
    if (furnitureCounts[FurnitureType.STOVE] || furnitureCounts[FurnitureType.REFRIGERATOR] || furnitureCounts[FurnitureType.SINK]) {
      roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.CABINET] * 4;
    } else {
      roomScores[RoomType.CLOSET] += furnitureCounts[FurnitureType.CABINET] * 5;
    }
  }

  // Find the room type with the highest score
  let maxScore = 0;
  let inferredRoomType = RoomType.UNKNOWN;

  for (const [roomType, score] of Object.entries(roomScores)) {
    if (score > maxScore) {
      maxScore = score;
      inferredRoomType = roomType as RoomType;
    }
  }

  // Only return a room type if we have a meaningful score
  return maxScore >= 5 ? inferredRoomType : RoomType.UNKNOWN; // Increased threshold from 3 to 5
}

/**
 * Enhanced room classification that takes furniture into account
 */
export function classifyRoomsByFurniture(
  rooms: ClassifiedRoom[],
  furniture: FurnitureItem[]
): ClassifiedRoom[] {
  // First, organize furniture by room based on the room property
  const furnitureByRoom: Record<string, FurnitureItem[]> = {};

  // Group furniture by room
  for (const item of furniture) {
    if (item.room) {
      if (!furnitureByRoom[item.room]) {
        furnitureByRoom[item.room] = [];
      }
      furnitureByRoom[item.room].push(item);
    }
  }

  // Enhanced room classification
  return rooms.map(room => {
    // Get furniture in this room
    const roomFurniture = furnitureByRoom[room.detection_id] || [];

    // Skip further processing if no furniture in the room
    if (roomFurniture.length === 0) {
      return room;
    }

    // Infer room type from furniture
    const inferredType = inferRoomTypeFromFurniture(roomFurniture);

    // Use the inferred type in more cases:
    // 1. When the current type is unknown or generic
    // 2. When furniture provides a strong classification signal
    if (inferredType !== RoomType.UNKNOWN &&
        (room.roomType === RoomType.UNKNOWN ||
         room.roomType === RoomType.OTHER ||
         // Hallways and closets often misclassified by size/shape alone
         room.roomType === RoomType.HALLWAY ||
         room.roomType === RoomType.CLOSET ||
         // For special cases: strengthen confidence in important rooms
         (inferredType === RoomType.BATHROOM && roomFurniture.some(f =>
           f.furnitureType === FurnitureType.TOILET || f.furnitureType === FurnitureType.BATHTUB)) ||
         (inferredType === RoomType.KITCHEN && roomFurniture.some(f =>
           f.furnitureType === FurnitureType.STOVE || f.furnitureType === FurnitureType.REFRIGERATOR)) ||
         (inferredType === RoomType.BEDROOM && roomFurniture.some(f =>
           f.furnitureType === FurnitureType.BED))
        )) {
      return {
        ...room,
        roomType: inferredType,
        color: ROOM_COLORS[inferredType]
      };
    }

    return room;
  });
}

/**
 * Formats a dimension for display
 */
export function formatDimension(value: number, unit = 'm'): string {
  return `${Math.round(value * 10) / 10} ${unit}`;
}

/**
 * Calculates the total area of all rooms
 */
export function calculateTotalArea(rooms: ClassifiedRoom[]): number {
  return rooms.reduce((total, room) => total + room.dimensions.areaM2, 0);
}

/**
 * Validate a polygon for accurate area calculation
 * @param points Points that make up the polygon
 * @returns Validation result with issues if any
 */
export function validatePolygon(points: RoboflowPoint[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for minimum points (3 required for a polygon)
  if (points.length < 3) {
    issues.push("Không đủ điểm để tạo đa giác (cần ít nhất 3 điểm)");
    return { valid: false, issues };
  }

  // Check if first and last points are the same (closed polygon)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const isClosed = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;

  if (!isClosed && points.length > 3) {
    // Not a deal-breaker, but should warn
    issues.push("Đa giác không đóng kín, có thể ảnh hưởng đến tính chính xác");
  }

  // Check for self-intersections (simplified check)
  // Note: A complete self-intersection check would be more complex
  const uniquePoints = new Set<string>();
  for (const point of points) {
    const pointStr = `${point.x},${point.y}`;
    if (uniquePoints.has(pointStr)) {
      issues.push("Đa giác có điểm trùng lặp, có thể gây ra giao cắt");
    }
    uniquePoints.add(pointStr);
  }

  return {
    valid: issues.length === 0 || (issues.length === 1 && !isClosed),
    issues
  };
}

/**
 * Check if two polygons overlap
 * Simple implementation using bounding boxes
 * For more accurate checks, a computational geometry library should be used
 */
export function checkRoomOverlap(room1: ClassifiedRoom, room2: ClassifiedRoom): boolean {
  // Simple bounding box check
  const r1Left = room1.x - room1.width / 2;
  const r1Right = room1.x + room1.width / 2;
  const r1Top = room1.y - room1.height / 2;
  const r1Bottom = room1.y + room1.height / 2;

  const r2Left = room2.x - room2.width / 2;
  const r2Right = room2.x + room2.width / 2;
  const r2Top = room2.y - room2.height / 2;
  const r2Bottom = room2.y + room2.height / 2;

  // Check if bounding boxes overlap
  return !(r1Right < r2Left ||
           r1Left > r2Right ||
           r1Bottom < r2Top ||
           r1Top > r2Bottom);
}

/**
 * Vietnamese-specific formatting for measurements
 * Uses comma as decimal separator
 */
export function formatVietnameseMeasurement(value: number, unit = 'm'): string {
  // Convert to string with 1 decimal place
  const valueStr = (Math.round(value * 10) / 10).toFixed(1);
  // Replace period with comma for Vietnamese format
  return `${valueStr.replace('.', ',')} ${unit}`;
}