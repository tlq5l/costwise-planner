import type { RoboflowPoint, RoboflowResponse, ProcessedRoboflowResponse, ClassifiedRoom } from '@/types';
import { classifyRooms } from './roomClassifier';
import axios from 'axios';

const API_KEY = "oru2Kv8shKMEebi3jNUk";
const MODEL_ENDPOINT = "https://outline.roboflow.com/room-detection-6nzte/1";

interface RawPrediction {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    class: string;
}

/**
 * Transform raw prediction data to include required properties
 */
function transformPrediction(prediction: RawPrediction, index: number) {
    return {
        ...prediction,
        // Generate points array from bounding box
        points: [
            { x: prediction.x - prediction.width/2, y: prediction.y - prediction.height/2 },
            { x: prediction.x + prediction.width/2, y: prediction.y - prediction.height/2 },
            { x: prediction.x + prediction.width/2, y: prediction.y + prediction.height/2 },
            { x: prediction.x - prediction.width/2, y: prediction.y + prediction.height/2 }
        ],
        // Generate unique class_id and detection_id if not provided by API
        class_id: index + 1,
        detection_id: `detection_${Date.now()}_${index}`
    };
}

/**
 * Detect rooms in an image using base64 encoded image data
 */
export async function detectRoomsFromBase64(imageBase64: string): Promise<RoboflowResponse> {
    try {
        const response = await axios({
            method: "POST",
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                confidence: 0.2,
                iou_threshold: 0.5
            },
            data: imageBase64,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Transform the predictions to include all required properties
        const transformedData = {
            ...response.data,
            predictions: response.data.predictions.map(transformPrediction)
        };

        return transformedData;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to detect rooms: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Enhanced room detection that includes classification
 */
export async function detectAndClassifyRoomsFromBase64(imageBase64: string): Promise<ProcessedRoboflowResponse> {
    try {
        const detection = await detectRoomsFromBase64(imageBase64);
        
        // Classify the rooms based on dimensions
        const classifiedRooms = classifyRooms(detection.predictions);
        
        return {
            ...detection,
            predictions: classifiedRooms
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to classify rooms: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Process room detection in stages for animation
 * Returns a function that yields rooms one by one for animation
 */
export async function detectRoomsWithAnimation(imageBase64: string): Promise<{
    fullResponse: ProcessedRoboflowResponse,
    getNextRoom: () => ClassifiedRoom | null,
    remainingCount: () => number
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
        remainingCount
    };
}

/**
 * Detect rooms in an image using a URL
 */
export async function detectRoomsFromUrl(imageUrl: string): Promise<RoboflowResponse> {
    try {
        const response = await axios({
            method: "POST",
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                confidence: 0.2,
                iou_threshold: 0.5,
                image: imageUrl
            }
        });

        // Transform the predictions to include all required properties
        const transformedData = {
            ...response.data,
            predictions: response.data.predictions.map(transformPrediction)
        };

        return transformedData;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to detect rooms from URL: ${error.message}`);
        }
        throw error;
    }
}