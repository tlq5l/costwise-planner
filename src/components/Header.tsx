import { useUnitSystem } from "@/context/UnitSystemContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NewProjectModal from "./NewProjectModal";

interface HeaderProps {
	title?: string;
}

// Unit toggle button component
const UnitToggleButton = () => {
	const { unitSystem, toggleUnitSystem } = useUnitSystem();

	return (
		<button
			type="button"
			onClick={toggleUnitSystem}
			className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md transition-colors duration-200 dark:text-gray-300 dark:hover:text-white flex items-center"
			title={
				unitSystem === "metric"
					? "Switch to Imperial (US)"
					: "Switch to Metric (Vietnamese)"
			}
		>
			<Ruler className="w-4 h-4 mr-1.5" />
			<span>{unitSystem === "metric" ? "Metric" : "Imperial"}</span>
		</button>
	);
};

const Header = ({ title = "Floor Plan Analyzer" }: HeaderProps) => {
	const [scrolled, setScrolled] = useState(false);
	const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [scrolled]);

	const openNewProjectModal = () => {
		console.log("Opening new project modal");
		setIsNewProjectModalOpen(true);
	};

	const closeNewProjectModal = () => {
		setIsNewProjectModalOpen(false);
	};

	return (
		<>
			<header
				className={cn(
					"fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4 px-6 md:px-12",
					scrolled
						? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80"
						: "bg-transparent"
				)}
			>
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="flex items-center"
					>
						<div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mr-3">
							<span className="text-white font-medium text-lg">F</span>
						</div>

						<h1 className="text-xl font-medium tracking-tight">
							{title}
						</h1>
					</motion.div>

					<motion.nav
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="flex items-center space-x-1 md:space-x-4"
					>
						<Link
							to="/projects"
							className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
						>
							Projects
						</Link>

						<Link
							to="/analysis"
							className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
						>
							Analysis
						</Link>

						<Link
							to="/about"
							className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
						>
							About
						</Link>

						<div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

						<UnitToggleButton />

						<div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

						<button
							type="button"
							onClick={openNewProjectModal}
							className="ml-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg transition-all duration-200 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-gray-800 dark:hover:bg-gray-700"
						>
							New Analysis
						</button>
					</motion.nav>
				</div>
			</header>
			<NewProjectModal
				isOpen={isNewProjectModalOpen}
				onClose={closeNewProjectModal}
			/>
		</>
	);
};

export default Header;