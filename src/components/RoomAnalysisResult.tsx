import { toast } from "@/hooks/use-toast";
import { classifyRooms } from "@/lib/roomClassifier";
import type { RoomAnalysisResult as RoomAnalysisResultType, ProcessedRoboflowResponse } from "@/types";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Save } from "lucide-react";
import { useState } from "react";
import RoomAreaBreakdown from "./RoomAreaBreakdown";
import FloorPlanViewer from "./FloorPlanViewer";

interface RoomAnalysisResultProps {
  result: RoomAnalysisResultType;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const RoomAnalysisResult = ({ result }: RoomAnalysisResultProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Process room detection data to include classified rooms if needed
  const processedRoomDetection: ProcessedRoboflowResponse | undefined = result.roomDetection
    ? {
        ...result.roomDetection,
        predictions: classifyRooms(result.roomDetection.predictions)
      }
    : undefined;

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
    if (!result.roomDetection) return "";

    const roomCounts: Record<string, number> = {};
    for (const pred of result.roomDetection.predictions) {
      const roomType = pred.class || "room";
      roomCounts[roomType] = (roomCounts[roomType] || 0) + 1;
    }

    return Object.entries(roomCounts)
      .map(([room, count]) => `${count} ${room}${count > 1 ? 's' : ''}`)
      .join(', ');
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
              <h2 className="text-xl font-medium mb-1">Room Analysis Results</h2>
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
                  {Math.round(result.totalArea)} sq.ft
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total floor area
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-full md:w-1/2 bg-gray-100 rounded-lg overflow-hidden dark:bg-gray-700" style={{ minHeight: '500px', height: 'auto' }}>
                {result.imageUrl && processedRoomDetection && (
                  <div className="relative w-full h-full">
                    <FloorPlanViewer
                      imageUrl={result.imageUrl}
                      roomDetection={processedRoomDetection}
                    />
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <div className="rounded-lg bg-gray-50 p-5 h-full dark:bg-gray-700/50">
                  <h3 className="text-lg font-medium mb-3">
                    AI Analysis Notes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    The floor plan shows {formatRoomDetection()}. The total
                    estimated area is approximately{" "}
                    {Math.round(result.totalArea)} sq.ft.
                    <br />
                    <br />
                    Each room has been identified and measured. You can see detailed
                    measurements for each room in the breakdown below.
                    This information can be useful for planning furniture layouts,
                    flooring materials, paint quantities, and HVAC requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {isExpanded && processedRoomDetection && (
        <RoomAreaBreakdown
          rooms={processedRoomDetection.predictions}
          totalArea={result.totalArea}
        />
      )}
    </motion.div>
  );
};

export default RoomAnalysisResult;