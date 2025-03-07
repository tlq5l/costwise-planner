 
import type React from "react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

/**
 * ProjectAnalytics Component
 * Shows a quick "Estimated vs. Actual Cost" placeholder bar chart,
 * and a "Material Usage vs. Surplus" placeholder.
 * Also includes a sample "Project Timeline" summary (text-based or hypothetical).
 *
 * In a real application, we would connect actual cost data, material usage data,
 * and scheduling or timeline data from the server or database.
 */
export default function ProjectAnalytics() {
  // Placeholder data for the "Estimated vs. Actual Cost" chart
  const costData = [
    { name: "Foundation", Estimated: 10000, Actual: 9500 },
    { name: "Framing", Estimated: 15000, Actual: 15500 },
    { name: "Finishes", Estimated: 8000, Actual: 9000 },
    { name: "Plumbing", Estimated: 6000, Actual: 6200 },
    { name: "Electrical", Estimated: 7000, Actual: 6800 },
  ];

  // Placeholder data for the "Material Usage vs. Surplus" chart
  const materialData = [
    { name: "Concrete", Ordered: 100, Used: 94 },
    { name: "Lumber", Ordered: 200, Used: 190 },
    { name: "Drywall", Ordered: 150, Used: 140 },
    { name: "Paint", Ordered: 80, Used: 74 },
    { name: "Fixtures", Ordered: 30, Used: 30 },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4">Project Analytics</h3>

      {/* Cost Comparison Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3">Cost Comparison</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Bar dataKey="Estimated" fill="#8884d8" />
              <Bar dataKey="Actual" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material Usage Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3">Material Usage</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={materialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Ordered" fill="#ffc658" />
              <Bar dataKey="Used" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Timeline (Text Summary) */}
      <div>
        <h4 className="text-lg font-medium mb-3">Project Timeline</h4>
        <div className="border-l-2 border-gray-300 pl-4 space-y-3">
          <div>
            <p className="font-medium">Project Start</p>
            <p className="text-gray-600">April 15, 2023</p>
          </div>
          <div>
            <p className="font-medium">Foundation Complete</p>
            <p className="text-gray-600">May 2, 2023</p>
          </div>
          <div>
            <p className="font-medium">Framing Complete</p>
            <p className="text-gray-600">May 30, 2023</p>
          </div>
          <div>
            <p className="font-medium">Projected Completion</p>
            <p className="text-gray-600">August 25, 2023</p>
          </div>
        </div>
      </div>
    </div>
  );
}