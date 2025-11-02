import { getAllCases } from "@/features/cases/cases-actions";
import CasesComponent from "@/features/cases/cases-component";
import { PageHeader } from "@/components/ui/page-header";

export default async function CasesPage() {
  const { cases } = await getAllCases();

  // Only show cases with complete data (have assessments)
  const casesWithData = cases.filter((c) => c.assessment !== null);

  // Calculate KPI metrics (only for cases with complete data)
  const unreviewedCount = casesWithData.filter(
    (c) => c.status === "submitted" || c.status === "under_review"
  ).length;
  const reviewedCount = casesWithData.filter(
    (c) => c.status === "approved" || c.status === "rejected"
  ).length;
  const escalatedCount = casesWithData.filter(
    (c) => c.status === "escalated"
  ).length;

  // Calculate today's new cases (simplified - you may want to filter by actual date)
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayCases = casesWithData.filter(
    (c) => new Date(c.createdAt) >= todayDate
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader title="Overview" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Unreviewed Cases
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {unreviewedCount}
            </p>
            {todayCases > 0 && (
              <p className="text-sm text-[#22c55e]">+{todayCases} Today</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Reviewed Cases
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {reviewedCount}
            </p>
            <p className="text-sm text-gray-500">This week</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Escalated Cases
            </p>
            <p className="text-3xl font-bold text-gray-900">{escalatedCount}</p>
          </div>
        </div>

        {/* Cases Table */}
        <CasesComponent cases={casesWithData} />
      </main>
    </div>
  );
}
