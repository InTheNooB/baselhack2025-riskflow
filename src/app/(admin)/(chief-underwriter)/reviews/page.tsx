import CasesComponent from "@/features/cases/cases-component";
import { getEscalatedCases } from "@/features/chief-reviews/chief-reviews-actions";

export default async function ChiefReviewsPage() {
  const { cases } = await getEscalatedCases();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chief Underwriter Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Review escalated cases requiring chief underwriter approval
        </p>
      </div>

      <CasesComponent cases={cases} isChief={true} />
    </>
  );
}
