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

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface RoboflowPoint {
  x: number;
  y: number;
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

export interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
}
