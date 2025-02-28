import { ROOM_COLORS, formatDimension } from "@/lib/roomClassifier";
import type { ClassifiedRoom, ProcessedRoboflowResponse } from "@/types";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  Ruler,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  type ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper
} from "react-zoom-pan-pinch";

interface FloorPlanViewerProps {
  imageUrl: string;
  roomDetection: ProcessedRoboflowResponse;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

const FloorPlanViewer = ({
  imageUrl,
  roomDetection,
  isAnimating = false,
  onAnimationComplete
}: FloorPlanViewerProps) => {
  const [rooms, setRooms] = useState<ClassifiedRoom[]>(
    roomDetection.predictions.map(room => ({
      ...room,
      isVisible: true,
      isHighlighted: false,
      isProcessing: isAnimating
    }))
  );
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showAllRooms, setShowAllRooms] = useState(true);
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  // For animation of room detection
  const [animationIndex, setAnimationIndex] = useState(0);

  // Points to SVG path converter
  const pointsToPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';

    const pathCommands = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    return `${pathCommands} Z`; // Z command closes the path
  };

  // Calculate center point of a room for label positioning
  const getRoomCenter = (room: ClassifiedRoom) => {
    return { x: room.x, y: room.y };
  };

  // Filter handler for room types
  const toggleRoomVisibility = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.detection_id === roomId
          ? { ...room, isVisible: !room.isVisible }
          : room
      )
    );
  };

  // Toggle highlight for a specific room
  const toggleRoomHighlight = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.detection_id === roomId
          ? { ...room, isHighlighted: !room.isHighlighted }
          : room
      )
    );
  };

  // Reset zoom and pan
  const resetTransform = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
  };

  // Animation effect when isAnimating is true
  useEffect(() => {
    if (isAnimating && animationIndex < rooms.length) {
      const timer = setTimeout(() => {
        setRooms(prev =>
          prev.map((room, idx) =>
            idx === animationIndex
              ? { ...room, isProcessing: false }
              : room
          )
        );
        setAnimationIndex(prev => prev + 1);
      }, 500);

      return () => clearTimeout(timer);
    }

    // If animation is complete, call the callback
    if (isAnimating && animationIndex >= rooms.length) {
      onAnimationComplete?.();
    }
  }, [isAnimating, animationIndex, rooms.length, onAnimationComplete]);

  // Toggle all rooms visibility
  const toggleAllRooms = () => {
    setShowAllRooms(!showAllRooms);
    setRooms(prevRooms =>
      prevRooms.map(room => ({ ...room, isVisible: !showAllRooms }))
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
      {/* Control panel */}
      <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-md p-2 space-y-2">
        <button
          type="button"
          onClick={() => transformComponentRef.current?.zoomIn()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          type="button"
          onClick={() => transformComponentRef.current?.zoomOut()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          type="button"
          onClick={resetTransform}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Reset view"
        >
          <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2" />

        <button
          type="button"
          onClick={() => setShowLabels(!showLabels)}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            showLabels ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Toggle room labels"
        >
          <Layers className={`w-5 h-5 ${
            showLabels ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
          }`} />
        </button>

        <button
          type="button"
          onClick={() => setShowDimensions(!showDimensions)}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            showDimensions ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Toggle dimensions"
        >
          <Ruler className={`w-5 h-5 ${
            showDimensions ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
          }`} />
        </button>

        <button
          type="button"
          onClick={toggleAllRooms}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={showAllRooms ? "Hide all rooms" : "Show all rooms"}
        >
          {showAllRooms ? (
            <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Room type legend */}
      <div className="absolute top-4 right-4 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 max-w-xs">
        <h4 className="text-sm font-medium mb-2">Room Types</h4>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {Object.entries(ROOM_COLORS).map(([roomType, color]) => (
            <div key={roomType} className="flex items-center text-xs">
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate capitalize">{roomType.toLowerCase().replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive floor plan with zoom/pan */}
      <TransformWrapper
        ref={transformComponentRef}
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
        limitToBounds
        smooth
      >
        {({ zoomIn, zoomOut, setTransform, ...rest }) => (
          <React.Fragment>
            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full"
            >
              <div className="relative w-full h-full">
                {/* The floor plan image */}
                <img
                  src={imageUrl}
                  alt="Floor plan"
                  className="w-full h-full object-contain"
                />

                {/* SVG overlay for room visualization */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${roomDetection.image.width} ${roomDetection.image.height}`}
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                  role="img"
                  aria-label="Room detection overlay"
                >
                  <title>Floor plan room detection visualization</title>
                  {rooms.map((room) =>
                    room.isVisible && (
                      <motion.g
                        key={room.detection_id}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: room.isProcessing ? 0.3 : 1,
                          scale: room.isHighlighted ? 1.02 : 1
                        }}
                        transition={{ duration: 0.5 }}
                        onClick={() => toggleRoomHighlight(room.detection_id)}
                      >
                        {/* Room outline */}
                        <motion.path
                          d={pointsToPath(room.points)}
                          fill={room.isHighlighted ? `${room.color}99` : `${room.color}66`}
                          stroke={room.color}
                          strokeWidth={room.isHighlighted ? "2" : "1.5"}
                          className="cursor-pointer transition-colors duration-300"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: 1,
                            opacity: room.isProcessing ? 0.3 : 0.8,
                            strokeWidth: room.isHighlighted ? 2 : 1.5
                          }}
                          transition={{
                            pathLength: { duration: 1, delay: 0.2 },
                            opacity: { duration: 0.5 },
                            strokeWidth: { duration: 0.2 }
                          }}
                          whileHover={{ scale: 1.01 }}
                        />

                        {/* Room label */}
                        {showLabels && (
                          <g>
                            <rect
                              x={room.x - 40}
                              y={room.y - 10}
                              width="80"
                              height="20"
                              rx="4"
                              fill="white"
                              fillOpacity="0.8"
                              stroke={room.color}
                              strokeWidth="1"
                            />
                            <text
                              x={room.x}
                              y={room.y + 5}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="rgb(31, 41, 55)"
                              fontSize="10"
                              fontWeight="500"
                              className="select-none pointer-events-none"
                            >
                              {room.roomType}
                            </text>
                          </g>
                        )}

                        {/* Dimension labels */}
                        {showDimensions && (
                          <>
                            {/* Width dimension */}
                            <g>
                              <line
                                x1={room.x - room.width/2}
                                y1={room.y + room.height/2 + 10}
                                x2={room.x + room.width/2}
                                y2={room.y + room.height/2 + 10}
                                stroke={room.color}
                                strokeWidth="1"
                                strokeDasharray="4,2"
                              />
                              <text
                                x={room.x}
                                y={room.y + room.height/2 + 20}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={room.color}
                                fontSize="9"
                                fontWeight="400"
                                className="select-none pointer-events-none"
                              >
                                {formatDimension(room.dimensions.widthFt)}
                              </text>
                            </g>

                            {/* Height dimension */}
                            <g>
                              <line
                                x1={room.x + room.width/2 + 10}
                                y1={room.y - room.height/2}
                                x2={room.x + room.width/2 + 10}
                                y2={room.y + room.height/2}
                                stroke={room.color}
                                strokeWidth="1"
                                strokeDasharray="4,2"
                              />
                              <text
                                x={room.x + room.width/2 + 20}
                                y={room.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={room.color}
                                fontSize="9"
                                fontWeight="400"
                                className="select-none pointer-events-none"
                                transform={`rotate(90 ${room.x + room.width/2 + 20} ${room.y})`}
                              >
                                {formatDimension(room.dimensions.heightFt)}
                              </text>
                            </g>
                          </>
                        )}

                        {/* Area label */}
                        {showDimensions && (
                          <text
                            x={room.x}
                            y={room.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={room.color}
                            fontSize="11"
                            fontWeight="600"
                            className="select-none pointer-events-none"
                          >
                            {Math.round(room.dimensions.areaFt)} sq.ft
                          </text>
                        )}
                      </motion.g>
                    )
                  )}
                </svg>
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>

      {/* Room list panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium mb-2">Detected Rooms</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {rooms.map((room) => (
            <button
              type="button"
              key={room.detection_id}
              className={`flex items-center p-1.5 text-xs rounded-md border cursor-pointer transition-colors ${
                room.isVisible
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              } ${
                room.isHighlighted
                  ? 'ring-2 ring-blue-300 dark:ring-blue-700'
                  : ''
              }`}
              onClick={() => toggleRoomVisibility(room.detection_id)}
            >
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: room.color, opacity: room.isVisible ? 1 : 0.5 }}
              />
              <span className="truncate capitalize">
                {room.roomType} ({Math.round(room.dimensions.areaFt)} sq.ft)
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanViewer;