import axios from 'axios';

export interface RoomDetectionResult {
    predictions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
        class: string;
    }>;
    image: {
        width: number;
        height: number;
    };
}

const API_KEY = "oru2Kv8shKMEebi3jNUk";
const MODEL_ENDPOINT = "https://outline.roboflow.com/room-detection-6nzte/1";

/**
 * Detect rooms in an image using base64 encoded image data
 */
export async function detectRoomsFromBase64(imageBase64: string): Promise<RoomDetectionResult> {
    try {
        const response = await axios({
            method: "POST",
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                confidence: 0.2, // Set 20% confidence threshold
                iou_threshold: 0.5 // Default IoU threshold
            },
            data: imageBase64,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to detect rooms: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Detect rooms in an image using a URL
 */
export async function detectRoomsFromUrl(imageUrl: string): Promise<RoomDetectionResult> {
    try {
        const response = await axios({
            method: "POST",
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                confidence: 0.2, // Set 20% confidence threshold
                iou_threshold: 0.5, // Default IoU threshold
                image: imageUrl
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to detect rooms from URL: ${error.message}`);
        }
        throw error;
    }
}