import { getAllRuleProposals } from "@/features/configuration/configuration-actions";
import RuleProposalList from "@/features/configuration/rule-proposal-list";

export default async function ConfigurationPage() {
  const { proposals } = await getAllRuleProposals({ status: "pending" });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage AI-generated rule adjustment proposals
        </p>
      </div>

      <RuleProposalList proposals={proposals} />
    </>
  );
}
