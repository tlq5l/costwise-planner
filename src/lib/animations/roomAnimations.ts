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
  const rooms = [...fullResponse.predictions];
  let index = 0;

  // Function to get the next room one at a time
  const getNextRoom = (): ClassifiedRoom | null => {
    if (index < rooms.length) {
      return rooms[index++];
    }
    return null;
  };

  // Function to get count of remaining rooms
  const remainingCount = (): number => {
    return rooms.length - index;
  };

  return {
    fullResponse,
    getNextRoom,
    remainingCount,
  };
}