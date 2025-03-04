import type { ClassifiedRoom, ProcessedRoboflowResponse } from "@/types";
import { detectAndClassifyRoomsFromBase64 } from "../roboflow";

/**
 * Process room detection in stages for animation
 * Returns a function that yields rooms one by one for animation
 */
export async function detectRoomsWithAnimation(imageBase64: string): Promise<{
  fullResponse: ProcessedRoboflowResponse;
  getNextRoom: () => ClassifiedRoom | null;
  remainingCount: () => number;
}> {
  // Get the full response first
  const fullResponse = await detectAndClassifyRoomsFromBase64(imageBase64);
  
  // Prepare rooms with necessary properties for furniture-based classification later
  const enhancedRooms = [...fullResponse.predictions].map(room => ({
    ...room,
    // Ensure room dimensions are properly set
    dimensions: room.dimensions || {
      width: room.width,
      height: room.height,
      widthM: room.width * 0.03048, // default scale if not set
      heightM: room.height * 0.03048,
      area: room.width * room.height,
      areaM2: room.width * room.height * 0.03048 * 0.03048,
      widthFt: room.width * 0.1, // approximate conversion
      heightFt: room.height * 0.1,
      areaFt: room.width * room.height * 0.1 * 0.1
    },
    // Ensure initial classification is set for later comparison
    initialRoomType: room.roomType
  }));
  
  // Create enhanced response
  const enhancedResponse = {
    ...fullResponse,
    predictions: enhancedRooms
  };
  
  let index = 0;

  // Function to get the next room one at a time
  const getNextRoom = (): ClassifiedRoom | null => {
    if (index < enhancedRooms.length) {
      return enhancedRooms[index++];
    }
    return null;
  };

  // Function to get count of remaining rooms
  const remainingCount = (): number => {
    return enhancedRooms.length - index;
  };

  return {
    fullResponse: enhancedResponse,
    getNextRoom,
    remainingCount,
  };
}