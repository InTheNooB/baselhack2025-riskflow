import { getCaseDetail } from "@/features/cases/cases-actions";
import { notFound } from "next/navigation";
import CaseDetailComponent from "@/features/cases/case-detail/case-detail-component";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;

  const { case: caseData } = await getCaseDetail(id);

  if (!caseData) {
    notFound();
  }

  return <CaseDetailComponent caseData={caseData} />;
}
