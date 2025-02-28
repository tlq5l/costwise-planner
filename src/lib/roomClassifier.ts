import type { ClassifiedRoom, RoboflowPrediction } from "@/types";
import { RoomType } from "@/types";

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
  const area = width * height;

  const widthFt = width * pixelsToFeet;
  const heightFt = height * pixelsToFeet;
  const areaFt = widthFt * heightFt;

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
 * Formats a dimension for display
 */
export function formatDimension(value: number, unit = 'ft'): string {
  return `${Math.round(value * 10) / 10} ${unit}`;
}