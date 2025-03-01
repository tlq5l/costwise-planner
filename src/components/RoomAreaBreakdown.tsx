import { formatDimension } from "@/lib/roomClassifier";
import type { ClassifiedRoom } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface RoomAreaBreakdownProps {
	rooms: ClassifiedRoom[];
	totalArea: number;
}

const COLORS = [
	"#4f46e5", // indigo-600
	"#0ea5e9", // sky-500
	"#16a34a", // green-600
	"#f97316", // orange-500
	"#8b5cf6", // violet-500
	"#94a3b8", // slate-400
	"#a1a1aa", // zinc-400
	"#2dd4bf", // teal-400
	"#737373", // neutral-500
	"#f43f5e", // rose-500
];

const RoomAreaBreakdown = ({ rooms, totalArea }: RoomAreaBreakdownProps) => {
	const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

	// Sort rooms by area (largest first)
	const sortedRooms = [...rooms].sort(
		(a, b) => b.dimensions.areaM2 - a.dimensions.areaM2,
	);

	// Calculate percentages for each room
	const roomsWithPercentage = sortedRooms.map((room) => ({
		...room,
		percentage: (room.dimensions.areaM2 / totalArea) * 100,
	}));

	// Prepare data for pie chart
	const chartData = roomsWithPercentage.map((room) => ({
		name: room.roomType,
		value: room.dimensions.areaM2,
	}));

	const handleMouseEnter = (roomId: string) => {
		setHoveredRoom(roomId);
	};

	const handleMouseLeave = () => {
		setHoveredRoom(null);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
		>
			<div className="p-6 md:p-8">
				<h3 className="text-xl font-medium mb-6">Room Area Breakdown</h3>

				<div className="grid grid-cols-1 md:grid-cols-5 gap-8">
					<div className="md:col-span-2">
						<div className="h-64 md:h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										labelLine={false}
										innerRadius="60%"
										outerRadius="80%"
										dataKey="value"
										strokeWidth={2}
									>
										{chartData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
												stroke="white"
												className="transition-opacity duration-300"
												opacity={
													hoveredRoom
														? sortedRooms[index].detection_id === hoveredRoom
															? 1
															: 0.5
														: 1
												}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => [
											`${Math.round(value * 10) / 10} m²`,
											"Area",
										]}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="md:col-span-3">
						<div className="space-y-3">
							{roomsWithPercentage.map((room, index) => (
								<motion.div
									key={room.detection_id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
									onMouseEnter={() => handleMouseEnter(room.detection_id)}
									onMouseLeave={handleMouseLeave}
									className={`p-4 rounded-lg transition-colors duration-300 ${
										hoveredRoom === room.detection_id
											? "bg-gray-50 dark:bg-gray-700/50"
											: ""
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center space-x-3">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor: COLORS[index % COLORS.length],
												}}
											></div>
											<h4 className="font-medium capitalize">
												{room.roomType}
											</h4>
										</div>
										<span className="font-medium">
											{formatDimension(room.dimensions.areaM2, "m²")}
										</span>
									</div>
									<div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden dark:bg-gray-700">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${room.percentage}%` }}
											transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
											className="h-full rounded-full"
											style={{
												backgroundColor: COLORS[index % COLORS.length],
											}}
										></motion.div>
									</div>
									<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
										{formatDimension(room.dimensions.widthM, "m")} ×{" "}
										{formatDimension(room.dimensions.heightM, "m")}
									</p>
								</motion.div>
							))}
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default RoomAreaBreakdown;
