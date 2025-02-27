
import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EstimationCategory } from "@/types";

interface CostBreakdownProps {
  categories: EstimationCategory[];
  totalCost: number;
  currency: string;
}

const COLORS = [
  "#334155", // slate-700
  "#475569", // slate-600
  "#64748b", // slate-500
  "#94a3b8", // slate-400
  "#cbd5e1", // slate-300
  "#e2e8f0", // slate-200
  "#f8fafc", // slate-50
  "#f1f5f9", // slate-100
  "#f1f5f9", // slate-100
  "#e2e8f0", // slate-200
];

const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const CostBreakdown = ({ categories, totalCost, currency }: CostBreakdownProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Sort categories by cost (highest first)
  const sortedCategories = [...categories].sort((a, b) => b.cost - a.cost);
  
  // Calculate percentages for each category
  const categoriesWithPercentage = sortedCategories.map((category) => ({
    ...category,
    percentage: (category.cost / totalCost) * 100,
  }));

  // Prepare data for pie chart
  const chartData = categoriesWithPercentage.map((category) => ({
    name: category.name,
    value: category.cost,
  }));

  const handleMouseEnter = (categoryId: string) => {
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6 md:p-8">
        <h3 className="text-xl font-medium mb-6">Cost Breakdown</h3>

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
                          hoveredCategory
                            ? sortedCategories[index].id === hoveredCategory
                              ? 1
                              : 0.5
                            : 1
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value, currency),
                      "Cost",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="space-y-3">
              {categoriesWithPercentage.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                  className={`p-4 rounded-lg transition-colors duration-300 ${
                    hoveredCategory === category.id
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
                      <h4 className="font-medium">{category.name}</h4>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(category.cost, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden dark:bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></motion.div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
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

export default CostBreakdown;
