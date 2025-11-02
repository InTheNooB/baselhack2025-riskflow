import {
  getRuleProposalDetail,
  simulateRuleChange,
} from "@/features/configuration/configuration-actions";
import ConfigurationDetailComponent from "@/features/configuration/rule-proposal-detail-component";
import { notFound } from "next/navigation";

export default async function ConfigurationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { proposal } = await getRuleProposalDetail(id);

  if (!proposal) {
    notFound();
  }

  // Get simulation results
  const { results: simulationResults } = await simulateRuleChange(id);

  return (
    <ConfigurationDetailComponent
      proposal={proposal}
      simulationResults={simulationResults}
    />
  );
}
