"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ConnectionMode,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpressionVisualizer from "./expression-visualizer";

interface ConfigurationRules {
  riskFactors: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
    order: number;
  }>;
  declineRules: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
    priority: number;
  }>;
  gatherInfoRules: Array<{
    id: string;
    name: string;
    label: string;
    condition: string;
    description: string | null;
    priority: number;
  }>;
  mortalityFormulas: Array<{
    id: string;
    sex: string;
    formula: string;
    description: string | null;
  }>;
}

interface ConfigurationDiagramProps {
  rules: ConfigurationRules;
}

// Custom node component with expression display and graph
const RuleNode = ({ data }: { data: any }) => {
  const ruleType =
    data.ruleType ||
    (data.type === "Decline"
      ? "decline_rule"
      : data.type === "Gather Info"
      ? "gather_info_rule"
      : data.type === "Risk Factor"
      ? "risk_factor"
      : data.type === "Calculation"
      ? "mortality_formula"
      : "risk_factor");

  // Only show activation function for rules that calculate values (risk factors, mortality formulas)
  // Not for boolean checks (decline rules, gather info rules)
  const shouldShowActivationFunction =
    ruleType === "risk_factor" || ruleType === "mortality_formula";

  return (
    <Card className="px-4 py-3 shadow-lg min-w-[300px] max-w-[380px] border-2">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555", width: 10, height: 10 }}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm">{data.label}</h4>
          <Badge variant={data.variant || "outline"} className="text-xs">
            {data.type}
          </Badge>
        </div>
        {data.expression && (
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expression:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                {data.expression}
              </code>
            </div>
            {shouldShowActivationFunction && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 border">
                <p className="text-xs text-muted-foreground mb-1">
                  Activation Function:
                </p>
                <ExpressionVisualizer
                  expression={data.expression}
                  ruleType={ruleType}
                />
              </div>
            )}
          </div>
        )}
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555", width: 10, height: 10 }}
      />
    </Card>
  );
};

const StartingNode = ({ data }: { data: any }) => {
  return (
    <Card className="px-6 py-4 shadow-lg border-2 border-primary bg-primary/5">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center">
          <span className="text-2xl">🚀</span>
        </div>
        <h3 className="font-bold text-lg">{data.label}</h3>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#3b82f6" }}
      />
    </Card>
  );
};

