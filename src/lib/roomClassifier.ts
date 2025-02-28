import type { ClassifiedRoom, RoboflowPrediction, FurnitureItem } from "@/types";
import { RoomType, FurnitureType } from "@/types";

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

// Dimension constants for classification (in square feet)
const ROOM_SIZE_THRESHOLDS = {
  TINY: 30,    // Closets, small bathrooms
  SMALL: 80,   // Bathrooms, small bedrooms
  MEDIUM: 150, // Bedrooms, kitchens
  LARGE: 250,  // Master bedrooms, living rooms
  HUGE: 400,   // Great rooms, large living spaces
};

// Aspect ratio thresholds for classification
const ASPECT_RATIO = {
  NARROW: 0.4,  // hallways, long narrow spaces
  SQUARE: 0.85, // nearly square rooms
};

// Pixels to feet conversion (approximate, can be adjusted)
// This would ideally be calculated based on known dimensions
export const PIXELS_TO_FEET = 0.1;

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
export function classifyRoom(room: RoboflowPrediction, pixelsToFeet: number = PIXELS_TO_FEET): ClassifiedRoom {
  // Calculate dimensions
  const width = room.width;
  const height = room.height;
  
  // Calculate area using the Shoelace formula for more accuracy with irregular shapes
  const area = calculatePolygonArea(room.points);
  
  const widthFt = width * pixelsToFeet;
  const heightFt = height * pixelsToFeet;
  const areaFt = area * pixelsToFeet * pixelsToFeet;

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
    else if (areaFt < ROOM_SIZE_THRESHOLDS.TINY) {
      roomType = RoomType.CLOSET;
    }
    else if (areaFt < ROOM_SIZE_THRESHOLDS.SMALL) {
      roomType = RoomType.BATHROOM;
    }
    else if (areaFt < ROOM_SIZE_THRESHOLDS.MEDIUM) {
      roomType = RoomType.BEDROOM;
    }
    else if (areaFt < ROOM_SIZE_THRESHOLDS.LARGE) {
      // More square rooms are likely living or dining rooms
      roomType = aspectRatio > ASPECT_RATIO.SQUARE
        ? RoomType.DINING_ROOM
        : RoomType.BEDROOM;
    }
    else if (areaFt < ROOM_SIZE_THRESHOLDS.HUGE) {
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
      widthFt,
      heightFt,
      area,
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
export function classifyRooms(predictions: RoboflowPrediction[], pixelsToFeet: number = PIXELS_TO_FEET): ClassifiedRoom[] {
  return predictions.map(prediction => classifyRoom(prediction, pixelsToFeet));
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
  furniture.forEach(item => {
    if (!furnitureCounts[item.furnitureType]) {
      furnitureCounts[item.furnitureType] = 0;
    }
    furnitureCounts[item.furnitureType]++;
  });

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

  // Assign scores based on furniture types
  // Bedroom indicators
  if (furnitureCounts[FurnitureType.BED]) {
    roomScores[RoomType.BEDROOM] += furnitureCounts[FurnitureType.BED] * 10;
  }
  
  // Bathroom indicators
  if (furnitureCounts[FurnitureType.TOILET]) {
    roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.TOILET] * 10;
  }
  if (furnitureCounts[FurnitureType.BATHTUB]) {
    roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.BATHTUB] * 8;
  }
  if (furnitureCounts[FurnitureType.SINK]) {
    // Sinks can be in bathrooms and kitchens, so lower weight
    roomScores[RoomType.BATHROOM] += furnitureCounts[FurnitureType.SINK] * 3;
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.SINK] * 2;
  }
  
  // Kitchen indicators
  if (furnitureCounts[FurnitureType.STOVE]) {
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.STOVE] * 10;
  }
  if (furnitureCounts[FurnitureType.REFRIGERATOR]) {
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.REFRIGERATOR] * 10;
  }
  if (furnitureCounts[FurnitureType.COUNTER]) {
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.COUNTER] * 5;
  }
  
  // Living room indicators
  if (furnitureCounts[FurnitureType.SOFA]) {
    roomScores[RoomType.LIVING_ROOM] += furnitureCounts[FurnitureType.SOFA] * 8;
  }
  
  // Dining room indicators
  if (furnitureCounts[FurnitureType.TABLE]) {
    // Tables can be in different rooms, with different weights
    roomScores[RoomType.DINING_ROOM] += furnitureCounts[FurnitureType.TABLE] * 5;
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.TABLE] * 2;
    roomScores[RoomType.OFFICE] += furnitureCounts[FurnitureType.TABLE] * 2;
  }
  
  // Chair consideration - if many chairs and a table, likely dining room
  if (furnitureCounts[FurnitureType.CHAIR] && furnitureCounts[FurnitureType.CHAIR] >= 3 && furnitureCounts[FurnitureType.TABLE]) {
    roomScores[RoomType.DINING_ROOM] += 8;
  } else if (furnitureCounts[FurnitureType.CHAIR]) {
    // Chairs can be anywhere, lower weight
    roomScores[RoomType.DINING_ROOM] += furnitureCounts[FurnitureType.CHAIR] * 1;
    roomScores[RoomType.OFFICE] += furnitureCounts[FurnitureType.CHAIR] * 1;
    roomScores[RoomType.LIVING_ROOM] += furnitureCounts[FurnitureType.CHAIR] * 0.5;
  }
  
  // Storage indicators for closets
  if (furnitureCounts[FurnitureType.CABINET]) {
    roomScores[RoomType.CLOSET] += furnitureCounts[FurnitureType.CABINET] * 3;
    roomScores[RoomType.KITCHEN] += furnitureCounts[FurnitureType.CABINET] * 2;
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
  return maxScore >= 3 ? inferredRoomType : RoomType.UNKNOWN;
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
  furniture.forEach(item => {
    if (item.room) {
      if (!furnitureByRoom[item.room]) {
        furnitureByRoom[item.room] = [];
      }
      furnitureByRoom[item.room].push(item);
    }
  });
  
  // Enhanced room classification
  return rooms.map(room => {
    // Get furniture in this room
    const roomFurniture = furnitureByRoom[room.detection_id] || [];
    
    // Infer room type from furniture
    const inferredType = inferRoomTypeFromFurniture(roomFurniture);
    
    // Only update if we inferred a specific room type and the current room type is unknown or generic
    if (inferredType !== RoomType.UNKNOWN &&
        (room.roomType === RoomType.UNKNOWN || room.roomType === RoomType.OTHER)) {
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
export function formatDimension(value: number, unit = 'ft'): string {
  return `${Math.round(value * 10) / 10} ${unit}`;
}

/**
 * Calculates the total area of all rooms
 */
export function calculateTotalArea(rooms: ClassifiedRoom[]): number {
  return rooms.reduce((total, room) => total + room.dimensions.areaFt, 0);
}