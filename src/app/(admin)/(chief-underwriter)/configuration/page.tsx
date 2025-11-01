import {
  getAllRuleProposals,
  getAllConfigurationRules,
} from "@/features/configuration/configuration-actions";
import ConfigurationPageClient from "@/features/configuration/configuration-page-client";
import { PageHeader } from "@/components/ui/page-header";

export default async function ConfigurationPage() {
  const [
    { proposals: pendingProposals, total: pendingTotal },
    { proposals: allProposals, total: allTotal },
    { rules },
  ] = await Promise.all([
    getAllRuleProposals({ status: "pending" }),
    getAllRuleProposals(),
    getAllConfigurationRules(),
  ]);

  // Calculate statistics
  const acceptedCount = allProposals.filter(
    (p) => p.status === "accepted"
  ).length;
  const rejectedCount = allProposals.filter(
    (p) => p.status === "rejected"
  ).length;
  const modifiedCount = allProposals.filter(
    (p) => p.status === "modified"
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader title="Configuration" role="Chief Underwriter" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Pending Proposals
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {pendingTotal}
            </p>
            <p className="text-sm text-gray-500">Awaiting review</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Accepted</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {acceptedCount}
            </p>
            <p className="text-sm text-gray-500">Total approved</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Rejected</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {rejectedCount}
            </p>
            <p className="text-sm text-gray-500">Not implemented</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Modified</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {modifiedCount}
            </p>
            <p className="text-sm text-gray-500">Customized</p>
          </div>
        </div>

        {/* Configuration Content */}
        <ConfigurationPageClient proposals={pendingProposals} rules={rules} />
      </main>
    </div>
  );
}
