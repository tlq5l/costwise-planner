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
  notes?: string;
  roomDetection?: RoboflowResponse;
  estimatedArea?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  estimations: EstimationResult[];
  createdAt: Date;
  updatedAt: Date;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'roomDetection' | 'success' | 'error';

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

export interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
}

export interface ProcessedRoboflowResponse extends Omit<RoboflowResponse, 'predictions'> {
  predictions: ClassifiedRoom[];
}