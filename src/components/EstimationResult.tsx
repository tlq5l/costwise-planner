import { toast } from "@/hooks/use-toast";
import type { EstimationResult as EstimationResultType, RoboflowPoint } from "@/types";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Save } from "lucide-react";
import { useState } from "react";
import CostBreakdown from "./CostBreakdown";

interface EstimationResultProps {
	result: EstimationResultType;
}

const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
};

const formatCurrency = (value: number, currency: string): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(value);
};

// Convert points to SVG path
const pointsToPath = (points: RoboflowPoint[]): string => {
	if (points.length === 0) return '';

	const pathCommands = points.reduce((path, point, index) => {
		const command = index === 0 ? 'M' : 'L';
		return `${path} ${command} ${point.x} ${point.y}`;
	}, '');

	return `${pathCommands} Z`; // Z command closes the path
};

const EstimationResult = ({ result }: EstimationResultProps) => {
	const [isExpanded, setIsExpanded] = useState(true);

	const handleSave = () => {
		// Implement save functionality
		toast({
			title: "Project saved",
			description: "Your estimation has been saved to your projects",
		});
	};

	const handleDownload = () => {
		// Implement download functionality
		toast({
			title: "Download started",
			description: "Your estimation report is being downloaded",
		});
	};

	// Format room detection results for display
	const formatRoomDetection = () => {
		if (!result.roomDetection) return "";

		const roomCounts: Record<string, number> = {};
		for (const pred of result.roomDetection.predictions) {
			roomCounts[pred.class] = (roomCounts[pred.class] || 0) + 1;
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
							<h2 className="text-xl font-medium mb-1">Estimation Results</h2>
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
									{formatCurrency(result.totalCost, result.currency)}
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									Estimated total construction cost
								</div>
							</div>

							<div className="flex space-x-6">
								<div>
									<div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
										Cost per sq.ft
									</div>
									<div className="text-xl font-semibold">
										{formatCurrency(
											result.totalCost / (result.estimatedArea || 2000),
											result.currency,
										)}
									</div>
								</div>

								<div>
									<div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
										Estimated area
									</div>
									<div className="text-xl font-semibold">
										~{Math.round(result.estimatedArea || 2000)} sq.ft
									</div>
								</div>
							</div>
						</div>

						<div className="flex flex-col md:flex-row gap-6 mb-6">
							<div className="w-full md:w-1/2">
								<div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden dark:bg-gray-700">
									{result.imageUrl && (
										<div className="relative w-full h-full">
											<img
												src={result.imageUrl}
												alt="Floor plan visualization"
												className="w-full h-full object-contain"
											/>
											{result.roomDetection?.predictions.map((pred) => (
												<div
													key={pred.detection_id}
													className="absolute inset-0"
												>
													<svg
														width="100%"
														height="100%"
														viewBox={`0 0 ${result.roomDetection?.image.width || 1000} ${result.roomDetection?.image.height || 1000}`}
														preserveAspectRatio="none"
														style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
														role="img"
														aria-label="Room detection overlay"
													>
														<path
															d={pointsToPath(pred.points)}
															fill="rgba(178, 245, 234, 0.4)"
															stroke="rgb(129, 230, 217)"
															strokeWidth="1"
														/>
														<text
															x={pred.x}
															y={pred.y}
															textAnchor="middle"
															dominantBaseline="middle"
															fill="rgb(14, 116, 144)"
															fontSize="12"
															fontWeight="500"
															className="select-none"
														>
															{pred.class} ({Math.round(pred.confidence * 100)}%)
														</text>
													</svg>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="w-full md:w-1/2 flex flex-col">
								<div className="rounded-lg bg-gray-50 p-5 h-full dark:bg-gray-700/50">
									<h3 className="text-lg font-medium mb-3">
										AI Analysis Notes
									</h3>
									<p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
										The floor plan shows {formatRoomDetection()}. The total
										estimated area is approximately{" "}
										{Math.round(result.estimatedArea || 2000)} sq.ft.
										<br />
										<br />
										Based on the detected room layout, quality of finishes
										indicated, and current material costs, the estimated
										construction cost is{" "}
										{formatCurrency(result.totalCost, result.currency)}.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</motion.div>

			{isExpanded && (
				<CostBreakdown
					categories={result.categories}
					totalCost={result.totalCost}
					currency={result.currency}
				/>
			)}
		</motion.div>
	);
};

export default EstimationResult;
