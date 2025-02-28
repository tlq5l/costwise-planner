export interface RoomAnalysisResult {
  id: string;
  totalArea: number;
  roomDetection?: RoboflowResponse;
  furnitureDetection?: FurnitureDetectionResponse;
  createdAt: Date;
  fileName: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  analyses: RoomAnalysisResult[];
  createdAt: Date;
  updatedAt: Date;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'roomDetection' | 'furnitureDetection' | 'success' | 'error';

export interface RoboflowPoint {
  x: number;
  y: number;
}

export enum RoomType {
  UNKNOWN = "unknown",
  BEDROOM = "bedroom",
  BATHROOM = "bathroom",
  KITCHEN = "kitchen",
  LIVING_ROOM = "living room",
  DINING_ROOM = "dining room",
  HALLWAY = "hallway",
  CLOSET = "closet",
  LAUNDRY = "laundry",
  GARAGE = "garage",
  OFFICE = "office",
  OTHER = "other"
}

export enum FurnitureType {
  DOOR = "door",
  WINDOW = "window",
  TABLE = "table",
  CHAIR = "chair",
  SOFA = "sofa",
  BED = "bed",
  SINK = "sink",
  TOILET = "toilet",
  BATHTUB = "bathtub",
  STOVE = "stove",
  REFRIGERATOR = "refrigerator",
  CABINET = "cabinet",
  COUNTER = "counter",
  STAIRS = "stairs",
  OTHER = "other"
}

export interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  points: RoboflowPoint[];
  class_id: number;
  detection_id: string;
}

export interface ClassifiedRoom extends RoboflowPrediction {
  roomType: RoomType;
  color: string;
  dimensions: {
    width: number;
    height: number;
    widthFt: number;
    heightFt: number;
    area: number;
    areaFt: number;
  };
  isVisible?: boolean;
  isHighlighted?: boolean;
  isProcessing?: boolean;
}

export interface FurnitureItem {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
  furnitureType: FurnitureType;
  color: string;
  room?: string; // ID of the containing room
  isVisible?: boolean;
  isHighlighted?: boolean;
}

export interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
}

export interface FurnitureDetectionResponse {
  predictions: FurnitureItem[];
  image: {
    width: number;
    height: number;
  };
}

export interface ProcessedRoboflowResponse extends Omit<RoboflowResponse, 'predictions'> {
  predictions: ClassifiedRoom[];
}

export interface CombinedFloorPlanAnalysis {
  rooms: ClassifiedRoom[];
  furniture: FurnitureItem[];
  image: {
    width: number;
    height: number;
  };
  roomTotals: {
    totalArea: number;
    roomCount: number;
  };
  furnitureTotals: {
    [key in FurnitureType]?: number;
  };
  roomFurnitureCounts: {
    [roomId: string]: {
      [key in FurnitureType]?: number;
    };
  };
}

export interface EstimationCategory {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface EstimationResult {
  id: string;
  totalCost: number;
  categories: EstimationCategory[];
  currency: string;
  createdAt: Date;
  fileName: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  roomDetection?: ProcessedRoboflowResponse;
  furnitureDetection?: FurnitureDetectionResponse;
  estimatedArea?: number;
}