import CaseDetailComponent from "@/features/cases/case-detail/case-detail-component";
import { getEscalatedCaseDetail } from "@/features/chief-reviews/chief-reviews-actions";
import { notFound } from "next/navigation";

interface ChiefReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChiefReviewDetailPage({
  params,
}: ChiefReviewDetailPageProps) {
  const { id } = await params;

  const { case: caseData } = await getEscalatedCaseDetail(id);

  if (!caseData) {
    notFound();
  }

  return <CaseDetailComponent caseData={caseData} isChief={true} />;
}
