import { toast } from "@/hooks/use-toast";
import { combineFloorPlanAnalysis } from "@/lib/roomAnalysis";
import { classifyRooms } from "@/lib/roomClassifier";
import type {
  CombinedFloorPlanAnalysis,
  FurnitureDetectionResponse,
  FurnitureItem,
  FurnitureType,
  RoomAnalysisResult as RoomAnalysisResultType
} from "@/types";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Home, Save, Sofa } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FloorPlanViewer from "./FloorPlanViewer";
import RoomAreaBreakdown from "./RoomAreaBreakdown";

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
  const [activeTab, setActiveTab] = useState<'rooms' | 'furniture'>('rooms');
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedFloorPlanAnalysis | null>(null);

  // Process room detection data to include classified rooms if needed
  const processedRoomDetection = useMemo(() => {
    return result.roomDetection
      ? {
          ...result.roomDetection,
          predictions: classifyRooms(result.roomDetection.predictions)
        }
      : undefined;
  }, [result.roomDetection]);

  // Get the furniture detection
  const furnitureDetection: FurnitureDetectionResponse | undefined = result.furnitureDetection;

  // Combine room and furniture detection for analysis
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

    const roomCounts: Record<string, number> = {};
    for (const pred of processedRoomDetection.predictions) {
      const roomType = pred.roomType;
      roomCounts[roomType] = (roomCounts[roomType] || 0) + 1;
    }

    return Object.entries(roomCounts)
      .map(([room, count]) => `${count} ${room}${count > 1 ? 's' : ''}`)
      .join(', ');
  };

  // Format furniture detection results for display
  const formatFurnitureDetection = () => {
    if (!furnitureDetection || !combinedAnalysis) return "";

    return Object.entries(combinedAnalysis.furnitureTotals)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
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
                  {Math.round(result.totalArea)} sq.ft
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

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Furniture Items
                    </div>
                    <div className="text-xl font-semibold">
                      {Object.values(combinedAnalysis.furnitureTotals).reduce((sum, count) => sum + count, 0)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs for Room/Furniture */}
            <div className="flex space-x-2 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'rooms'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Rooms
              </button>

              {furnitureDetection && (
                <button
                  type="button"
                  onClick={() => setActiveTab('furniture')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    activeTab === 'furniture'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <Sofa className="w-4 h-4 mr-2" />
                  Furniture
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-full md:w-1/2 bg-gray-100 rounded-lg overflow-hidden dark:bg-gray-700" style={{ minHeight: '500px', height: 'auto' }}>
                {result.imageUrl && processedRoomDetection && (
                  <div className="relative w-full h-full">
                    <FloorPlanViewer
                      imageUrl={result.imageUrl}
                      roomDetection={processedRoomDetection}
                      furnitureDetection={furnitureDetection}
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
                    {furnitureDetection && furnitureDetection.predictions.length > 0 && (
                      <>
                        The analysis detected {formatFurnitureDetection()} in the floor plan.
                        <br />
                        <br />
                      </>
                    )}
                    Each room has been identified and measured. You can see detailed
                    measurements for each room in the breakdown below.
                    This information can be useful for planning furniture layouts,
                    flooring materials, paint quantities, and HVAC requirements.
                  </p>

                  {combinedAnalysis && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Details by Room Type:</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {Object.entries(combinedAnalysis.roomFurnitureCounts).map(([roomId, furnitureCounts]) => {
                          const room = combinedAnalysis.rooms.find(r => r.detection_id === roomId);
                          if (!room) return null;

                          // Get furniture items in this room
                          const furnitureItems = Object.entries(furnitureCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`);

                          if (furnitureItems.length === 0) return null;

                          return (
                            <li key={roomId} className="py-1">
                              <span className="font-medium capitalize">{room.roomType}</span>: {furnitureItems.join(', ')}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {isExpanded && (
        <>
          {activeTab === 'rooms' && processedRoomDetection && (
            <RoomAreaBreakdown
              rooms={processedRoomDetection.predictions}
              totalArea={result.totalArea}
            />
          )}

          {activeTab === 'furniture' && furnitureDetection && (
            <FurnitureBreakdown
              furniture={furnitureDetection.predictions}
              roomTotalArea={result.totalArea}
            />
          )}
        </>
      )}
    </motion.div>
  );
};

// New component for furniture breakdown
interface FurnitureBreakdownProps {
  furniture: FurnitureItem[];
  roomTotalArea: number;
}

const FurnitureBreakdown = ({ furniture, roomTotalArea }: FurnitureBreakdownProps) => {
  // Group furniture by type
  const groupedFurniture: Record<FurnitureType, FurnitureItem[]> = {} as Record<FurnitureType, FurnitureItem[]>;

  for (const item of furniture) {
    if (!groupedFurniture[item.furnitureType]) {
      groupedFurniture[item.furnitureType] = [];
    }
    groupedFurniture[item.furnitureType].push(item);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6 md:p-8">
        <h3 className="text-xl font-medium mb-6">Furniture & Fixtures Breakdown</h3>

        <div className="space-y-6">
          {Object.entries(groupedFurniture).map(([type, items]) => (
            <div key={type} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 mr-2 flex-shrink-0"
                    style={{
                      backgroundColor: items[0].color,
                      borderRadius: '2px'
                    }}
                  />
                  <h4 className="font-medium capitalize">{type.toLowerCase().replace('_', ' ')}</h4>
                </div>
                <div className="text-sm font-medium">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => (
                  <div
                    key={item.detection_id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium capitalize">{item.class}</div>
                      <div className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                        {Math.round(item.confidence * 100)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.room ? "Assigned to a room" : "Not in a specific room"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RoomAnalysisResult;