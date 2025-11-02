import CasesComponent from "@/features/cases/cases-component";
import { getEscalatedCases } from "@/features/chief-reviews/chief-reviews-actions";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/client";

export default async function ChiefReviewsPage() {
  const { cases } = await getEscalatedCases();

  // Calculate today's date for filtering
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Calculate metrics
  const totalEscalated = cases.length;

  // Cases escalated today (check when they were created or updated to escalated status)
  const todayEscalated = cases.filter(
    (c) =>
      new Date(c.createdAt) >= todayDate || new Date(c.updatedAt) >= todayDate
  ).length;

  // Get cases reviewed by chief this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const reviewedThisWeek = await prisma.chiefUnderwriterReview.count({
    where: {
      reviewedAt: {
        gte: weekStart,
      },
      status: "completed",
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader title="Chief Underwriter Reviews" role="Chief Underwriter" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Pending Reviews
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {totalEscalated}
            </p>
            {todayEscalated > 0 && (
              <p className="text-sm text-[#22c55e]">+{todayEscalated} Today</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Reviewed This Week
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {reviewedThisWeek}
            </p>
            <p className="text-sm text-gray-500">Completed reviews</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Escalated Cases
            </p>
            <p className="text-3xl font-bold text-gray-900">{totalEscalated}</p>
          </div>
        </div>

        {/* Cases Table */}
        <CasesComponent cases={cases} isChief={true} />
      </main>
    </div>
  );
}
