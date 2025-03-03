import { geminiModel } from "@/lib/geminiClient";
import type {
    EstimationCategory,
    EstimationResult,
    ProcessedRoboflowResponse
} from "@/types";

/**
 * The GeminiReasoningService orchestrates calls to the Gemini 2.0 Flash model
 * to obtain advanced reasoning for construction cost estimation and analysis.
 *
 * PHASE 3 focuses on:
 * - Core Reasoning Service (3.1)
 * - Sequential Reasoning Implementation (3.2)
 * - Analysis Modules placeholders (3.3)
 * - Output Structuring (3.4)
 *
 * Adjust or expand as your app evolves (e.g., if you add more steps to multi-step reasoning).
 */

/**
 * analyzeFloorPlan:
 * High-level entry point for Gemini-based floor plan analysis.
 *
 * @param data  The ProcessedRoboflowResponse from prior CV steps (rooms & furniture).
 * @returns     A Promise resolving to EstimationResult, or throwing on error.
 */
export async function analyzeFloorPlan(
  data: ProcessedRoboflowResponse
): Promise<EstimationResult> {
  // 1) Prepare structured input JSON from RoboFlow data
  const structuredInput = prepareInputData(data);

  // 2) Build a prompt
  const prompt = buildCostEstimationPrompt(structuredInput);

  // 3) Call the Gemini 2.0 Flash model
  let rawOutput: string;
  try {
    const result = await geminiModel.generateContent([prompt]);
    rawOutput = result.response.text();
  } catch (err) {
    console.error("Gemini API call failed:", err);
    throw new Error("GeminiReasoningService: API call to Gemini failed.");
  }

  // 4) Parse and validate output from Gemini
  return parseEstimationOutput(rawOutput);
}

/**
 * prepareInputData:
 * Converts the RoboFlow/room-detection data into a concise JSON
 * that Gemini can interpret. This is where you'd also integrate
 * any "Analysis Modules" or validation (3.3). For example:
 * - measurement validation
 * - cross-checking furniture for better classification
 * - or a multi-step approach to refine classification
 *
 * @param data The processed RoboFlow output
 * @returns A minimal object with all the necessary fields for cost reasoning
 */
function prepareInputData(data: ProcessedRoboflowResponse): object {
  // Example: compile an array of rooms with type & area in m^2
  const rooms = data.predictions.map((room, idx) => {
    // If your code has more robust dimension logic (area, scale factor),
    // incorporate that here. This is a placeholder example:
    const area = room.dimensions.areaM2; // or compute area if needed
    const typeName = room.roomType ? room.roomType : `Room_${idx + 1}`;

    return {
      type: typeName,
      area: Number(area.toFixed(2)),
    };
  });

  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
  const roomCount = rooms.length;

  return {
    rooms,
    totalArea: Number(totalArea.toFixed(2)),
    roomCount,
    // If you have furniture, you could also summarize furniture items here
    // or pass them separately for advanced analysis
  };
}

/**
 * buildCostEstimationPrompt:
 * Example single-step prompt that instructs Gemini to produce a
 * cost breakdown. Mentions each category we want. If you use an array of
 * messages, you can set roles (system, user, etc.). This simplified approach
 * just uses one text prompt for demonstration.
 *
 * @param input The structured floor plan data
 */
function buildCostEstimationPrompt(input: object): string {
  // Provide a clear instruction plus the JSON data.
  const categoriesList = `
Available categories to itemize costs:
1. Foundation
2. Framing
3. Exterior Finishes
4. Plumbing
5. Electrical
6. HVAC
7. Interior Finishes
8. Cabinetry & Countertops
9. Landscaping
10. Permits & Fees
`;

  // You might adapt or refine this prompt to reference your existing
  // logic, distribution preferences, or multi-step instructions.
  return `You are a construction cost estimation assistant.
We have a floor plan with the following summary data in JSON:
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

${categoriesList}

Please return a JSON object with the following structure:
{
  "totalCost": number,
  "categories": [
    {
      "name": string,
      "cost": number,
      "description": string
    }
  ]
}

Ensure you break down costs realistically among all 10 categories (some might be zero).
Output only valid JSON. No extra commentary.`;
}

/**
 * parseEstimationOutput:
 * Safely parse the raw string from Gemini, then validate the shape
 * to meet the EstimationResult interface. Expand if you have more fields.
 *
 * @param rawOutput The raw text from the model
 */
function parseEstimationOutput(rawOutput: string): EstimationResult {
  interface ParsedOutput {
    totalCost: number;
    categories: {
      name: string;
      cost: number;
      description: string;
    }[];
  }

  let parsed: ParsedOutput;
  try {
    parsed = JSON.parse(rawOutput) as ParsedOutput;
  } catch (parseError) {
    console.error("Failed to parse Gemini JSON output.", parseError);
    console.error("Gemini output was:", rawOutput);
    throw new Error("Gemini output was not valid JSON.");
  }

  // Basic shape check
  if (
    typeof parsed.totalCost !== "number" ||
    !Array.isArray(parsed.categories)
  ) {
    console.error("Gemini output missing required fields:", parsed);
    throw new Error("Gemini result missing required fields.");
  }

  // Convert to EstimationResult with type safety
  const categories: EstimationCategory[] = parsed.categories.map(
    (cat, index: number) => {
      if (
        typeof cat.name !== "string" ||
        typeof cat.cost !== "number" ||
        typeof cat.description !== "string"
      ) {
        throw new Error(
          `Invalid category at index ${index}: ${JSON.stringify(cat)}`
        );
      }
      return {
        id: `cat_${index}`, // or create a unique ID
        name: cat.name,
        cost: cat.cost,
        description: cat.description,
      };
    }
  );

  // Return a final EstimationResult object
  const estimation: EstimationResult = {
    id: `gemini_${Date.now()}`,
    totalCost: parsed.totalCost,
    categories,
    currency: "USD", // or a dynamic currency
    createdAt: new Date(),
    fileName: "GeminiAI-Estimated", // or set accordingly
    imageUrl: "",
    status: "completed",
    // If you'd like to store the raw input or any other fields, do so here
    roomDetection: undefined,
    furnitureDetection: undefined,
    estimatedArea: undefined,
  };

  return estimation;
}

/**
 * Example: multiStepAnalysis (placeholder)
 *
 * If you want sequential calls or multiple-phase reasoning (3.2),
 * you could have a function like this. For instance:
 *
 * 1) Step 1: Enhanced Room Classification
 * 2) Step 2: Measurement Validation
 * 3) Step 3: Cost Calculation
 *
 * Each step calls geminiModel with a partial prompt + result of prior step.
 * This sample is just a placeholder stub; implement as needed.
 */
/*
async function multiStepAnalysis(data: ProcessedRoboflowResponse) {
  // Step 1: ...
  // Step 2: ...
  // Step 3: ...
  // Return final EstimationResult
}
*/