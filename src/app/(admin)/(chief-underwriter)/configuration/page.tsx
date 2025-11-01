import {
  getAllRuleProposals,
  getAllConfigurationRules,
} from "@/features/configuration/configuration-actions";
import ConfigurationPageClient from "@/features/configuration/configuration-page-client";

export default async function ConfigurationPage() {
  const [{ proposals }, { rules }] = await Promise.all([
    getAllRuleProposals({ status: "pending" }),
    getAllConfigurationRules(),
  ]);

  return (
    <ConfigurationPageClient
      proposals={proposals}
      rules={rules}
    />
  );
}
