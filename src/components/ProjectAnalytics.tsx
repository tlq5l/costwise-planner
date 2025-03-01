import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

  // Placeholder data for "Material Usage vs. Surplus" (just text summary here)
  const materialUsage = [
    { material: "Concrete", used: "90%", surplus: "10%" },
    { material: "Lumber", used: "95%", surplus: "5%" },
    { material: "Drywall", used: "80%", surplus: "20%" },
    { material: "Wiring", used: "100%", surplus: "0%" },
  ];

  // Placeholder timeline steps
  const timelineSteps = [
    { step: "Foundation Complete", date: "Sep 20" },
    { step: "Framing & Roof", date: "Oct 10" },
    { step: "Rough-ins", date: "Oct 20" },
    { step: "Finishes", date: "Nov 5" },
    { step: "Inspection & Handover", date: "Nov 25" },
  ];

  return (
    <div className="w-full mt-8 bg-white rounded-md shadow-sm p-6 dark:bg-gray-800 dark:border-gray-700 border border-gray-100">
      <h3 className="text-xl font-medium mb-4">Project Analytics &amp; Insights</h3>

      {/* Estimated vs Actual Cost Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-3">Estimated vs. Actual Cost</h4>
        <div className="w-full h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Estimated" fill="#8884d8" />
              <Bar dataKey="Actual" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material Usage vs Surplus */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-3">Material Usage vs. Surplus</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {materialUsage.map((mat, index) => (
            <li key={index} className="flex justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
              <span className="font-medium">{mat.material}</span>
              <span className="mx-2">Used: {mat.used}</span>
              <span>Surplus: {mat.surplus}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Project Timeline (Simple placeholders, not an actual Gantt) */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-3">Project Timeline (Sample)</h4>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {timelineSteps.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
              <div className="flex justify-between w-full">
                <span>{item.step}</span>
                <span className="text-gray-500 dark:text-gray-400">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          (This timeline is a placeholder. Integrate a real Gantt chart or scheduling data for production use.)
        </p>
      </div>
    </div>
  );
}