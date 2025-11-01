import { getAllCases } from "@/features/cases/cases-actions";
import CasesComponent from "@/features/cases/cases-component";

export default async function CasesPage() {
  const { cases } = await getAllCases();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cases</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage insurance applications
        </p>
      </div>

      <CasesComponent cases={cases} />
    </div>
  );
}
