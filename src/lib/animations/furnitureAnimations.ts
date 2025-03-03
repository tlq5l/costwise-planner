import type { FurnitureDetectionResponse, FurnitureItem } from "@/types";
import { detectFurnitureFromBase64 } from "../furnitureDetection";

/**
 * Process furniture detection with animation support for UI
 */
export async function detectFurnitureWithAnimation(
  imageBase64: string,
): Promise<{
  fullResponse: FurnitureDetectionResponse;
  getNextItem: () => FurnitureItem | null;
  remainingCount: () => number;
}> {
  // Get the full response first
  const fullResponse = await detectFurnitureFromBase64(imageBase64);
  const items = [...fullResponse.predictions];
  let index = 0;

  // Function to get the next item one at a time
  const getNextItem = (): FurnitureItem | null => {
    if (index < items.length) {
      return items[index++];
    }
    return null;
  };

  // Function to get count of remaining items
  const remainingCount = (): number => {
    return items.length - index;
  };

  return {
    fullResponse,
    getNextItem,
    remainingCount,
  };
}