/**
 * Dimension extraction module
 *
 * This module provides functions to extract and process dimension annotations
 * from floor plan images using OCR technology.
 */

import { TextAnnotation, detectText } from './visionAPI';
import { ClassifiedRoom } from "@/types";
import type { DimensionAnnotation as TypeDimensionAnnotation } from "@/types";

/**
 * Interface representing a dimension annotation extracted from OCR
 */
export interface DimensionAnnotation {
  rawText: string;              // Original text from OCR
  boundingPoly: {               // Bounding box coordinates
    vertices: Array<{
      x: number;
      y: number;
    }>;
  };
  valueInMeters: number;       // Converted value in meters
  rawValue: number;            // Original numeric value
  unit: string;                // Identified unit (e.g., mm, cm, m, ft)
  confidence?: number;          // OCR confidence score
  orientation?: 'horizontal' | 'vertical'; // Inferred orientation
  center?: {                    // Calculated center point
    x: number;
    y: number;
  };
}

/**
 * Extract dimensions from OCR text annotations
 *
 * @param textAnnotations Array of text annotations from Vision API
 * @returns Array of dimension annotations with parsed values and units
 */
export function extractDimensionsFromAnnotations(
  textAnnotations: TextAnnotation[]
): DimensionAnnotation[] {
  // Skip first annotation (it usually contains all text)
  const individualAnnotations = textAnnotations.slice(1);
  
  // Regular expressions for dimension formats
  // Matches dimensions like "3000", "3.5m", "12'6\"", etc.
  const dimensionRegex = /^[0-9]+(\.[0-9]+)?\s*(mm|cm|m|ft|in|['"′″])?$/i;
  
  const dimensions: DimensionAnnotation[] = [];
  
  for (const annotation of individualAnnotations) {
    const text = annotation.description.trim();
    
    // Check if the text matches a dimension pattern
    if (dimensionRegex.test(text)) {
      // Parse and interpret the dimension
      const { valueInMeters, rawValue, unit } = interpretDimensionText(text);
      
      // Calculate center point of the bounding polygon
      const center = calculateCenter(annotation.boundingPoly.vertices);
      
      // Infer orientation based on bounding box shape
      const orientation = inferOrientation(annotation.boundingPoly.vertices);
      
      // Create dimension annotation
      dimensions.push({
        rawText: text,
        valueInMeters,
        rawValue,
        unit,
        boundingPoly: annotation.boundingPoly,
        center,
        orientation,
      });
    }
  }
  
  // Filter out implausible dimensions
  return filterImplausibleDimensions(dimensions);
}

/**
 * Extract dimensions from an image using OCR
 *
 * @param base64Image Base64 encoded image data
 * @returns Array of dimension annotations
 */
export async function extractDimensionsFromImage(
  base64Image: string
): Promise<DimensionAnnotation[]> {
  try {
    // Detect text in the image
    const textAnnotations = await detectText(base64Image);
    
    // Extract dimensions from text annotations
    return extractDimensionsFromAnnotations(textAnnotations);
  } catch (error) {
    console.error("Error extracting dimensions from image:", error);
    return [];
  }
}

/**
 * Interpret dimension text to extract numeric value and unit
 *
 * @param text The dimension text (e.g., "3000", "3.5m", "12'6\"")
 * @returns Object with parsed values
 */
export function interpretDimensionText(
  text: string
): { valueInMeters: number; rawValue: number; unit: string } {
  // Parse numeric portion and unit
  const match = /([\d.]+)\s*([a-zA-Z'"′″]*)/i.exec(text);
  
  if (!match) {
    return { valueInMeters: 0, rawValue: 0, unit: 'unknown' };
  }
  
  const numericStr = match[1];
  const rawValue = parseFloat(numericStr);
  let unitStr = (match[2] || '').trim().toLowerCase();
  
  // Infer unit if not explicitly provided
  if (!unitStr) {
    // If the number is large (>=100), it's likely mm in architectural drawings
    // If it's small (<100), it could be meters or feet
    if (rawValue >= 100) {
      unitStr = 'mm';
    } else {
      unitStr = 'm';
    }
  }
  
  // Convert to meters (standard unit)
  let valueInMeters = rawValue;
  
  if (unitStr.includes('mm')) {
    valueInMeters = rawValue / 1000;
  } else if (unitStr.includes('cm')) {
    valueInMeters = rawValue / 100;
  } else if (unitStr.includes('ft') || unitStr.includes("'") || unitStr.includes("′")) {
    valueInMeters = rawValue * 0.3048;
  } else if (unitStr.includes('in') || unitStr.includes('"') || unitStr.includes("″")) {
    valueInMeters = rawValue * 0.0254;
  }
  
  return { valueInMeters, rawValue, unit: unitStr || 'mm' };
}

/**
 * Calculate the center point of a polygon
 *
 * @param vertices Array of vertices
 * @returns Center point coordinates
 */
function calculateCenter(vertices: Array<{ x: number; y: number }>): { x: number; y: number } {
  const sumX = vertices.reduce((sum, vertex) => sum + vertex.x, 0);
  const sumY = vertices.reduce((sum, vertex) => sum + vertex.y, 0);
  
  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length
  };
}

/**
 * Infer orientation of a dimension based on bounding box shape
 *
 * @param vertices Bounding box vertices
 * @returns 'horizontal' or 'vertical' orientation
 */
function inferOrientation(
  vertices: Array<{ x: number; y: number }>
): 'horizontal' | 'vertical' {
  // Calculate width and height of bounding box
  const minX = Math.min(...vertices.map(v => v.x));
  const maxX = Math.max(...vertices.map(v => v.x));
  const minY = Math.min(...vertices.map(v => v.y));
  const maxY = Math.max(...vertices.map(v => v.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // If width > height, it's likely a horizontal dimension
  // Otherwise, it's likely vertical
  return width > height ? 'horizontal' : 'vertical';
}

/**
 * Filter out implausible dimensions
 *
 * @param dimensions Array of dimension annotations
 * @returns Filtered array of dimension annotations
 */
function filterImplausibleDimensions(
  dimensions: DimensionAnnotation[]
): DimensionAnnotation[] {
  return dimensions.filter(dimension => {
    // Filter out dimensions that are too large or too small
    // For architectural floor plans, dimensions typically range from 0.1m to 50m
    return dimension.valueInMeters >= 0.1 && dimension.valueInMeters <= 50;
  });
}

/**
 * Assign dimensions to rooms based on spatial proximity
 *
 * @param dimensions Array of dimension annotations
 * @param rooms Array of classified rooms
 * @returns Map of room IDs to assigned dimensions
 */
export function assignDimensionsToRooms(
  dimensions: DimensionAnnotation[],
  rooms: ClassifiedRoom[]
): Map<string, DimensionAnnotation[]> {
  const roomDimensions = new Map<string, DimensionAnnotation[]>();
  
  // Initialize empty arrays for each room
  rooms.forEach(room => {
    roomDimensions.set(room.detection_id, []);
  });
  
  // Assign each dimension to the nearest room
  dimensions.forEach(dimension => {
    if (!dimension.center) return;
    
    let nearestRoom = null;
    let shortestDistance = Infinity;
    
    // Find the room with the nearest center point
    rooms.forEach(room => {
      // Check if the dimension is within or very close to the room
      if (isPointInOrNearPolygon(dimension.center!, room.points, 20)) {
        const distance = calculateDistanceToPolygon(dimension.center!, room.points);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestRoom = room;
        }
      }
    });
    
    // If a nearby room was found, assign the dimension to it
    if (nearestRoom) {
      const existingDimensions = roomDimensions.get(nearestRoom.detection_id) || [];
      existingDimensions.push(dimension);
      roomDimensions.set(nearestRoom.detection_id, existingDimensions);
    }
  });
  
  return roomDimensions;
}

/**
 * Check if a point is inside or near a polygon
 *
 * @param point The point to check
 * @param polygon Array of polygon vertices
 * @param tolerance Distance tolerance in pixels
 * @returns True if the point is in or near the polygon
 */
function isPointInOrNearPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
  tolerance: number
): boolean {
  // First check if the point is inside the polygon
  if (isPointInPolygon(point, polygon)) {
    return true;
  }
  
  // If not, check if it's within tolerance distance of any edge
  return calculateDistanceToPolygon(point, polygon) <= tolerance;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 *
 * @param point The point to check
 * @param polygon Array of polygon vertices
 * @returns True if the point is inside the polygon
 */
function isPointInPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>
): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect = ((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
      (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) /
       (polygon[j].y - polygon[i].y) + polygon[i].x);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate the minimum distance from a point to a polygon
 *
 * @param point The point
 * @param polygon Array of polygon vertices
 * @returns Minimum distance to any edge of the polygon
 */
function calculateDistanceToPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>
): number {
  let minDistance = Infinity;
  
  // Calculate distance to each edge
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const distance = distanceToLineSegment(
      point,
      polygon[i],
      polygon[j]
    );
    
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 *
 * @param point The point
 * @param lineStart Start point of the line segment
 * @param lineEnd End point of the line segment
 * @returns Distance from point to line segment
 */
function distanceToLineSegment(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Update room dimensions based on OCR-extracted dimensions
 *
 * @param room The room to update
 * @param dimensions Array of dimension annotations for the room
 * @returns Updated room with OCR-verified dimensions
 */
export function updateRoomWithOcrDimensions(
  room: ClassifiedRoom,
  dimensions: DimensionAnnotation[]
): ClassifiedRoom {
  // Make a copy of the room to avoid mutating the original
  const updatedRoom = { ...room };
  
  // Skip if no dimensions
  if (!dimensions || dimensions.length === 0) {
    return updatedRoom;
  }
  
  // Separate horizontal and vertical dimensions
  const horizontalDimensions = dimensions.filter(d => d.orientation === 'horizontal');
  const verticalDimensions = dimensions.filter(d => d.orientation === 'vertical');
  
  // Use the largest horizontal dimension as width
  if (horizontalDimensions.length > 0) {
    const maxHorizontal = horizontalDimensions.reduce(
      (max, dim) => dim.valueInMeters > max.valueInMeters ? dim : max,
      horizontalDimensions[0]
    );
    
    updatedRoom.ocrWidthM = maxHorizontal.valueInMeters;
  }
  
  // Use the largest vertical dimension as height
  if (verticalDimensions.length > 0) {
    const maxVertical = verticalDimensions.reduce(
      (max, dim) => dim.valueInMeters > max.valueInMeters ? dim : max,
      verticalDimensions[0]
    );
    
    updatedRoom.ocrHeightM = maxVertical.valueInMeters;
  }
  
  // Calculate area if both width and height are available
  if (updatedRoom.ocrWidthM && updatedRoom.ocrHeightM) {
    updatedRoom.ocrAreaM2 = updatedRoom.ocrWidthM * updatedRoom.ocrHeightM;
    updatedRoom.verifiedByOcr = true;
  }
  
  return updatedRoom;
}