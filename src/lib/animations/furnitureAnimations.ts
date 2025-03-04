import type { FurnitureDetectionResponse, FurnitureItem } from "@/types";
import { FurnitureType } from "@/types";
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

  // Ensure each furniture item has proper data for room classification later
  const items = [...fullResponse.predictions].map(item => ({
    ...item,
    // Initialize furniture type data if not already set
    furnitureType: item.furnitureType || getFurnitureTypeFromClass(item.class),
    // Initialize color if not already set
    color: item.color || getColorForFurnitureType(item.furnitureType || getFurnitureTypeFromClass(item.class))
  }));

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
    fullResponse: {
      ...fullResponse,
      predictions: items
    },
    getNextItem,
    remainingCount,
  };
}

/**
 * Helper function to map class name to furniture type if needed
 */
function getFurnitureTypeFromClass(className: string): FurnitureType {
  // Map common class names to furniture types
  if (!className) return FurnitureType.OTHER;

  const lowerName = className.toLowerCase();

  if (lowerName.includes('sofa') || lowerName.includes('couch')) return FurnitureType.SOFA;
  if (lowerName.includes('chair')) return FurnitureType.CHAIR;
  if (lowerName.includes('table')) return FurnitureType.TABLE;
  if (lowerName.includes('bed')) return FurnitureType.BED;
  if (lowerName.includes('toilet')) return FurnitureType.TOILET;
  if (lowerName.includes('sink')) return FurnitureType.SINK;
  if (lowerName.includes('bath') || lowerName.includes('shower')) return FurnitureType.BATHTUB;
  if (lowerName.includes('door')) return FurnitureType.DOOR;
  if (lowerName.includes('window')) return FurnitureType.WINDOW;
  if (lowerName.includes('stove') || lowerName.includes('oven')) return FurnitureType.STOVE;
  if (lowerName.includes('fridge') || lowerName.includes('refrigerator')) return FurnitureType.REFRIGERATOR;
  if (lowerName.includes('cabinet') || lowerName.includes('storage')) return FurnitureType.CABINET;
  if (lowerName.includes('counter')) return FurnitureType.COUNTER;
  if (lowerName.includes('stair')) return FurnitureType.STAIRS;

  return FurnitureType.OTHER;
}

/**
 * Helper function to get color for furniture type
 */
function getColorForFurnitureType(type: FurnitureType): string {
  // Import colors from furnitureDetection.ts or define defaults
  const colors = {
    [FurnitureType.DOOR]: "#FF5733",
    [FurnitureType.WINDOW]: "#33A8FF",
    [FurnitureType.TABLE]: "#33FF57",
    [FurnitureType.CHAIR]: "#FF33F5",
    [FurnitureType.SOFA]: "#33FFF5",
    [FurnitureType.BED]: "#5733FF",
    [FurnitureType.SINK]: "#33FFE0",
    [FurnitureType.TOILET]: "#F5FF33",
    [FurnitureType.BATHTUB]: "#338AFF",
    [FurnitureType.STOVE]: "#FF3333",
    [FurnitureType.REFRIGERATOR]: "#33FF8A",
    [FurnitureType.CABINET]: "#A833FF",
    [FurnitureType.COUNTER]: "#FFB833",
    [FurnitureType.STAIRS]: "#FF5733",
    [FurnitureType.OTHER]: "#AAAAAA"
  };

  return colors[type] || "#AAAAAA";
}