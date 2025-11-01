import { getAllSimulationRules } from "@/features/simulations/simulations-actions";
import SimulationsComponent from "@/features/simulations/simulations-component";
import { PageHeader } from "@/components/ui/page-header";

export default async function SimulationsPage() {
  const { rules } = await getAllSimulationRules();

  // Count total rules
  const totalRules =
    rules.riskFactors.length +
    rules.declineRules.length +
    rules.gatherInfoRules.length +
    rules.mortalityFormulas.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader title="Simulations" role="Product Designer" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Rule Simulation Tool
              </h3>
              <p className="text-sm text-blue-700">
                Experiment with rule changes to see their impact on historical cases.
                Select rules to modify, adjust their expressions, and run simulations to
                analyze how changes would affect acceptance rates, premiums, and sales.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Risk Factors
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {rules.riskFactors.length}
            </p>
            <p className="text-sm text-gray-500">Active factors</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Decline Rules</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {rules.declineRules.length}
            </p>
            <p className="text-sm text-gray-500">Active rules</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Gather Info Rules</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {rules.gatherInfoRules.length}
            </p>
            <p className="text-sm text-gray-500">Active rules</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Total Rules
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalRules}</p>
            <p className="text-sm text-gray-500">Available for simulation</p>
          </div>
        </div>

        {/* Simulation Component */}
        <SimulationsComponent rules={rules} />
      </main>
    </div>
  );
}
