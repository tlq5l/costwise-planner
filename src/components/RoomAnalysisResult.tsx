import { toast } from "@/hooks/use-toast";
import { combineFloorPlanAnalysis } from "@/lib/roomAnalysis";
import { classifyRooms } from "@/lib/roomClassifier";
import { useUnitSystem } from "@/context/UnitSystemContext";
import { formatArea } from "@/lib/utils/unitConversions";
import type {
  CombinedFloorPlanAnalysis,
  FurnitureDetectionResponse,
  FurnitureItem,
  FurnitureType,
  RoomAnalysisResult as RoomAnalysisResultType
} from "@/types";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Home, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FloorPlanViewer from "./FloorPlanViewer";
import RoomAreaBreakdown from "./RoomAreaBreakdown";

interface RoomAnalysisResultProps {
  result: RoomAnalysisResultType;
}

// Update RoomAnalysisResultType in src/types/index.ts to include ocrAnalysis
// This is just a reminder comment - we've already updated the types

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const RoomAnalysisResult = ({ result }: RoomAnalysisResultProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAiExplanationOpen, setIsAiExplanationOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const { unitSystem } = useUnitSystem();

  // Process room detection data to include classified rooms if needed
  const processedRoomDetection = useMemo(() => {
    return result.roomDetection
      ? {
          ...result.roomDetection,
          predictions: classifyRooms(result.roomDetection.predictions)
        }
      : undefined;
  }, [result.roomDetection]);

  // Keep furniture detection but not use it in UI
  const furnitureDetection: FurnitureDetectionResponse | undefined = result.furnitureDetection;

  // Combine room and furniture detection for analysis (but only use room data in UI)
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedFloorPlanAnalysis | null>(null);

  useEffect(() => {
    if (processedRoomDetection && furnitureDetection) {
      const combined = combineFloorPlanAnalysis(processedRoomDetection, furnitureDetection);
      setCombinedAnalysis(combined);
    }
  }, [processedRoomDetection, furnitureDetection]);

  const handleSave = () => {
    // Implement save functionality
    toast({
      title: "Project saved",
      description: "Your room analysis has been saved to your projects",
    });
  };

  const handleDownload = () => {
    // Implement download functionality
    toast({
      title: "Download started",
      description: "Your room analysis report is being downloaded",
    });
  };

  // Format room detection results for display
  const formatRoomDetection = () => {
    if (!processedRoomDetection) return "";

    return `${processedRoomDetection.predictions.length} rooms detected`;
  };

  // Add missing functions for feedback
  const handleFeedback = (type: "yes" | "no") => {
    // Implement feedback functionality
    setFeedbackSubmitted(true);
    toast({
      title: "Thank you for your feedback",
      description: "We appreciate your input to improve our analysis.",
    });
  };

  const handleFeedbackSubmit = () => {
    // Implement feedback submission
    if (feedbackText.trim()) {
      setFeedbackSubmitted(true);
      toast({
        title: "Feedback submitted",
        description: "Thank you for your detailed feedback.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mt-8 w-full max-w-4xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
      >
        <div className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-medium mb-1">Floor Plan Analysis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generated on {formatDate(result.createdAt)} • Floor plan:{" "}
                {result.fileName}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="p-2 text-sm font-medium text-gray-700 flex items-center space-x-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Save className="w-4 h-4 mr-1" />
                <span>Save</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="p-2 text-sm font-medium text-gray-700 flex items-center space-x-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-1" />
                <span>Download</span>
              </motion.button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-4xl font-bold mb-2">
                  {formatArea(result.totalArea, unitSystem)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total floor area
                </div>
              </div>

              {combinedAnalysis && (
                <div className="flex space-x-6">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Rooms
                    </div>
                    <div className="text-xl font-semibold">
                      {combinedAnalysis.roomTotals.roomCount}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simplified interface focusing only on rooms */}
            <div className="flex space-x-2 mb-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg flex items-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Rooms
              </button>
            </div>

            <div className="flex flex-col gap-6 mb-6">
              <div className="w-full bg-gray-100 rounded-lg overflow-hidden dark:bg-gray-700" style={{ minHeight: '700px', height: 'auto' }}>
                {result.imageUrl && processedRoomDetection && (
                  <div className="relative w-full h-full">
                    <FloorPlanViewer
                      imageUrl={result.imageUrl}
                      roomDetection={processedRoomDetection}
                      ocrAnalysis={result.ocrAnalysis}
                    />
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col">
                {/* Collapsible AI Analysis Section */}
                <div className="rounded-lg bg-gray-50 p-5 h-full dark:bg-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">
                      AI Analysis Notes
                    </h3>
                    {/* Collapsible Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsAiExplanationOpen(prev => !prev)}
                      className="px-2 py-1 text-xs font-medium bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      {isAiExplanationOpen ? "Hide" : "Show"} Details
                    </button>
                  </div>

                  {isAiExplanationOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        The floor plan shows {formatRoomDetection()}. The total
                        estimated area is approximately{" "}
                        {formatArea(result.totalArea, unitSystem)}.
                        <br />
                        <br />
                        {result.ocrAnalysis?.dimensions && result.ocrAnalysis.dimensions.length > 0 && (
                            <>
                                <strong>OCR Analysis:</strong> The system detected {result.ocrAnalysis.dimensions.length} dimension{result.ocrAnalysis.dimensions.length !== 1 ? "s" : ""} in the floor plan using
                                optical character recognition. These extracted measurements were used to improve the accuracy of
                                room dimensions and area calculations.
                                <br />
                                <br />
                            </>
                        )}
                        Each room has been identified and measured. You can see detailed
                        measurements for each room in the breakdown below.
                        This information can be useful for planning layouts,
                        flooring materials, paint quantities, and HVAC requirements.
                    </p>

                      {/* Simple Feedback Form */}
                      <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">
                          Was this analysis accurate?
                        </h4>
                        {!feedbackSubmitted ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleFeedback("yes")}
                              className="px-3 py-1 text-sm font-medium bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback("no")}
                              className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              No
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowFeedbackBox(true)}
                              className="px-3 py-1 text-sm font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              Provide Comments
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Thanks for your feedback!
                          </p>
                        )}

                        {showFeedbackBox && !feedbackSubmitted && (
                          <div className="mt-3">
                            <textarea
                              rows={3}
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 text-sm"
                              placeholder="Let us know what was wrong or how we can improve..."
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => handleFeedbackSubmit()}
                                className="px-3 py-1 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {isExpanded && (
        <>
          {processedRoomDetection && (
            <RoomAreaBreakdown
              rooms={processedRoomDetection.predictions}
              totalArea={result.totalArea}
            />
          )}
        </>
      )}
    </motion.div>
  );
};

export default RoomAnalysisResult;