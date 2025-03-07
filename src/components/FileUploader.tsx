import { toast } from "@/hooks/use-toast";
import type {
    ClassifiedRoom,
    FurnitureItem,
    RoomAnalysisResult,
    UploadStatus,
} from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Scan, Upload, X, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface FileUploaderProps {
	onAnalysisComplete: (result: RoomAnalysisResult) => void;
}

const FileUploader = ({ onAnalysisComplete }: FileUploaderProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
	const [isDragging, setIsDragging] = useState(false);
	const [detectedRooms, setDetectedRooms] = useState<ClassifiedRoom[]>([]);
	const [detectedFurniture, setDetectedFurniture] = useState<FurnitureItem[]>(
		[],
	);
	const [imageBase64, setImageBase64] = useState<string | null>(null);
	const [detectionProgress, setDetectionProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const convertFileToBase64 = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = reader.result as string;
			// Remove data URL prefix
			setImageBase64(base64.split(",")[1]);
		};
		reader.readAsDataURL(file);
	}, []);

	// Define handleFileSelection with useCallback to stabilize the reference
	const handleFileSelection = useCallback(
		(selectedFile: File) => {
			// Check file type
			const validTypes = [
				"image/jpeg",
				"image/png",
				"image/jpg",
				"application/pdf",
			];
			if (!validTypes.includes(selectedFile.type)) {
				toast({
					title: "Invalid file type",
					description: "Please upload an image (JPEG, PNG) or PDF file",
					variant: "destructive",
				});
				return;
			}

			// Check file size (max 10MB)
			if (selectedFile.size > 10 * 1024 * 1024) {
				toast({
					title: "File too large",
					description: "Please upload a file smaller than 10MB",
					variant: "destructive",
				});
				return;
			}

			// Set the file and reset statuses
			setFile(selectedFile);
			setUploadStatus("idle");
			setDetectedRooms([]);
			setDetectedFurniture([]);

			if (selectedFile.type.startsWith("image/")) {
				const objectUrl = URL.createObjectURL(selectedFile);
				setPreviewUrl(objectUrl);

				// Convert to base64 for later processing
				convertFileToBase64(selectedFile);
			} else {
				setPreviewUrl(null);
			}
		},
		[convertFileToBase64],
	);

	const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);

			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				handleFileSelection(e.dataTransfer.files[0]);
			}
		},
		[handleFileSelection],
	);

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFileSelection(e.target.files[0]);
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const removeFile = () => {
		setFile(null);
		setPreviewUrl(null);
		setUploadStatus("idle");
		setDetectedRooms([]);
		setDetectedFurniture([]);
		setImageBase64(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const processFile = async () => {
		try {
			// Set status to uploading
			setUploadStatus("uploading");

			// Read file as base64
			if (!file || !imageBase64) return;

			// Simulate network request
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Update status to processing
			setUploadStatus("processing");

			// Start detection process
			setTimeout(async () => {
				// Dynamically import the room animation module
				const { detectRoomsWithAnimation } = await import("@/lib/animations/roomAnimations");

				// Start the room detection with animation
				const roomResults = await detectRoomsWithAnimation(imageBase64);

				// Set to room detection state
				setUploadStatus("roomDetection");

				// Start animation for detected rooms
				const animateRoomDetection = async () => {
					// Animation logic using roomResults.getNextRoom()
					const nextRoom = roomResults.getNextRoom();
					if (nextRoom) {
						setDetectedRooms(prev => [...prev, nextRoom]);
						// Continue animating rooms
						setTimeout(animateRoomDetection, 500);
					} else {
						// Room detection complete, proceed to final processing
						setUploadStatus("processing");

						// Dynamically import the floor plan processor
						const { processFloorPlan } = await import(
							"@/lib/analysis/floorPlanProcessor"
						);

						// Call our final process with only room detection results
						// Pass empty furniture detection to keep the API unchanged
						const emptyFurnitureDetection = {
							predictions: [],
							image: roomResults.fullResponse.image,
						};

						processFloorPlan(
							file,
							emptyFurnitureDetection,
							roomResults.fullResponse,
						).then((result) => {
							// Update status and notify parent component
							setUploadStatus("success");

							// IMPORTANT: Update the UI with the enhanced room classifications
							if (
								result.roomDetection &&
								"predictions" in result.roomDetection
							) {
								const enhancedRooms = result.roomDetection
									.predictions as ClassifiedRoom[];
								setDetectedRooms(enhancedRooms);
							}

							// Pass the result to the callback
							onAnalysisComplete(result);

							// Prepare toast message
							const description =
								"Your floor plan has been analyzed successfully";

							toast({
								title: "Analysis complete",
								description,
							});
						});
					}
				};

				// Start the room animation
				animateRoomDetection();
			});
		} catch (error) {
			console.error("Error processing file:", error);
			setUploadStatus("error");

			toast({
				title: "Processing failed",
				description: "There was an error analyzing your floor plan",
				variant: "destructive",
			});
		}
	};

	// Helper for rendering detection animation
	const renderDetectionAnimation = () => {
		if (!previewUrl) return null;

		// Find the bounds of the detected elements to set appropriate viewBox
		let maxWidth = 600;
		let maxHeight = 400;

		if (detectedRooms.length > 0) {
			// Try to determine appropriate dimensions from the detected rooms
			const maxX = Math.max(
				...detectedRooms.map((room) =>
					Math.max(...room.points.map((p) => p.x)),
				),
			);
			const maxY = Math.max(
				...detectedRooms.map((room) =>
					Math.max(...room.points.map((p) => p.y)),
				),
			);

			if (maxX > 0) maxWidth = maxX * 1.1; // Add 10% margin
			if (maxY > 0) maxHeight = maxY * 1.1; // Add 10% margin
		}

		return (
			<div
				className="relative mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden w-full"
				style={{ minHeight: "600px", height: "auto" }}
			>
				<img
					src={previewUrl}
					alt="Floor plan preview"
					className="w-full h-full object-contain"
				/>

				{/* Detection overlay */}
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox={`0 0 ${maxWidth} ${maxHeight}`}
					preserveAspectRatio="xMidYMid meet"
					aria-label="Detection visualization"
				>
					<title>Floor plan detection</title>

					{/* Room polygons */}
					{detectedRooms.map((room, index) => {
						// Create SVG path from points
						const pointsToPath = (
							points: { x: number; y: number }[],
						): string => {
							if (points.length === 0) return "";

							const pathCommands = points.reduce((path, point, index) => {
								const command = index === 0 ? "M" : "L";
								return `${path} ${command} ${point.x} ${point.y}`;
							}, "");

							return `${pathCommands} Z`; // Z command closes the path
						};

						return (
							<motion.path
								key={room.detection_id}
								d={pointsToPath(room.points)}
								fill={`${room.color}66`}
								stroke={room.color}
								strokeWidth="1.5"
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 0.8 }}
								transition={{ duration: 0.8, delay: index * 0.1 }}
							/>
						);
					})}
				</svg>

				{/* Progress bar */}
				<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 py-2 px-4">
					<div className="flex items-center text-white text-sm">
						{/* Conditionally show different icons depending on status */}
						{uploadStatus === "processing" ? (
							<Zap className="animate-pulse mr-2 w-4 h-4 text-yellow-300" />
						) : (
							<Scan className="animate-pulse mr-2 w-4 h-4" />
						)}

						<span>
							{uploadStatus === "roomDetection"
								? "Analyzing rooms..."
								: "Processing..."}
						</span>
						<div className="ml-auto">{detectedRooms.length} rooms detected</div>
					</div>
					<div className="w-full h-1 bg-gray-700 rounded-full mt-2">
						<motion.div
							className="h-full bg-blue-500 rounded-full"
							initial={{ width: 0 }}
							animate={{ width: `${detectionProgress}%` }}
							transition={{ duration: 0.5 }}
						/>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="mb-8"
			>
				<div
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
					onClick={!file ? triggerFileInput : undefined}
					onKeyDown={(e) => {
						if (!file && (e.key === "Enter" || e.key === " ")) {
							e.preventDefault();
							triggerFileInput();
						}
					}}
					role={!file ? "button" : undefined}
					tabIndex={!file ? 0 : undefined}
					className={`file-drop-area ${isDragging ? "active" : ""} ${file ? "cursor-default" : "cursor-pointer"}`}
				>
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileInput}
						className="sr-only"
						accept="image/jpeg,image/png,image/jpg,application/pdf"
					/>

					<AnimatePresence mode="wait">
						{!file ? (
							<motion.div
								key="upload-prompt"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="text-center"
							>
								<div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 dark:bg-gray-800">
									<Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
								</div>
								<h3 className="text-lg font-medium mb-2">
									Upload your floor plan
								</h3>
								<p className="text-gray-500 text-sm mb-2 dark:text-gray-400">
									Drag and drop your file here, or click to browse
								</p>
								<p className="text-gray-400 text-xs dark:text-gray-500">
									Supported formats: JPEG, PNG, PDF (max 10MB)
								</p>
							</motion.div>
						) : (
							<motion.div
								key="file-preview"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="w-full"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center">
										<div className="mr-3">
											{previewUrl ? (
												<div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
													<img
														src={previewUrl}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
												</div>
											) : (
												<div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center dark:bg-gray-800">
													<Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
												</div>
											)}
										</div>
										<div>
											<h4 className="font-medium text-sm mb-1 truncate max-w-[200px]">
												{file.name}
											</h4>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{(file.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											removeFile();
										}}
										className="p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-gray-800"
									>
										<X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
									</button>
								</div>

								{/* Show detection animation when in that state */}
								{uploadStatus === "roomDetection" && renderDetectionAnimation()}

								{uploadStatus === "idle" && (
									<motion.button
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={(e) => {
											e.stopPropagation();
											processFile();
										}}
										className="w-full py-3 px-4 rounded-lg bg-gray-900 text-white font-medium transition-all hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
									>
										Analyze Floor Plan
									</motion.button>
								)}

								{uploadStatus === "uploading" && (
									<div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-medium flex items-center justify-center space-x-2 dark:bg-gray-800 dark:text-gray-200">
										<RefreshCw className="w-4 h-4 animate-spin" />
										<span>Uploading...</span>
									</div>
								)}

								{uploadStatus === "processing" && (
									<div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-medium flex items-center justify-center space-x-2 dark:bg-gray-800 dark:text-gray-200">
										<RefreshCw className="w-4 h-4 animate-spin" />
										<span>Processing... This may take a moment</span>
									</div>
								)}

								{uploadStatus === "success" && (
									<div className="w-full py-3 px-4 rounded-lg bg-green-50 text-green-800 font-medium flex items-center justify-center space-x-2 dark:bg-green-900/20 dark:text-green-300">
										<Check className="w-4 h-4" />
										<span>Analysis complete</span>
									</div>
								)}

								{uploadStatus === "error" && (
									<div className="w-full py-3 px-4 rounded-lg bg-red-50 text-red-800 font-medium flex items-center justify-center space-x-2 dark:bg-red-900/20 dark:text-red-300">
										<X className="w-4 h-4" />
										<span>Processing failed. Please try again.</span>
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
};

export default FileUploader;
