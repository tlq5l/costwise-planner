import { describe, expect, it, vi } from "vitest";

/**
 * This test file demonstrates an integration test for the entire pipeline:
 *  1) We simulate RoboFlow detection
 *  2) We then call processFloorPlan (which calls Gemini internally)
 *  3) We check the final RoomAnalysisResult
 */

// Mock file utilities for Node.js environment
vi.mock("@/lib/utils/fileUtils", () => ({
  fileToBase64: vi.fn().mockResolvedValue("mockBase64String"),
  createObjectURL: vi.fn().mockReturnValue("mock://image-url")
}));

// We'll mock only the RoboFlow detection calls here:
vi.mock("@/lib/furnitureDetection", () => ({
  detectFurnitureFromBase64: vi.fn().mockResolvedValue({
    predictions: [],
    image: { width: 800, height: 600 }
  }),
  // Add the missing assignFurnitureToRooms function mock
  assignFurnitureToRooms: vi.fn().mockImplementation(furniture => furniture)
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
          widthFt: 10,
          heightFt: 8,
          widthM: 3.05,
          heightM: 2.44,
          area: 2000,
          areaFt: 80,
          areaM2: 7.45
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
    // Reset mocks
    vi.resetModules();

    // Use automock for Gemini to ensure it's properly mocked
    vi.doMock("@/services/GeminiReasoningService", () => ({
      analyzeFloorPlan: vi.fn().mockResolvedValue({
        id: "gemini_test123",
        totalCost: 40000,
        categories: [
          { id: "cat_test1", name: "Foundation", cost: 10000, description: "Integration mock" },
          { id: "cat_test2", name: "Framing", cost: 8000, description: "Integration mock" }
        ],
        currency: "USD",
        createdAt: new Date(),
        fileName: "dummy.png",
        imageUrl: "mock://image-url",
        status: "completed"
      })
    }));

    // Import processFloorPlan after mocking dependencies
    const { processFloorPlan } = await import("@/lib/analysis/floorPlanProcessor");

    const mockFile = new File(["dummyContent"], "dummy.png", { type: "image/png" });
    const result = await processFloorPlan(mockFile);

    expect(result.status).toBe("completed");
    expect(result.totalArea).toBeGreaterThan(0);
    expect(result.roomDetection).toBeDefined();
    expect(result.furnitureDetection).toBeDefined();
    // Should now correctly have a gemini ID since we're forcing success
    expect(result.id).toContain("gemini_");
  });

  it("should fall back if gemini fails for some reason", async () => {
    // Reset mocks
    vi.resetModules();

    // Mock the gemini service to throw an error
    vi.doMock("@/services/GeminiReasoningService", () => ({
      analyzeFloorPlan: vi.fn().mockRejectedValue(new Error("Mock API Error"))
    }));

    // Import processFloorPlan after mocking dependencies
    const { processFloorPlan } = await import("@/lib/analysis/floorPlanProcessor");

    const mockFile = new File(["dummyContent"], "dummy.png", { type: "image/png" });
    const result = await processFloorPlan(mockFile);

    // we expect it to have the fallback data
    expect(result.fileName).toBe(mockFile.name);
    // Verify a property that should exist on RoomAnalysisResult
    expect(result.id).toContain("fallback_");
  });
});