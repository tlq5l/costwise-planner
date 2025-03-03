import { processFloorPlan } from "@/lib/analysis/floorPlanProcessor";
import { describe, expect, it, vi } from "vitest";

/**
 * This test file demonstrates an integration test for the entire pipeline:
 *  1) We simulate RoboFlow detection
 *  2) We then call processFloorPlan (which calls Gemini internally)
 *  3) We check the final RoomAnalysisResult
 */

// We'll mock only the RoboFlow detection calls here:
vi.mock("@/lib/furnitureDetection", () => ({
  detectFurnitureFromBase64: vi.fn().mockResolvedValue({
    predictions: [],
    image: { width: 800, height: 600 }
  })
}));
vi.mock("@/lib/roboflow", () => ({
  detectAndClassifyRoomsFromBase64: vi.fn().mockResolvedValue({
    predictions: [
      {
        x: 100, y: 200,
        width: 50, height: 40,
        confidence: 0.9,
        class: "living_room",
        points: [],
        class_id: 1,
        detection_id: "r1",
        roomType: "living room",
        color: "#ccc",
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
  })
}));

// We'll also mock gemini calls:
vi.mock("@/lib/geminiClient", () => ({
  geminiModel: {
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          totalCost: 40000,
          categories: [
            { name: "Foundation", cost: 10000, description: "Integration mock" },
            { name: "Framing", cost: 8000, description: "Integration mock" }
          ]
        })
      }
    })
  }
}));

describe("Integration: processFloorPlan end-to-end", () => {
  it("should produce a final RoomAnalysisResult with AI-based cost estimate", async () => {
    const mockFile = new File(["dummyContent"], "dummy.png", { type: "image/png" });
    const result = await processFloorPlan(mockFile);

    expect(result.status).toBe("completed");
    expect(result.totalArea).toBeGreaterThan(0);
    // The Gemini-based cost from our mock
    expect(result.roomDetection).toBeDefined();
    expect(result.furnitureDetection).toBeDefined();
    // Because gemini calls returned totalCost=40000
    expect(result.id).toContain("gemini_");
  });

  it("should fall back if gemini fails for some reason", async () => {
    // Force gemini to fail
    const { geminiModel } = await import("@/lib/geminiClient");
    (geminiModel.generateContent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API Down"));

    const mockFile = new File(["dummyContent"], "dummy.png", { type: "image/png" });
    const result = await processFloorPlan(mockFile);

    // we expect it to have the fallback data
    expect(result.fileName).toBe(mockFile.name);
    // Verify a property that should exist on RoomAnalysisResult
    expect(result.id).toContain("fallback_");
  });
});