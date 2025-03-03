import { analyzeFloorPlan } from "@/services/GeminiReasoningService";
import type { ProcessedRoboflowResponse } from "@/types";
import { RoomType } from "@/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

// We can mock geminiModel here to simulate calls.
vi.mock("@/lib/geminiClient", () => {
  return {
    geminiModel: {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => `{
            "totalCost": 50000,
            "categories": [
              {
                "name": "Foundation",
                "cost": 12000,
                "description": "Mocked foundation"
              },
              {
                "name": "Framing",
                "cost": 8000,
                "description": "Mocked framing"
              }
            ]
          }`
        }
      })
    }
  };
});

describe("GeminiReasoningService analyzeFloorPlan()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a valid EstimationResult when the mock is correct", async () => {
    const data: ProcessedRoboflowResponse = {
      predictions: [
        {
          x: 100,
          y: 200,
          width: 50,
          height: 40,
          confidence: 0.9,
          class: "bedroom",
          class_id: 1,
          detection_id: "d1",
          points: [],
          roomType: RoomType.BEDROOM,
          color: "#fff",
          dimensions: {
            width: 50,
            height: 40,
            widthFt: 0,
            heightFt: 0,
            widthM: 0,
            heightM: 0,
            area: 2000,
            areaFt: 0,
            areaM2: 0
          }
        }
      ],
      image: { width: 800, height: 600 }
    };

    const result = await analyzeFloorPlan(data);
    expect(result).toBeDefined();
    expect(result.totalCost).toBe(50000);
    expect(result.categories.length).toBe(2);
    expect(result.categories[0].name).toBe("Foundation");
  });

  it("should cache repeated requests for the same data", async () => {
    const data: ProcessedRoboflowResponse = {
      predictions: [],
      image: { width: 800, height: 600 }
    };
    // First call triggers mock
    await analyzeFloorPlan(data);
    // Second call should get cached result (so no second generateContent call)
    await analyzeFloorPlan(data);

    const { geminiModel } = await import("@/lib/geminiClient");
    expect(geminiModel.generateContent).toHaveBeenCalledTimes(1);
  });

  it("should fallback if parse fails", async () => {
    const { geminiModel } = await import("@/lib/geminiClient");
    // Force it to return invalid JSON
    (geminiModel.generateContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      response: { text: () => "INVALID JSON" }
    });

    const data: ProcessedRoboflowResponse = {
      predictions: [],
      image: { width: 800, height: 600 }
    };
    const result = await analyzeFloorPlan(data);

    expect(result).toBeDefined();
    expect(result.categories).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.fileName).toBe("Fallback-Estimate");
  });
});