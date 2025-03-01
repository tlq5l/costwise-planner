import React, { useState } from "react";

/**
 * A simple "Cost-Estimation Walkthrough" or "Sample Project Wizard".
 * Demonstrates typical steps: Project creation, Basic Data input, AI Calculation, User Edits, Final Output.
 */
export default function CostEstimationWalkthrough() {
  const [step, setStep] = useState<number>(1);
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [finishingDate, setFinishingDate] = useState("");
  const [roughSquareFootage, setRoughSquareFootage] = useState("");
  const [estimationResult, setEstimationResult] = useState<string>("");

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : 1));

  const handleCalculateAI = () => {
    // Placeholder for AI calculation flow
    // In a real scenario, you'd call an endpoint or use local logic
    const cost = (Number(roughSquareFootage) || 0) * 175; // Example
    setEstimationResult(`Estimated cost: $${cost.toLocaleString()}`);
    nextStep();
  };

  const resetWizard = () => {
    setStep(1);
    setProjectName("");
    setLocation("");
    setFinishingDate("");
    setRoughSquareFootage("");
    setEstimationResult("");
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-md shadow dark:bg-gray-800 mt-12">
      <h2 className="text-xl font-bold mb-4">Cost Estimation Walkthrough</h2>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">1. Create/Open Sample Project</h3>
          <label className="block">
            <span className="text-sm">Project Name:</span>
            <input
              type="text"
              className="block w-full mt-1 p-2 border dark:border-gray-600 rounded"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., My New Build"
            />
          </label>
          <label className="block">
            <span className="text-sm">Location:</span>
            <input
              type="text"
              className="block w-full mt-1 p-2 border dark:border-gray-600 rounded"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
            />
          </label>
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">2. Input Basic Data</h3>
          <label className="block">
            <span className="text-sm">Desired Finishing Date:</span>
            <input
              type="date"
              className="block w-full mt-1 p-2 border dark:border-gray-600 rounded"
              value={finishingDate}
              onChange={(e) => setFinishingDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm">Rough Square Footage:</span>
            <input
              type="number"
              className="block w-full mt-1 p-2 border dark:border-gray-600 rounded"
              value={roughSquareFootage}
              onChange={(e) => setRoughSquareFootage(e.target.value)}
              placeholder="e.g. 2000"
            />
          </label>
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">3. AI Calculation Flow</h3>
          <p>Click below to let AI generate an itemized cost estimate:</p>
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={handleCalculateAI}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Calculate
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">4. User Edits</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Here you could let the user revise or tweak item quantities, choose
            vendors, etc.
          </p>
          <p className="font-semibold">{estimationResult}</p>
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">5. Final Output</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A completed cost-estimate report is ready for sharing or download.
          </p>
          <p className="font-semibold">{estimationResult}</p>
          <div className="flex space-x-2">
            <button
              onClick={resetWizard}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Start Over
            </button>
            <button
              onClick={() => alert("Downloading...")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
            >
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}