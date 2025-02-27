
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
