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

/**
 * Basic in-memory cache for analysis results to avoid re-calling Gemini if the same
 * data is analyzed multiple times. Key is a simple JSON string of the relevant data.
 */
const geminiCache = new Map<string, EstimationResult>();

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Mock categories for construction cost estimation
export const constructionCategories: Omit<EstimationCategory, "id">[] = [
  {
    name: "Foundation",
    cost: 0,
    description: "Concrete foundation and footings",
  },
  {
    name: "Framing",
    cost: 0,
    description: "Structural framing including walls, floors, and roof",
  },
  {
    name: "Exterior Finishes",
    cost: 0,
    description: "Siding, windows, doors, and roof covering",
  },
  {
    name: "Plumbing",
    cost: 0,
    description: "Water supply, drainage, and fixtures",
  },
  {
    name: "Electrical",
    cost: 0,
    description: "Wiring, outlets, switches, and fixtures",
  },
  {
    name: "HVAC",
    cost: 0,
    description: "Heating, ventilation, and air conditioning",
  },
  {
    name: "Interior Finishes",
    cost: 0,
    description: "Drywall, paint, flooring, and trim",
  },
  {
    name: "Cabinetry & Countertops",
    cost: 0,
    description: "Kitchen and bathroom cabinets and countertops",
  },
  {
    name: "Landscaping",
    cost: 0,
    description: "Grading, planting, and hardscaping",
  },
  {
    name: "Permits & Fees",
    cost: 0,
    description: "Building permits and inspection fees",
  },
];

export async function analyzeFloorPlan(
  data: ProcessedRoboflowResponse
): Promise<EstimationResult> {
  // 1) Build a cache key. We can omit huge or varying fields, focusing on stable fields.
  //    For example, we might exclude timestamps or partial furniture coords. We'll
  //    assume all relevant data is in "predictions" or "scaleFactor".
  //    This is a naive approach: if you want a more robust or collision-resistant key,
  //    consider hashing. For small usage, JSON stringify suffices.
  const cacheKey = JSON.stringify({
    predictions: data.predictions.map((p) => ({
      roomType: p.roomType,
      width: p.width,
      height: p.height,
      x: p.x,
      y: p.y,
    })),
    imageWidth: data.image.width,
    imageHeight: data.image.height,
    scaleFactor: (data as ProcessedRoboflowResponse & { scaleFactor?: number }).scaleFactor ?? 1,
  });

  if (geminiCache.has(cacheKey)) {
    // Return cached result if available
    const cachedResult = geminiCache.get(cacheKey);
    if (cachedResult) return cachedResult;
  }

  // For performance measurement:
  const startTime = performance.now();

  // Attempt the original logic
  try {
    const result = await doAnalyzeFloorPlan(data);

    const endTime = performance.now();
    console.info(
      "[GeminiReasoningService] Gemini call took",
      (endTime - startTime).toFixed(2),
      "ms."
    );

    // Cache the result
    geminiCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error("Gemini reasoning failed, using fallback:", error);
    // Return a fallback result instead of throwing
    const fallbackResult: EstimationResult = {
      id: `fallback_${generateId()}`,
      totalCost: 0,
      categories: constructionCategories.map(cat => ({
        ...cat,
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        cost: cat.name === "Foundation" ? 6000 :
            cat.name === "Framing" ? 8000 :
            cat.name === "Exterior Finishes" ? 5000 :
            cat.name === "Plumbing" ? 3000 :
            cat.name === "Electrical" ? 2000 :
            cat.name === "HVAC" ? 2000 :
            cat.name === "Interior Finishes" ? 2000 :
            cat.name === "Cabinetry & Countertops" ? 1000 :
            cat.name === "Landscaping" ? 500 :
            cat.name === "Permits & Fees" ? 500 : 0
      })),
      currency: "USD",
      createdAt: new Date(),
      fileName: "Fallback-Estimation",
      imageUrl: "",
      status: "completed"
    };

    // Calculate total cost as sum of category costs
    fallbackResult.totalCost = fallbackResult.categories.reduce((sum, cat) => sum + cat.cost, 0);

    return fallbackResult;
  }
}

/**
 * The actual analysis logic extracted from the prior code snippet.
 * We do the prompt building, API call, and JSON parse here.
 * This is separated so we can measure performance and handle caching above.
 */