const FinalNode = ({ data }: { data: any }) => {
  // Determine styling based on the outcome type
  const isReject = data.label === "REJECT";
  const borderColor = isReject ? "border-red-500" : "border-green-500";
  const bgColor = isReject
    ? "bg-red-50 dark:bg-red-950"
    : "bg-green-50 dark:bg-green-950";
  const iconBg = isReject ? "bg-red-500/20" : "bg-green-500/20";
  const handleColor = isReject ? "#ef4444" : "#10b981";

  return (
    <Card
      className={`px-6 py-4 shadow-lg border-2 ${borderColor} ${bgColor} min-w-[200px]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: handleColor }}
      />
      <div className="text-center">
        <div
          className={`w-12 h-12 rounded-full ${iconBg} mx-auto mb-2 flex items-center justify-center`}
        >
          <span className="text-2xl">{data.icon}</span>
        </div>
        <h3 className="font-bold text-lg">{data.label}</h3>
        {data.value && (
          <p className="text-sm text-muted-foreground mt-1">{data.value}</p>
        )}
      </div>
    </Card>
  );
};

const ExitNode = ({ data }: { data: any }) => {
  const bgColor =
    data.variant === "reject"
      ? "bg-red-50 dark:bg-red-950 border-red-500"
      : "bg-orange-50 dark:bg-orange-950 border-orange-500";
  const iconColor =
    data.variant === "reject" ? "bg-red-500/20" : "bg-orange-500/20";
  const handleColor = data.variant === "reject" ? "#ef4444" : "#f59e0b";

  return (
    <Card
      className={`px-6 py-4 shadow-lg border-2 ${bgColor} min-w-[200px] relative`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: handleColor, width: 12, height: 12 }}
      />
      <div className="text-center">
        <div
          className={`w-12 h-12 rounded-full ${iconColor} mx-auto mb-2 flex items-center justify-center`}
        >
          <span className="text-2xl">{data.icon || "⛔"}</span>
        </div>
        <h3 className="font-bold text-lg">{data.label}</h3>
        {data.reason && (
          <p className="text-sm text-muted-foreground mt-1">{data.reason}</p>
        )}
      </div>
    </Card>
  );
};

// Stage Header Node - visual separator for stages
const StageHeaderNode = ({ data }: { data: any }) => {
  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="bg-primary/10 px-6 py-3 border-2 border-primary/30 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-primary">{data.label}</h2>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
};

// Stage Background Group Node
const StageGroupNode = ({ data }: { data: any }) => {
  const width = data.width || 500;
  const height = data.height || 400;
  return (
    <div
      className="rounded-xl border-2 border-dashed pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: data.bgColor || "rgba(59, 130, 246, 0.05)",
        borderColor: data.borderColor || "rgba(59, 130, 246, 0.2)",
      }}
    />
  );
};

// Define nodeTypes outside component to avoid React Flow warning
const nodeTypes = {
  rule: RuleNode,
  start: StartingNode,
  final: FinalNode,
  exit: ExitNode,
  stageHeader: StageHeaderNode,
  stageGroup: StageGroupNode,
};

// Helper function to layout nodes by stage with proper grouping
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  // Separate nodes by type
  const stage1Nodes: Node[] = [];
  const stage2Nodes: Node[] = [];
  const stage3Nodes: Node[] = [];
  const stageHeaders: Node[] = [];

  // Stage configuration - horizontal layout
  const HEADER_Y = 50;
  const NODE_Y = 250; // All nodes at same Y level
  const STAGE_SPACING = 800; // Spacing between stages (left to right)

  nodes.forEach((node) => {
    if (node.type === "stageHeader") {
      stageHeaders.push(node);
    } else {
      // Categorize into stages
      if (
        node.id === "start" ||
        node.id.startsWith("decline-") ||
        node.id.startsWith("gather-") ||
        node.id === "reject-exit" ||
        node.id === "pending-exit"
      ) {
        stage1Nodes.push(node);
      } else if (node.id === "risk-evaluation" || node.id.startsWith("risk-")) {
        stage2Nodes.push(node);
      } else if (
        node.id === "premium-calculation" ||
        node.id.startsWith("decision-")
      ) {
        stage3Nodes.push(node);
      }
    }
  });

  // Helper to get node dimensions
  const getNodeDimensions = (node: Node) => {
    if (
      node.type === "start" ||
      node.type === "final" ||
      node.type === "exit"
    ) {
      return { width: 200, height: 120 };
    }
    return { width: 350, height: 280 };
  };

  // Separate Stage 1 nodes by type
  const stage1StartNode = stage1Nodes.find((n) => n.id === "start");
  const stage1DeclineNodes = stage1Nodes.filter((n) =>
    n.id.startsWith("decline-")
  );
  const stage1GatherNodes = stage1Nodes.filter((n) =>
    n.id.startsWith("gather-")
  );
  const stage1RejectExit = stage1Nodes.find((n) => n.id === "reject-exit");
  const stage1PendingExit = stage1Nodes.find((n) => n.id === "pending-exit");

  // Layout Stage 1: Start node on left, decline rules stacked vertically, exits on right
  const stage1StartX = 300;
  const stage1VerticalSpacing = 180;

  if (stage1StartNode) {
    stage1StartNode.position = { x: stage1StartX, y: NODE_Y };
    stage1StartNode.targetPosition = Position.Left;
    stage1StartNode.sourcePosition = Position.Right;
  }

  // Stack decline rules vertically
  let declineY =
    NODE_Y - (stage1DeclineNodes.length * stage1VerticalSpacing) / 2;
  stage1DeclineNodes.forEach((node) => {
    node.position = { x: stage1StartX + 350, y: declineY };
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    declineY += stage1VerticalSpacing;
  });

  // Stack gather info rules vertically (below decline rules)
  let gatherY = declineY;
  stage1GatherNodes.forEach((node) => {
    node.position = { x: stage1StartX + 350, y: gatherY };
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    gatherY += stage1VerticalSpacing;
  });

  // Position exits: REJECT to the right, PENDING under the decline rules
  const exitsX = stage1StartX + 700 + 300; // Added 300px more horizontal spacing
  if (stage1RejectExit) {
    stage1RejectExit.position = { x: exitsX, y: NODE_Y - 150 };
    stage1RejectExit.targetPosition = Position.Left;
  }
  // Position PENDING_INFORMATION under the decline rules (same X as decline rules)
  if (stage1PendingExit) {
    const declineRulesX = stage1StartX + 350;
    const pendingY = Math.max(declineY, gatherY) + stage1VerticalSpacing;
    stage1PendingExit.position = { x: declineRulesX, y: pendingY };
    stage1PendingExit.targetPosition = Position.Left;
  }

  // Flow to next stage goes from right bottom of decline/gather area
  const stage1EndX = exitsX + 250;
  const riskEvaluationNode = stage2Nodes.find(
    (n) => n.id === "risk-evaluation"
  );

  // Calculate Stage 2 starting position (after Stage 1)
  const stage2StartX = stage1EndX + STAGE_SPACING;

  // Position risk evaluation node (connects from Stage 1 to Stage 2)
  if (riskEvaluationNode) {
    riskEvaluationNode.position = { x: stage2StartX - 200, y: gatherY };
    riskEvaluationNode.targetPosition = Position.Left;
    riskEvaluationNode.sourcePosition = Position.Right;
  }

  // Separate Stage 2 nodes: risk factors (stack them vertically)
  const stage2RiskFactors = stage2Nodes.filter(
    (n) => n.id.startsWith("risk-") && n.id !== "risk-evaluation"
  );
  const stage2VerticalSpacing = 400; // Increased vertical spacing between risk factors

  // Stack risk factors vertically with more spacing
  const riskFactorsStartY =
    NODE_Y - (stage2RiskFactors.length * stage2VerticalSpacing) / 2;
  let riskFactorY = riskFactorsStartY;

  // Position risk factors with more horizontal space from risk evaluation
  const riskFactorsX = stage2StartX + 400; // Increased horizontal spacing from risk evaluation
  stage2RiskFactors.forEach((node) => {
    node.position = { x: riskFactorsX, y: riskFactorY };
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    riskFactorY += stage2VerticalSpacing;
  });

  // Premium calculation node on the right side of risk factors
  const premiumNode = stage3Nodes.find((n) => n.id === "premium-calculation");
  if (premiumNode) {
    premiumNode.position = { x: riskFactorsX + 600, y: NODE_Y };
    premiumNode.targetPosition = Position.Left;
    premiumNode.sourcePosition = Position.Right;
  }

  // Calculate Stage 3 starting position (after Stage 2) - reduced horizontal spacing
  const stage2EndX = riskFactorsX + 1400; // Adjusted for new risk factors position
  const stage3StartX = stage2EndX + 400; // Reduced from STAGE_SPACING (800) to 400px to make section 3 less wide horizontally

  // Layout Stage 3 decision nodes (stacked vertically)
  const stage3DecisionNodes = stage3Nodes.filter((n) =>
    n.id.startsWith("decision-")
  );
  const stage3VerticalSpacing = 180; // Vertical spacing between outcome nodes
  const decisionStartY =
    NODE_Y - (stage3DecisionNodes.length * stage3VerticalSpacing) / 2;
  let decisionY = decisionStartY;
  stage3DecisionNodes.forEach((node) => {
    node.position = { x: stage3StartX, y: decisionY };
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    decisionY += stage3VerticalSpacing;
  });

  // Position stage headers at same height, centered over their stages
  const getStageBounds = (stageNodes: Node[]) => {
    if (stageNodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    stageNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node);
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + width);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + height);
    });
    return { minX, maxX, minY, maxY };
  };

  stageHeaders.forEach((header) => {
    const stageNodes =
      header.id === "stage-1-header"
        ? stage1Nodes
        : header.id === "stage-2-header"
        ? stage2Nodes
        : stage3Nodes;
    const bounds = getStageBounds(stageNodes);

    // Position all headers similarly: at the start of their stage + quarter the width (moved further left)
    const stageWidth = bounds.maxX - bounds.minX;
    const headerX = bounds.minX + stageWidth / 4 - 250; // Quarter of stage width minus half header width

    header.position = { x: headerX, y: HEADER_Y };
  });

  // Add stage group background nodes
  const stageGroups: Node[] = [];
  const stageConfigs = [
    {
      nodes: stage1Nodes,
      bgColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "rgba(239, 68, 68, 0.2)",
      id: "stage-1-group",
    },
    {
      nodes: stage2Nodes,
      bgColor: "rgba(139, 92, 246, 0.05)",
      borderColor: "rgba(139, 92, 246, 0.2)",
      id: "stage-2-group",
    },
    {
      nodes: stage3Nodes,
      bgColor: "rgba(16, 185, 129, 0.05)",
      borderColor: "rgba(16, 185, 129, 0.2)",
      id: "stage-3-group",
    },
  ];

  stageConfigs.forEach((config) => {
    if (config.nodes.length > 0) {
      const bounds = getStageBounds(config.nodes);
      const padding = 100;
      const width = bounds.maxX - bounds.minX + padding * 2;
      const height = bounds.maxY - bounds.minY + padding * 2;
      const groupNode: Node = {
        id: config.id,
        type: "stageGroup",
        position: {
          x: bounds.minX - padding,
          y: bounds.minY - padding,
        },
        data: {
          bgColor: config.bgColor,
          borderColor: config.borderColor,
          width,
          height,
        },
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
        draggable: false,
        selectable: false,
        zIndex: -1,
      };
      stageGroups.push(groupNode);
    }
  });

  return { nodes: [...nodes, ...stageGroups], edges };
}

export default function ConfigurationDiagram({
  rules,
}: ConfigurationDiagramProps) {
  // Memoize nodes and edges computation
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    // Stage 1 Header: Deal Killers
    const stage1Header: Node = {
      id: "stage-1-header",
      type: "stageHeader",
      position: { x: 0, y: 0 },
      data: {
        label: "STAGE 1: Deal Killers",
        description: "Evaluate immediate rejection criteria",
        stage: 1,
      },
      draggable: false,
      selectable: false,
    };
    nodesList.push(stage1Header);

    // Starting node
    const startNode: Node = {
      id: "start",
      type: "start",
      data: { label: "Application Start" },
      position: { x: 0, y: 0 }, // Will be calculated by dagre
    };
    nodesList.push(startNode);

    // REJECT Exit Node
    const rejectExitNode: Node = {
      id: "reject-exit",
      type: "exit",
      position: { x: 0, y: 0 },
      data: {
        label: "REJECT",
        reason: "Application Rejected",
        variant: "reject",
        icon: "❌",
      },
    };
    nodesList.push(rejectExitNode);

    // Decline Rules
    rules.declineRules.forEach((rule) => {
      const node: Node = {
        id: `decline-${rule.id}`,
        type: "rule",
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          label: rule.label,
          expression: rule.expression,
          description: rule.description,
          type: "Decline",
          variant: "destructive",
          ruleType: "decline_rule",
        },
      };
      nodesList.push(node);

      // Connect start to decline rule
      edgesList.push({
        id: `start-decline-${rule.id}`,
        source: "start",
        target: `decline-${rule.id}`,
        animated: true,
        style: { stroke: "#ef4444", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ef4444",
        },
      });

      // Connect decline rule to REJECT exit (if triggered)
      edgesList.push({
        id: `decline-${rule.id}-reject`,
        source: `decline-${rule.id}`,
        target: "reject-exit",
        animated: true,
        label: "IF TRUE",
        labelStyle: { fill: "#ef4444", fontWeight: "bold", fontSize: 12 },
        style: { stroke: "#ef4444", strokeWidth: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ef4444",
        },
      });
    });

    // Risk Evaluation Node
    const riskEvaluationNode: Node = {
      id: "risk-evaluation",
      type: "rule",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: "Risk Evaluation",
        type: "Gate",
        variant: "default",
      },
    };
    nodesList.push(riskEvaluationNode);

    // Connect all decline rules to risk evaluation (if FALSE - continue path), or start if no decline rules
    if (rules.declineRules.length > 0) {
      rules.declineRules.forEach((rule) => {
        edgesList.push({
          id: `decline-${rule.id}-risk`,
          source: `decline-${rule.id}`,
          target: "risk-evaluation",
          animated: true,
          label: "IF FALSE",
          labelStyle: { fill: "#10b981", fontWeight: "bold", fontSize: 12 },
          style: { stroke: "#10b981", strokeWidth: 3, strokeDasharray: "10,5" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#10b981",
          },
        });
      });
    } else {
      // Connect start directly to risk evaluation if no decline rules
      edgesList.push({
        id: "start-risk",
        source: "start",
        target: "risk-evaluation",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
        },
      });
    }

    // PENDING_INFORMATION Exit Node
    const pendingExitNode: Node = {
      id: "pending-exit",
      type: "exit",
      position: { x: 0, y: 0 },
      data: {
        label: "PENDING_INFORMATION",
        reason: "Need More Info",
        variant: "pending",
        icon: "❓",
      },
    };
    nodesList.push(pendingExitNode);

    // Connect start directly to pending exit (if information is lacking, stop directly)
    edgesList.push({
      id: "start-pending-exit",
      source: "start",
      target: "pending-exit",
      animated: true,
      label: "IF INFO MISSING",
      labelStyle: { fill: "#f59e0b", fontWeight: "bold", fontSize: 12 },
      style: { stroke: "#f59e0b", strokeWidth: 3, strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#f59e0b",
      },
    });

    // Gather Info Rules
    rules.gatherInfoRules.forEach((rule) => {
      const node: Node = {
        id: `gather-${rule.id}`,
        type: "rule",
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          label: rule.label,
          expression: rule.condition,
          description: rule.description,
          type: "Gather Info",
          variant: "secondary",
          ruleType: "gather_info_rule",
        },
      };
      nodesList.push(node);

      // Connect decline rules (IF FALSE) or start to gather rule
      if (rules.declineRules.length > 0) {
        rules.declineRules.forEach((declineRule) => {
          edgesList.push({
            id: `decline-${declineRule.id}-gather-${rule.id}`,
            source: `decline-${declineRule.id}`,
            target: `gather-${rule.id}`,
            animated: true,
            label: "IF FALSE",
            labelStyle: { fill: "#f59e0b", fontWeight: "bold", fontSize: 12 },
            style: {
              stroke: "#f59e0b",
              strokeWidth: 3,
              strokeDasharray: "5,5",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#f59e0b",
            },
          });
        });
      } else {
        // Connect start directly to gather rule if no decline rules
        edgesList.push({
          id: `start-gather-${rule.id}`,
          source: "start",
          target: `gather-${rule.id}`,
          animated: true,
          style: { stroke: "#f59e0b", strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#f59e0b",
          },
        });
      }

      // Connect gather rule to PENDING exit (if triggered)
      edgesList.push({
        id: `gather-${rule.id}-pending`,
        source: `gather-${rule.id}`,
        target: "pending-exit",
        animated: true,
        label: "IF TRUE",
        labelStyle: { fill: "#f59e0b", fontWeight: "bold", fontSize: 12 },
        style: { stroke: "#f59e0b", strokeWidth: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
        },
      });

      // Connect gather rule to risk evaluation (if not triggered)
      edgesList.push({
        id: `gather-${rule.id}-risk`,
        source: `gather-${rule.id}`,
        target: "risk-evaluation",
        animated: true,
        label: "IF FALSE",
        labelStyle: { fill: "#10b981", fontWeight: "bold", fontSize: 12 },
        style: { stroke: "#10b981", strokeWidth: 3, strokeDasharray: "10,5" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      });
    });

    // Stage 2 Header: Risk Assessment
    const stage2Header: Node = {
      id: "stage-2-header",
      type: "stageHeader",
      position: { x: 0, y: 0 },
      data: {
        label: "STAGE 2: Risk Assessment",
        description: "Compute risk factors based on inputs",
        stage: 2,
      },
      draggable: false,
      selectable: false,
    };
    nodesList.push(stage2Header);

    // Risk Factor Nodes
    rules.riskFactors.forEach((factor) => {
      const node: Node = {
        id: `risk-${factor.id}`,
        type: "rule",
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          label: factor.label,
          expression: factor.expression,
          description: factor.description,
          type: "Risk Factor",
          variant: "default",
          ruleType: "risk_factor",
        },
      };
      nodesList.push(node);

      // Connect risk evaluation to each risk factor
      edgesList.push({
        id: `risk-eval-risk-${factor.id}`,
        source: "risk-evaluation",
        target: `risk-${factor.id}`,
        animated: true,
        style: { stroke: "#8b5cf6", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#8b5cf6",
        },
      });
    });

    // Connect risk factors directly to premium calculation
    rules.riskFactors.forEach((factor) => {
      edgesList.push({
        id: `risk-${factor.id}-premium`,
        source: `risk-${factor.id}`,
        target: "premium-calculation",
        animated: true,
        style: { stroke: "#8b5cf6", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#8b5cf6",
        },
      });
    });

    // Stage 3 Header: Decision & Premium
    const stage3Header: Node = {
      id: "stage-3-header",
      type: "stageHeader",
      position: { x: 0, y: 0 },
      data: {
        label: "STAGE 3: Decision & Premium",
        description: "Final outcome and premium calculation",
        stage: 3,
      },
      draggable: false,
      selectable: false,
    };
    nodesList.push(stage3Header);

    // Premium Calculation Node
    const mortalityFormulasText = rules.mortalityFormulas
      .map((f) => `${f.sex}: ${f.formula}`)
      .join("\n");

    const premiumNode: Node = {
      id: "premium-calculation",
      type: "rule",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: "Premium Calculation",
        expression:
          rules.mortalityFormulas.length > 0
            ? rules.mortalityFormulas[0].formula
            : "0.0008 + age * 0.00002",
        type: "Calculation",
        variant: "outline",
        ruleType: "mortality_formula",
        fullExpression: `basePremium × totalMultiplier × (1 + margin)\n\n${mortalityFormulasText}`,
      },
    };
    nodesList.push(premiumNode);

    // Connect risk evaluation to premium if there are no risk factors
    if (rules.riskFactors.length === 0) {
      edgesList.push({
        id: "risk-eval-premium",
        source: "risk-evaluation",
        target: "premium-calculation",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      });
    }

    // Final Decision Nodes - one for each outcome
    const acceptNode: Node = {
      id: "decision-accept",
      type: "final",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: "ACCEPT",
        value: "Application Accepted",
        icon: "✅",
      },
    };
    nodesList.push(acceptNode);

    const acceptWithPremiumNode: Node = {
      id: "decision-accept-premium",
      type: "final",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: "ACCEPT_WITH_PREMIUM",
        value: "Application Accepted with Premium",
        icon: "💰",
      },
    };
    nodesList.push(acceptWithPremiumNode);

    const rejectDecisionNode: Node = {
      id: "decision-reject",
      type: "final",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: "REJECT",
        value: "Application Rejected",
        icon: "❌",
      },
    };
    nodesList.push(rejectDecisionNode);

    // Connect premium calculation to all possible outcomes
    // ACCEPT (no premium needed)
    edgesList.push({
      id: "premium-accept",
      source: "premium-calculation",
      target: "decision-accept",
      animated: true,
      label: "IF NO PREMIUM",
      labelStyle: { fill: "#10b981", fontWeight: "bold", fontSize: 12 },
      style: { stroke: "#10b981", strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#10b981",
      },
    });

    // ACCEPT_WITH_PREMIUM (premium required)
    edgesList.push({
      id: "premium-accept-premium",
      source: "premium-calculation",
      target: "decision-accept-premium",
      animated: true,
      label: "IF PREMIUM REQUIRED",
      labelStyle: { fill: "#10b981", fontWeight: "bold", fontSize: 12 },
      style: { stroke: "#10b981", strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#10b981",
      },
    });

    // REJECT (if risk too high after premium calculation)
    edgesList.push({
      id: "premium-reject",
      source: "premium-calculation",
      target: "decision-reject",
      animated: true,
      label: "IF RISK TOO HIGH",
      labelStyle: { fill: "#ef4444", fontWeight: "bold", fontSize: 12 },
      style: { stroke: "#ef4444", strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#ef4444",
      },
    });

    // Return nodes and edges (positions will be calculated by dagre)
    return { nodes: nodesList, edges: edgesList };
  }, [rules]);

  // Layout nodes with custom positioning
  const { nodes, edges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  // Sort nodes to ensure background groups render behind other nodes
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      if (a.type === "stageGroup" && b.type !== "stageGroup") return -1;
      if (b.type === "stageGroup" && a.type !== "stageGroup") return 1;
      return 0;
    });
  }, [nodes]);

  // Memoize nodeTypes to prevent React Flow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={sortedNodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 800 }}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 3 },
          type: "default", // Explicitly set edge type
        }}
        style={{
          background: "transparent",
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "start") return "#3b82f6";
            if (node.type === "final") return "#10b981";
            if (node.type === "exit") {
              const variant = (node.data as any)?.variant;
              return variant === "reject" ? "#ef4444" : "#f59e0b";
            }
            return "#6b7280";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
