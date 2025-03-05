import { useUnitSystem } from "@/context/UnitSystemContext";
import { FURNITURE_COLORS } from "@/lib/furnitureDetection";
import { ROOM_COLORS } from "@/lib/roomClassifier";
import { formatArea, formatLength } from "@/lib/utils/unitConversions";
import type {
    ClassifiedRoom,
	DimensionAnnotation,
    FurnitureDetectionResponse,
    FurnitureItem,
	OcrAnalysisResult,
    ProcessedRoboflowResponse,
    RoboflowPoint,
} from "@/types";
import { motion } from "framer-motion";
import {
    Home,
    Layers,
    RotateCcw,
    Ruler,
    Sofa,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
    type ReactZoomPanPinchRef,
    TransformComponent,
    TransformWrapper,
} from "react-zoom-pan-pinch";

interface FloorPlanViewerProps {
	imageUrl: string;
	roomDetection: ProcessedRoboflowResponse;
	furnitureDetection?: FurnitureDetectionResponse;
	ocrAnalysis?: OcrAnalysisResult;
	isAnimating?: boolean;
	onAnimationComplete?: () => void;
	scaleFactor?: number;
	onScaleFactorChange?: (newScaleFactor: number) => void;
}

const FloorPlanViewer = ({
	imageUrl,
	roomDetection,
	furnitureDetection,
	ocrAnalysis,
	isAnimating = false,
	onAnimationComplete,
	scaleFactor,
	onScaleFactorChange,
}: FloorPlanViewerProps) => {
	const { unitSystem } = useUnitSystem();
	// Initialize state for rooms from room detection
	const [rooms, setRooms] = useState<(ClassifiedRoom & {
		isVisible: boolean;
		isHighlighted: boolean;
		isProcessing: boolean;
	})[]>([]);

	useEffect(() => {
		if (roomDetection?.predictions) {
			// Set rooms from enhanced room detection that already incorporates furniture context
			setRooms(roomDetection.predictions.map(room => ({
				...room,
				isVisible: true,
				isHighlighted: false,
				// Ensure we're using the enhanced room classifications from roomDetection
				// which should already incorporate furniture-based classification
				isProcessing: isAnimating
			})));

			// Log the room types to verify enhanced classifications are being used
			console.log("Using room classifications:", roomDetection.predictions.map(r =>
				`${r.roomType} (${r.detection_id})`
			));
		}
	}, [roomDetection, isAnimating]);

	const [furniture, setFurniture] = useState<FurnitureItem[]>(
		furnitureDetection
			? furnitureDetection.predictions.map((item) => ({
					...item,
					isVisible: true,
					isHighlighted: false,
				}))
			: [],
	);

	const [showLabels, setShowLabels] = useState(true);
	const [showDimensions, setShowDimensions] = useState(true);
	const [showOcrDimensions, setShowOcrDimensions] = useState(true);
	const [showAllRooms, setShowAllRooms] = useState(true);
	const [showAllFurniture, setShowAllFurniture] = useState(true);
	const [activeTab, setActiveTab] = useState<"rooms" | "furniture" | "ocr">("rooms");
	const [isCalibrationMode, setIsCalibrationMode] = useState(false);
	const [calibrationPoints, setCalibrationPoints] = useState<{
		start?: { x: number; y: number };
		end?: { x: number; y: number };
	}>({});
	const [calibrationLength, setCalibrationLength] = useState<number>(1); // Default 1 meter
	const [measuringLine, setMeasuringLine] = useState<boolean>(false);

	const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

	// For animation of room detection
	const [animationIndex, setAnimationIndex] = useState(0);

	// Points to SVG path converter
	const pointsToPath = (points: RoboflowPoint[]): string => {
		if (points.length === 0) return "";

		const pathCommands = points.reduce((path, point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${path} ${command} ${point.x} ${point.y}`;
		}, "");

		return `${pathCommands} Z`; // Z command closes the path
	};

	// Filter handler for room visibility
	const toggleRoomVisibility = (roomId: string) => {
		setRooms((prevRooms) =>
			prevRooms.map((room) =>
				room.detection_id === roomId
					? { ...room, isVisible: !room.isVisible }
					: room,
			),
		);
	};

	// Toggle highlight for a specific room
	const toggleRoomHighlight = (roomId: string) => {
		setRooms((prevRooms) =>
			prevRooms.map((room) =>
				room.detection_id === roomId
					? { ...room, isHighlighted: !room.isHighlighted }
					: room,
			),
		);
	};

	// Toggle furniture visibility
	const toggleFurnitureVisibility = (furnitureId: string) => {
		setFurniture((prevFurniture) =>
			prevFurniture.map((item) =>
				item.detection_id === furnitureId
					? { ...item, isVisible: !item.isVisible }
					: item,
			),
		);
	};

	// Toggle highlight for a specific furniture item
	const toggleFurnitureHighlight = (furnitureId: string) => {
		setFurniture((prevFurniture) =>
			prevFurniture.map((item) =>
				item.detection_id === furnitureId
					? { ...item, isHighlighted: !item.isHighlighted }
					: item,
			),
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
				setRooms((prev) =>
					prev.map((room, idx) =>
						idx === animationIndex ? { ...room, isProcessing: false } : room,
					),
				);
				setAnimationIndex((prev) => prev + 1);
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
		setRooms((prevRooms) =>
			prevRooms.map((room) => ({ ...room, isVisible: !showAllRooms })),
		);
	};

	// Toggle all furniture visibility
	const toggleAllFurniture = () => {
		setShowAllFurniture(!showAllFurniture);
		setFurniture((prevFurniture) =>
			prevFurniture.map((item) => ({ ...item, isVisible: !showAllFurniture })),
		);
	};

	return (
		<div
			className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
			style={{ minHeight: "850px" }}
		>
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
							showLabels
								? "bg-blue-100 dark:bg-blue-900"
								: "hover:bg-gray-100 dark:hover:bg-gray-800"
						}`}
						aria-label="Toggle labels"
					>
						<Layers
							className={`w-5 h-5 ${
								showLabels
									? "text-blue-600 dark:text-blue-400"
									: "text-gray-700 dark:text-gray-300"
							}`}
						/>
					</button>

					<button
						type="button"
						onClick={() => setShowDimensions(!showDimensions)}
						className={`w-8 h-8 flex items-center justify-center rounded ${
							showDimensions
								? "bg-blue-100 dark:bg-blue-900"
								: "hover:bg-gray-100 dark:hover:bg-gray-800"
						}`}
						aria-label="Toggle dimensions"
					>
						<Ruler
							className={`w-5 h-5 ${
								showDimensions
									? "text-blue-600 dark:text-blue-400"
									: "text-gray-700 dark:text-gray-300"
							}`}
						/>
					</button>

					{/* OCR dimensions toggle button - only show if OCR data exists */}
					{ocrAnalysis?.dimensions && ocrAnalysis.dimensions.length > 0 && (
						<button
							type="button"
							onClick={() => setShowOcrDimensions(!showOcrDimensions)}
							className={`w-8 h-8 flex items-center justify-center rounded ${
								showOcrDimensions
									? "bg-cyan-100 dark:bg-cyan-900"
									: "hover:bg-gray-100 dark:hover:bg-gray-800"
							}`}
							aria-label="Toggle OCR dimensions"
							title="Toggle OCR dimension annotations"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className={`w-5 h-5 ${
									showOcrDimensions
										? "text-cyan-600 dark:text-cyan-400"
										: "text-gray-700 dark:text-gray-300"
								}`}
							>
								<path d="M7 5h10M5 9h14M3 13h18M5 17h14M7 21h10" />
							</svg>
						</button>
					)}

				<div className="border-t border-gray-200 dark:border-gray-700 pt-2" />

				{/* Calibration tool */}
				<button
					type="button"
					className={`w-8 h-8 flex items-center justify-center rounded ${
						isCalibrationMode
							? "bg-blue-100 dark:bg-blue-900"
							: "hover:bg-gray-100 dark:hover:bg-gray-800"
					}`}
					aria-label="Công cụ hiệu chuẩn"
					title="Công cụ hiệu chuẩn"
					onClick={() => setIsCalibrationMode(!isCalibrationMode)}
				>
					<Ruler
						className={`w-5 h-5 ${
							isCalibrationMode
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-700 dark:text-gray-300"
						}`}
					/>
				</button>

				<div className="border-t border-gray-200 dark:border-gray-700 pt-2" />

				{/* Room visibility toggle */}
				<button
					type="button"
					className={`w-8 h-8 flex items-center justify-center rounded ${
						activeTab === "rooms"
							? "bg-indigo-100 dark:bg-indigo-900"
							: "hover:bg-gray-100 dark:hover:bg-gray-800"
					}`}
					aria-label={showAllRooms ? "Hide all rooms" : "Show all rooms"}
					title="Toggle rooms"
					onClick={() => {
						setActiveTab("rooms");
						toggleAllRooms();
					}}
				>
					<Home
						className={`w-5 h-5 ${
							activeTab === "rooms"
								? "text-indigo-600 dark:text-indigo-400"
								: "text-gray-700 dark:text-gray-300"
						}`}
					/>
				</button>

				{/* Furniture visibility toggle */}
				{furniture.length > 0 && (
					<button
						type="button"
						className={`w-8 h-8 flex items-center justify-center rounded ${
							activeTab === "furniture"
								? "bg-amber-100 dark:bg-amber-900"
								: "hover:bg-gray-100 dark:hover:bg-gray-800"
						}`}
						aria-label={
							showAllFurniture ? "Hide all furniture" : "Show all furniture"
						}
						title="Toggle furniture"
						onClick={() => {
							setActiveTab("furniture");
							toggleAllFurniture();
						}}
					>
						<Sofa
							className={`w-5 h-5 ${
								activeTab === "furniture"
									? "text-amber-600 dark:text-amber-400"
									: "text-gray-700 dark:text-gray-300"
							}`}
						/>
					</button>
				)}
			</div>

			{/* Calibration Panel */}
			{isCalibrationMode && (
				<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 max-w-xs">
					<h3 className="text-sm font-medium mb-2">
						{unitSystem === "metric" ? "Hiệu chuẩn đo lường" : "Calibration"}
					</h3>

					<p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
						{!calibrationPoints.start
							? unitSystem === "metric"
								? "Nhấp vào bản vẽ để đánh dấu điểm bắt đầu của đoạn thẳng tham chiếu."
								: "Click on the drawing to mark the start point of a reference line."
							: !calibrationPoints.end
								? unitSystem === "metric"
									? "Nhấp vào bản vẽ để đánh dấu điểm kết thúc."
									: "Click to mark the end point."
								: unitSystem === "metric"
									? "Nhập chiều dài thực tế của đoạn thẳng này."
									: "Enter the actual length of this line."}
					</p>

					{calibrationPoints.start && calibrationPoints.end && (
						<div className="flex flex-col gap-2">
							<div className="flex items-center">
								<label htmlFor="calibration-length" className="text-xs mr-2">
									{unitSystem === "metric" ? "Chiều dài:" : "Length:"}
								</label>
								<input
									id="calibration-length"
									type="number"
									min="0.1"
									step="0.1"
									value={calibrationLength}
									onChange={(e) =>
										setCalibrationLength(Number.parseFloat(e.target.value) || 1)
									}
									className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
								/>
								<span className="ml-1 text-xs">{unitSystem === "metric" ? "m" : "ft"}</span>
							</div>

							<button
								type="button"
								onClick={() => {
									if (
										calibrationPoints.start &&
										calibrationPoints.end &&
										onScaleFactorChange
									) {
										// Calculate distance in pixels
										const dx =
											calibrationPoints.end.x - calibrationPoints.start.x;
										const dy =
											calibrationPoints.end.y - calibrationPoints.start.y;
										const pixelDist = Math.sqrt(dx * dx + dy * dy);

										// Convert from imperial to metric if needed
										const lengthInMeters = unitSystem === "imperial"
						? calibrationLength * 0.3048 // Convert feet to meters
						: calibrationLength;

										// Calculate new scale factor (meters per pixel)
										const newScaleFactor = lengthInMeters / pixelDist;
										onScaleFactorChange(newScaleFactor);

										// Reset calibration mode
										setIsCalibrationMode(false);
										setCalibrationPoints({});
									}
								}}
								className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
							>
								{unitSystem === "metric" ? "Áp dụng hiệu chuẩn" : "Apply Calibration"}
							</button>

							<button
								type="button"
								onClick={() => {
									setCalibrationPoints({});
								}}
								className="px-3 py-1 text-xs bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
							>
								{unitSystem === "metric" ? "Đặt lại" : "Reset"}
							</button>
						</div>
					)}
				</div>
			)}

			{/* Legend */}
			<div className="absolute top-4 right-4 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 max-w-xs">
				<div className="flex mb-2 space-x-2">
					<button
						type="button"
						onClick={() => setActiveTab("rooms")}
						className={`px-3 py-1 text-xs rounded-md ${
							activeTab === "rooms"
								? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
								: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
						}`}
					>
						Rooms
					</button>

					{furniture.length > 0 && (
						<button
							type="button"
							onClick={() => setActiveTab("furniture")}
							className={`px-3 py-1 text-xs rounded-md ${
								activeTab === "furniture"
									? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
									: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
							}`}
						>
							Furniture
						</button>
					)}
				</div>

				{activeTab === "rooms" ? (
					<div className="space-y-1.5 max-h-60 overflow-y-auto">
						{Object.entries(ROOM_COLORS).map(([roomType, color]) => (
							<div key={roomType} className="flex items-center text-xs">
								<div
									className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
									style={{ backgroundColor: color }}
								/>
								<span className="truncate capitalize">
									{roomType.toLowerCase().replace("_", " ")}
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-1.5 max-h-60 overflow-y-auto">
						{Object.entries(FURNITURE_COLORS).map(([furnitureType, color]) => (
							<div key={furnitureType} className="flex items-center text-xs">
								<div
									className="w-3 h-3 mr-2 flex-shrink-0"
									style={{ backgroundColor: color, borderRadius: "2px" }}
								/>
								<span className="truncate capitalize">
									{furnitureType.toLowerCase().replace("_", " ")}
								</span>
							</div>
						))}
					</div>
				)}
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
							wrapperClass="w-full h-full px-4 pt-16 pb-32"
							contentClass="w-full h-full"
						>
							<div
								className="relative w-full h-full"
								onClick={(e) => {
									if (isCalibrationMode) {
										// Get the target element
										const target = e.target as Element;
										if (target.tagName === "image" || target.closest("svg")) {
											// Calculate click coordinates relative to the SVG viewBox
											const svg = target.closest("svg");
											if (svg) {
												const rect = svg.getBoundingClientRect();
												const viewBox = svg.viewBox.baseVal;

												// Transform client coordinates to SVG viewBox coordinates
												const x = (viewBox.width * (e.clientX - rect.left)) / rect.width;
												const y = (viewBox.height * (e.clientY - rect.top)) / rect.height;

												if (!calibrationPoints.start) {
													setCalibrationPoints({ start: { x, y } });
												} else if (!calibrationPoints.end) {
													setCalibrationPoints({
														...calibrationPoints,
														end: { x, y },
													});
												}

												e.stopPropagation();
											}
										}
									}
								}}
								onKeyDown={(e) => {
									// Handle keyboard navigation for accessibility
									if (isCalibrationMode && (e.key === 'Enter' || e.key === ' ')) {
										// Simulate a click at the current focus position
										e.currentTarget.click();
									}
								}}
								tabIndex={isCalibrationMode ? 0 : -1} // Make focusable only in calibration mode
								role={isCalibrationMode ? "button" : undefined}
								aria-label={isCalibrationMode ? "Click to set calibration point" : undefined}
							>
								{/* The floor plan image */}
								<img
									src={imageUrl}
									alt="Floor plan"
									className="max-w-full max-h-full object-contain"
								/>

								{/* SVG overlay for room visualization */}
								<svg
									width="100%"
									height="100%"
									viewBox={`0 0 ${roomDetection.image.width} ${roomDetection.image.height}`}
									preserveAspectRatio="xMidYMid meet"
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										pointerEvents: "none",
									}}
									role="img"
									aria-label="Floor plan detection overlay"
								>
									<title>Floor plan detection visualization</title>

									{/* Room polygons */}
									{rooms.map(
										(room) =>
											room.isVisible && (
												<motion.g
													key={room.detection_id}
													initial={{ opacity: 0 }}
													animate={{
														opacity: room.isProcessing ? 0.3 : 1,
														scale: room.isHighlighted ? 1.02 : 1,
													}}
													transition={{ duration: 0.5 }}
													onClick={() => toggleRoomHighlight(room.detection_id)}
												>
													{/* Room outline */}
													<motion.path
														d={pointsToPath(room.points)}
														fill={
															room.isHighlighted
																? `${room.color}99`
																: `${room.color}66`
														}
														stroke={room.color}
														strokeWidth={room.isHighlighted ? "2" : "1.5"}
														className="cursor-pointer transition-colors duration-300"
														initial={{ pathLength: 0, opacity: 0 }}
														animate={{
															pathLength: 1,
															opacity: room.isProcessing ? 0.3 : 0.8,
															strokeWidth: room.isHighlighted ? 2 : 1.5,
														}}
														transition={{
															pathLength: { duration: 1, delay: 0.2 },
															opacity: { duration: 0.5 },
															strokeWidth: { duration: 0.2 },
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
												{room.verifiedByOcr && "✓"}
											</text>
										</g>
									)}

									{/* Dimension labels */}
									{showDimensions && (
										<>
											{/* Width dimension */}
											<g>
												<line
													x1={room.x - room.width / 2}
													y1={room.y + room.height / 2 + 10}
													x2={room.x + room.width / 2}
													y2={room.y + room.height / 2 + 10}
													stroke={room.color}
													strokeWidth="1"
													strokeDasharray="4,2"
												/>
												<text
													x={room.x}
													y={room.y + room.height / 2 + 20}
													textAnchor="middle"
													dominantBaseline="middle"
													fill={room.color}
													fontSize="9"
													fontWeight="400"
													className="select-none pointer-events-none"
												>
													{/* Use OCR width if available, otherwise use AI-estimated width */}
													{room.ocrWidthM
														? formatLength(room.ocrWidthM, unitSystem)
														: formatLength(room.dimensions.widthM, unitSystem)}
												</text>
											</g>

											{/* Height dimension */}
											<g>
												<line
													x1={room.x + room.width / 2 + 10}
													y1={room.y - room.height / 2}
													x2={room.x + room.width / 2 + 10}
													y2={room.y + room.height / 2}
													stroke={room.color}
													strokeWidth="1"
													strokeDasharray="4,2"
												/>
												<text
													x={room.x + room.width / 2 + 20}
													y={room.y}
													textAnchor="middle"
													dominantBaseline="middle"
													fill={room.color}
													fontSize="9"
													fontWeight="400"
													className="select-none pointer-events-none"
													transform={`rotate(90 ${room.x + room.width / 2 + 20} ${room.y})`}
												>
													{/* Use OCR height if available, otherwise use AI-estimated height */}
													{room.ocrHeightM
														? formatLength(room.ocrHeightM, unitSystem)
														: formatLength(room.dimensions.heightM, unitSystem)}
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
											fill={room.verifiedByOcr ? "#0ea5e9" : room.color}
											fontSize="11"
											fontWeight="600"
											className="select-none pointer-events-none"
										>
											{/* Use OCR area if available, otherwise use AI-estimated area */}
											{room.ocrAreaM2
												? formatArea(room.ocrAreaM2, unitSystem)
												: formatArea(room.dimensions.areaM2, unitSystem)}
										</text>
									)}
												</motion.g>
											),
									)}

									{/* Calibration line */}
									{isCalibrationMode && calibrationPoints.start && (
										<>
											<circle
												cx={calibrationPoints.start.x}
												cy={calibrationPoints.start.y}
												r="4"
												fill="#3b82f6"
												stroke="white"
												strokeWidth="1"
											/>

											{calibrationPoints.end && (
												<>
													<line
														x1={calibrationPoints.start.x}
														y1={calibrationPoints.start.y}
														x2={calibrationPoints.end.x}
														y2={calibrationPoints.end.y}
														stroke="#3b82f6"
														strokeWidth="2"
														strokeDasharray="4,2"
													/>
													<circle
														cx={calibrationPoints.end.x}
														cy={calibrationPoints.end.y}
														r="4"
														fill="#3b82f6"
														stroke="white"
														strokeWidth="1"
													/>

													{/* Distance label */}
													<g>
														<rect
															x={
																(calibrationPoints.start.x +
																	calibrationPoints.end.x) /
																	2 -
																25
															}
															y={
																(calibrationPoints.start.y +
																	calibrationPoints.end.y) /
																	2 -
																10
															}
															width="50"
															height="20"
															rx="4"
															fill="white"
															fillOpacity="0.8"
															stroke="#3b82f6"
															strokeWidth="1"
														/>
														<text
															x={
																(calibrationPoints.start.x +
																	calibrationPoints.end.x) /
																2
															}
															y={
																(calibrationPoints.start.y +
																	calibrationPoints.end.y) /
																	2 +
																5
															}
															textAnchor="middle"
															dominantBaseline="middle"
															fill="#3b82f6"
															fontSize="10"
															fontWeight="500"
															className="select-none pointer-events-none"
														>
															{calibrationLength} {unitSystem === "metric" ? "m" : "ft"}
														</text>
													</g>
												</>
											)}
										</>
									)}

									{/* OCR-extracted dimension annotations */}
									{showOcrDimensions && ocrAnalysis?.dimensions && ocrAnalysis.dimensions.length > 0 &&
										ocrAnalysis.dimensions.map((dim, index) => (
											<g key={`dim-${index}`} className="ocr-dimension">
												{/* Bounding box for dimension text */}
												<rect
													x={Math.min(...dim.boundingPoly.vertices.map(v => v.x))}
													y={Math.min(...dim.boundingPoly.vertices.map(v => v.y))}
													width={Math.max(...dim.boundingPoly.vertices.map(v => v.x)) -
														Math.min(...dim.boundingPoly.vertices.map(v => v.x))}
													height={Math.max(...dim.boundingPoly.vertices.map(v => v.y)) -
														Math.min(...dim.boundingPoly.vertices.map(v => v.y))}
													fill="#0ea5e9"
													fillOpacity="0.2"
													stroke="#0ea5e9"
													strokeWidth="1"
													strokeDasharray="2,1"
												/>
												{/* Dimension text label */}
												{dim.center && (
													<text
														x={dim.center.x}
														y={dim.center.y + 10}
														textAnchor="middle"
														dominantBaseline="middle"
														fill="#0ea5e9"
														fontSize="8"
														fontWeight="600"
														className="select-none pointer-events-none"
													>
														{dim.rawText} ({formatLength(dim.valueInMeters, unitSystem)})
													</text>
												)}
											</g>
										))
									}

									{/* Furniture bounding boxes */}
									{furniture.map(
										(item) =>
											item.isVisible && (
												<motion.g
													key={item.detection_id}
													initial={{ opacity: 0 }}
													animate={{
														opacity: 1,
														scale: item.isHighlighted ? 1.02 : 1,
													}}
													transition={{ duration: 0.5 }}
													onClick={() =>
														toggleFurnitureHighlight(item.detection_id)
													}
												>
													{/* Furniture bounding box */}
													<motion.rect
														x={item.x - item.width / 2}
														y={item.y - item.height / 2}
														width={item.width}
														height={item.height}
														fill="transparent"
														stroke={item.color}
														strokeWidth={item.isHighlighted ? "2" : "1.5"}
														strokeDasharray="5,3"
														className="cursor-pointer transition-colors duration-300"
														initial={{ opacity: 0 }}
														animate={{
															opacity: 0.9,
															strokeWidth: item.isHighlighted ? 2 : 1.5,
														}}
														transition={{
															opacity: { duration: 0.5 },
															strokeWidth: { duration: 0.2 },
														}}
														whileHover={{ scale: 1.01 }}
													/>

													{/* Furniture icon */}
													{showLabels && (
														<g>
															<rect
																x={item.x - 30}
																y={item.y - 10}
																width="60"
																height="20"
																rx="4"
																fill={item.color}
																fillOpacity="0.2"
																stroke={item.color}
																strokeWidth="1"
															/>
															<text
																x={item.x}
																y={item.y + 5}
																textAnchor="middle"
																dominantBaseline="middle"
																fill={item.color}
																fontSize="9"
																fontWeight="500"
																className="select-none pointer-events-none"
															>
																{item.furnitureType}
															</text>
														</g>
													)}
												</motion.g>
											),
									)}
								</svg>
							</div>
						</TransformComponent>
					</React.Fragment>
				)}
			</TransformWrapper>

			{/* Bottom panel (tabs for room list and furniture list) */}
			<div className="absolute bottom-4 left-4 right-4 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-md p-3">
				<div className="flex justify-between items-center mb-2">
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={() => setActiveTab("rooms")}
							className={`px-3 py-1 text-xs font-medium rounded-md ${
								activeTab === "rooms"
									? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
									: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
							}`}
						>
							Rooms ({rooms.length})
						</button>

						{furniture.length > 0 && (
							<button
								type="button"
								onClick={() => setActiveTab("furniture")}
								className={`px-3 py-1 text-xs font-medium rounded-md ${
									activeTab === "furniture"
										? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
										: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
								}`}
							>
								Furniture ({furniture.length})
							</button>
						)}

						{/* OCR Dimensions tab - only show if OCR data exists */}
						{ocrAnalysis?.dimensions && ocrAnalysis.dimensions.length > 0 && (
							<button
								type="button"
								onClick={() => setActiveTab("ocr")}
								className={`px-3 py-1 text-xs font-medium rounded-md ${
									activeTab === "ocr"
										? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
										: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
								}`}
							>
								OCR Dimensions ({ocrAnalysis.dimensions.length})
							</button>
						)}
					</div>

					<button
						type="button"
						onClick={() =>
							activeTab === "rooms" ? toggleAllRooms() : toggleAllFurniture()
						}
						className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
					>
						{activeTab === "rooms"
							? showAllRooms
								? "Hide All"
								: "Show All"
							: showAllFurniture
								? "Hide All"
								: "Show All"}
					</button>
				</div>

				<div className="max-h-40 overflow-y-auto">
					{activeTab === "rooms" ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
							{rooms.map((room) => (
								<button
									type="button"
									key={room.detection_id}
									className={`flex items-center p-1.5 text-xs rounded-md border cursor-pointer transition-colors ${
										room.isVisible
											? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
											: "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									} ${
										room.isHighlighted
											? "ring-2 ring-blue-300 dark:ring-blue-700"
											: ""
									}`}
									onClick={() => toggleRoomVisibility(room.detection_id)}
								>
									<div
										className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
										style={{
											backgroundColor: room.color,
											opacity: room.isVisible ? 1 : 0.5,
										}}
									/>
									<span className="truncate capitalize">
										{room.roomType}
										{room.verifiedByOcr && " ✓"}
										({Math.round(room.ocrAreaM2 || room.dimensions.areaM2)} m²)
									</span>
								</button>
							))}
						</div>
					) : activeTab === "furniture" ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
							{furniture.map((item) => (
								<button
									type="button"
									key={item.detection_id}
									className={`flex items-center p-1.5 text-xs rounded-md border cursor-pointer transition-colors ${
										item.isVisible
											? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
											: "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									} ${
										item.isHighlighted
											? "ring-2 ring-amber-300 dark:ring-amber-700"
											: ""
									}`}
									onClick={() => toggleFurnitureVisibility(item.detection_id)}
								>
									<div
										className="w-3 h-3 mr-2 flex-shrink-0"
										style={{
											backgroundColor: item.color,
											opacity: item.isVisible ? 1 : 0.5,
											borderRadius: "2px",
										}}
									/>
									<span className="truncate capitalize">
										{item.furnitureType} {item.room ? "(In Room)" : ""}
									</span>
								</button>
							))}
						</div>
					) : (
						// OCR dimensions panel
						<div className="space-y-2">
							{ocrAnalysis?.dimensions && ocrAnalysis.dimensions.map((dim, index) => (
								<div
									key={`ocr-dim-${index}`}
									className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700"
								>
									<div className="flex justify-between items-center">
										<span className="font-medium text-cyan-600 dark:text-cyan-400">
											{dim.rawText}
										</span>
										<span className="text-gray-500 dark:text-gray-400">
											{formatLength(dim.valueInMeters, unitSystem)}
										</span>
									</div>
									<div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
										<span className="mr-4">Unit: {dim.unit}</span>
										<span>Orientation: {dim.orientation || "unknown"}</span>
									</div>
								</div>
							))}
							
							{(!ocrAnalysis?.dimensions || ocrAnalysis.dimensions.length === 0) && (
								<div className="text-center py-4 text-gray-500 dark:text-gray-400">
									No dimension annotations detected in this floor plan.
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FloorPlanViewer;