async function doAnalyzeFloorPlan(
  data: ProcessedRoboflowResponse
): Promise<EstimationResult> {
  const MAX_RETRIES = 2;
  let retryCount = 0;

  // Step 1: Prepare structured input JSON from RoboFlow data
  const structuredInput = prepareInputData(data);

  // Step 2: Build a prompt (or multi-message structure)
  const prompt = buildCostEstimationPrompt(structuredInput);

  let rawOutput: string;

  while (retryCount <= MAX_RETRIES) {
    try {
      const result = await geminiModel.generateContent(prompt);
      rawOutput = result.response.text();
      break;
    } catch (err) {
      retryCount++;
      if (retryCount > MAX_RETRIES) {
        console.error("Max retries exceeded for Gemini API call");
        throw err;
      }
      console.warn(`Gemini API call failed, retrying (${retryCount}/${MAX_RETRIES})...`);
      // Exponential backoff
      await new Promise(r => setTimeout(r, 2 ** retryCount * 500));
    }
  }

  // If we got here without setting rawOutput, it means all retries failed
  if (!rawOutput) {
    throw new Error("All Gemini API retries failed");
  }

  // Step 3: Parse and validate output from Gemini
  try {
    // We need to handle the whitespace-indented JSON that Gemini returns
    const cleanedOutput = rawOutput.trim().replace(/(\s{2,}|\n)/g, '');
    const parsed = JSON.parse(cleanedOutput);

    // Basic shape check
    if (typeof parsed.totalCost !== "number" || !Array.isArray(parsed.categories)) {
      throw new Error("Invalid response format from Gemini");
    }

    // Convert to EstimationResult with type safety
    const categories: EstimationCategory[] = parsed.categories.map(
      (cat: { name: string; cost: number; description: string }, index: number) => {
        if (
          typeof cat.name !== "string" ||
          typeof cat.cost !== "number" ||
          typeof cat.description !== "string"
        ) {
          throw new Error(`Invalid category format at index ${index}`);
        }
      }
    );

    // Validate totalCost value is a number
    if (typeof parsed.totalCost !== "number") {
      throw new Error("Total cost must be a number");
    }

    // Ensure we use the value provided by the API and don't recalculate it
    const totalCost = parsed.totalCost;

    return {
      id: `gemini_${generateId()}`,
      totalCost: totalCost,
      categories,
      currency: "USD",
      createdAt: new Date(),
      fileName: "AI-Generated-Estimation",
      imageUrl: "",
      status: "completed",
    };
  } catch (error) {
    // If any error occurs during parsing or processing
    console.error("Error processing Gemini output:", error, "Raw output was:", rawOutput);
    throw new Error(`Failed to process Gemini response: ${error.message}`);
  }
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
/**
 * If the SDK eventually provides token usage metadata,
 * we could track it here. For now, we just parse JSON.
 * If we had usage info in the result object (like openAI "usage"),
 * we could log it. We'll keep a placeholder.
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
    parsed = JSON.parse(rawOutput);
  } catch (parseErr) {
    console.error("Failed to parse Gemini output as JSON:", parseErr, "\nOutput was:", rawOutput);
    // Return a fallback result instead of throwing
    return {
      id: `fallback_${Date.now()}`,
      totalCost: 0,
      categories: [],
      currency: "USD",
      createdAt: new Date(),
      fileName: "Fallback-Estimate",
      imageUrl: "",
      status: "completed"
    };
  }

  // Basic shape check
  if (
    typeof parsed.totalCost !== "number" ||
    !Array.isArray(parsed.categories)
  ) {
    console.error("Gemini output missing required fields:", parsed);
    // Return a fallback result instead of throwing
    return {
      id: `fallback_${Date.now()}`,
      totalCost: 0,
      categories: [],
      currency: "USD",
      createdAt: new Date(),
      fileName: "Fallback-Estimate",
      imageUrl: "",
      status: "completed"
    };
  }

  // Convert to EstimationResult with type safety
  try {
    const categories: EstimationCategory[] = parsed.categories.map(
      (cat: { name: string; cost: number; description: string }, index: number) => {
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
  } catch (error) {
    // If any error occurs during category mapping, return fallback
    console.error("Error processing Gemini categories:", error);
    return {
      id: `fallback_${Date.now()}`,
      totalCost: 0,
      categories: [],
      currency: "USD",
      createdAt: new Date(),
      fileName: "Fallback-Estimate",
      imageUrl: "",
      status: "completed"
    };
  }
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