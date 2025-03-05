/**
 * Google Cloud Vision API service for OCR text detection
 *
 * This file provides functions to interact with the Google Cloud Vision API
 * for detecting text in floor plan images.
 */

/**
 * Interface for text annotation bounding box vertices
 */
interface Vertex {
  x: number;
  y: number;
}

/**
 * Interface for text annotation bounding polygon
 */
interface BoundingPoly {
  vertices: Vertex[];
}

/**
 * Interface for text annotation returned by Vision API
 */
export interface TextAnnotation {
  description: string;
  boundingPoly: BoundingPoly;
  locale?: string;
}

/**
 * Entity annotation returned by Vision API library
 */
export interface IEntityAnnotation {
  description?: string;
  boundingPoly?: BoundingPoly;
  locale?: string;
}

/**
 * Interface for Vision API response
 */
interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: TextAnnotation[];
    error?: {
      code: number;
      message: string;
    };
  }>;
}

/**
 * Call Google Cloud Vision API to detect text in an image
 *
 * @param base64Image Base64 encoded image data
 * @returns Array of text annotations with bounding boxes
 */
export async function detectText(base64Image: string): Promise<TextAnnotation[]> {
  try {
    // In a production environment, this API key should be stored securely
    // and the API request should be made through a proxy server
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      console.warn("Missing Google Cloud Vision API Key. OCR functionality will not work.");
      throw new Error("Missing Google Cloud Vision API Key");
    }
    
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 100
            }
          ]
        }
      ]
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as VisionApiResponse;
    
    // Check for API-level errors
    if (data.responses[0].error) {
      const error = data.responses[0].error;
      throw new Error(`Vision API error: ${error.code} ${error.message}`);
    }
    
    return data.responses[0].textAnnotations || [];
  } catch (error) {
    console.error("Error calling Vision API:", error);
    throw error;
  }
}

/**
 * Alternative implementation using the @google-cloud/vision package
 * This is more appropriate for server-side usage where authentication is more secure
 */
export async function detectTextWithLibrary(base64Image: string): Promise<TextAnnotation[]> {
  try {
    // This would require proper configuration with environment variables
    // and would typically be used in a server-side context
    
    // Dynamically import to avoid bundling server libraries in client code
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    
    // Creates a client
    const client = new ImageAnnotatorClient();
    
    // Build the request payload
    const request = {
      image: {
        content: base64Image
      },
      features: [
        {
          type: 'TEXT_DETECTION'
        }
      ]
    };
    
    // Makes the request
    const [result] = await client.annotateImage(request);
    
    // Convert IEntityAnnotation[] to TextAnnotation[] before returning
    const textAnnotations = result.textAnnotations || [];
    return textAnnotations.map(item => ({
      description: item.description || '',
      boundingPoly: {
        vertices: (item.boundingPoly?.vertices || []).map(vertex => ({
          x: vertex.x || 0,
          y: vertex.y || 0
        }))
      },
      locale: item.locale
    }));
  } catch (error) {
    console.error("Error calling Vision API with library:", error);
    throw error;
  }
}