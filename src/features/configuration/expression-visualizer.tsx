"use client";

import { useMemo } from "react";
import { Parser } from "expr-eval";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ExpressionVisualizerProps {
  expression: string;
  ruleType: "risk_factor" | "decline_rule" | "gather_info_rule" | "mortality_formula";
}

// Detect which variable the expression depends on
function detectVariable(expression: string): string | null {
  // Priority order matters - check more specific ones first
  const varPriority = [
    { name: "bmi", test: (expr: string) => /\bbmi\b/i.test(expr) },
    { name: "age", test: (expr: string) => /\bage\b/i.test(expr) },
    { name: "isSmoking", test: (expr: string) => /\bisSmoking\b/i.test(expr) },
    { name: "severity", test: (expr: string) => /\bseverity\b/i.test(expr) },
    { name: "status", test: (expr: string) => /\bstatus\b/i.test(expr) },
    { name: "impact", test: (expr: string) => /\bimpact\b/i.test(expr) },
  ];
  
  for (const { name, test } of varPriority) {
    if (test(expression)) {
      return name;
    }
  }
  
  return null;
}

// Generate sample data points for visualization
function generateDataPoints(
  expression: string,
  variable: string | null,
  ruleType: string
): Array<{ x: number; y: number }> {
  const parser = new Parser();
  let expr;
  
  try {
    expr = parser.parse(expression);
  } catch {
    return [];
  }

  const dataPoints: Array<{ x: number; y: number }> = [];

  if (!variable) {
    // Constant or boolean expression - show single value
    try {
      const context: any = {
        age: 35,
        bmi: 25,
        isSmoking: false,
        severity: "minor",
        status: "resolved",
        impact: "none",
        max: Math.max,
        min: Math.min,
        isNaN: isNaN,
      };
      const value = expr.evaluate(context);
      const numValue = typeof value === "boolean" ? (value ? 1 : 0) : value;
      if (ruleType === "decline_rule" || ruleType === "gather_info_rule") {
        // Boolean - show as step function
        return [
          { x: 0, y: numValue },
          { x: 1, y: numValue },
        ];
      }
      return [{ x: 0, y: numValue }, { x: 1, y: numValue }];
    } catch {
      return [];
    }
  }

  // Generate data points based on variable type
  if (variable === "bmi") {
    for (let x = 15; x <= 50; x += 1) {
      try {
        const context: any = {
          bmi: x,
          age: 35,
          isSmoking: false,
          severity: "minor",
          status: "resolved",
          impact: "none",
          max: Math.max,
          min: Math.min,
          isNaN: isNaN,
        };
        const y = expr.evaluate(context);
        const numY = typeof y === "boolean" ? (y ? 1 : 0) : y;
        if (typeof numY === "number" && !isNaN(numY) && isFinite(numY)) {
          dataPoints.push({ x, y: numY });
        }
      } catch {
        // Skip invalid points
      }
    }
  } else if (variable === "age") {
    for (let x = 18; x <= 100; x += 2) {
      try {
        const context: any = {
          age: x,
          bmi: 25,
          isSmoking: false,
          sex: "male",
          severity: "minor",
          status: "resolved",
          impact: "none",
          max: Math.max,
          min: Math.min,
          isNaN: isNaN,
        };
        const y = expr.evaluate(context);
        const numY = typeof y === "boolean" ? (y ? 1 : 0) : y;
        if (typeof numY === "number" && !isNaN(numY) && isFinite(numY)) {
          dataPoints.push({ x, y: numY });
        }
      } catch {
        // Skip invalid points
      }
    }
  } else if (variable === "severity" || variable === "status" || variable === "impact") {
    // Categorical variables - show discrete points
    const categories = 
      variable === "severity" ? ["minor", "moderate", "severe"] :
      variable === "status" ? ["resolved", "ongoing", "unclear"] :
      ["none", "partial", "major"];
    
    categories.forEach((cat, idx) => {
      try {
        const context: any = {
          [variable]: cat,
          age: 35,
          bmi: 25,
          isSmoking: false,
          severity: variable === "severity" ? cat : "minor",
          status: variable === "status" ? cat : "resolved",
          impact: variable === "impact" ? cat : "none",
          max: Math.max,
          min: Math.min,
          isNaN: isNaN,
        };
        const y = expr.evaluate(context);
        if (typeof y === "number" && !isNaN(y) && isFinite(y)) {
          dataPoints.push({ x: idx, y });
        } else if (typeof y === "boolean") {
          dataPoints.push({ x: idx, y: y ? 1 : 0 });
        }
      } catch {
        // Skip invalid points
      }
    });
  } else if (variable === "isSmoking") {
    // Boolean - show both states
    try {
      const contextFalse: any = {
        isSmoking: false,
        age: 35,
        bmi: 25,
        severity: "minor",
        status: "resolved",
        impact: "none",
        max: Math.max,
        min: Math.min,
        isNaN: isNaN,
      };
      const contextTrue: any = {
        ...contextFalse,
        isSmoking: true,
      };
      const yFalse = expr.evaluate(contextFalse);
      const yTrue = expr.evaluate(contextTrue);
      return [
        { x: 0, y: typeof yFalse === "number" ? yFalse : yFalse ? 1 : 0 },
        { x: 1, y: typeof yTrue === "number" ? yTrue : yTrue ? 1 : 0 },
      ];
    } catch {
      return [];
    }
  } else {
    // For other variables, generate a simple range
    for (let x = 0; x <= 10; x += 0.5) {
      try {
        const context: any = {
          [variable]: x,
          age: 35,
          bmi: 25,
          isSmoking: false,
          severity: "minor",
          status: "resolved",
          impact: "none",
          max: Math.max,
          min: Math.min,
          isNaN: isNaN,
        };
        const y = expr.evaluate(context);
        const numY = typeof y === "boolean" ? (y ? 1 : 0) : y;
        if (typeof numY === "number" && !isNaN(numY) && isFinite(numY)) {
          dataPoints.push({ x, y: numY });
        }
      } catch {
        // Skip invalid points
      }
    }
  }

  return dataPoints;
}

export default function ExpressionVisualizer({
  expression,
  ruleType,
}: ExpressionVisualizerProps) {
  const chartData = useMemo(() => {
    if (!expression) return [];
    const variable = detectVariable(expression);
    return generateDataPoints(expression, variable, ruleType);
  }, [expression, ruleType]);

  if (chartData.length === 0 || chartData.length === 1) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded">
        <span>Expression visualization not available</span>
      </div>
    );
  }

  // Determine if this is a boolean/step function
  const isBoolean = ruleType === "decline_rule" || ruleType === "gather_info_rule" || chartData.length <= 2;

  // Get color based on rule type
  const lineColor = 
    ruleType === "decline_rule" ? "#ef4444" :
    ruleType === "gather_info_rule" ? "#f59e0b" :
    ruleType === "risk_factor" ? "#8b5cf6" :
    "#10b981";

  // Calculate domain for better visualization
  const yValues = chartData.map(d => d.y).filter(v => typeof v === "number" && isFinite(v));
  if (yValues.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded">
        <span>Invalid expression data</span>
      </div>
    );
  }
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yPadding = Math.max((yMax - yMin) * 0.1, 0.01);

  return (
    <div className="h-24 w-full -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <Line
            type={isBoolean ? "stepAfter" : "monotone"}
            dataKey="y"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={300}
            strokeDasharray={isBoolean ? "5,5" : undefined}
          />
          <XAxis 
            dataKey="x" 
            hide
            domain={['dataMin', 'dataMax']}
          />
          <YAxis 
            hide
            domain={[yMin - yPadding, yMax + yPadding]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              border: "none",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "11px",
              color: "#fff",
            }}
            labelStyle={{ color: "#fff", fontSize: "11px", marginBottom: "4px" }}
            formatter={(value: number, name: string) => {
              if (ruleType === "decline_rule" || ruleType === "gather_info_rule") {
                return [value ? "TRUE" : "FALSE", "Output"];
              }
              return [value.toFixed(3), "Output"];
            }}
            labelFormatter={(label) => `Input: ${typeof label === "number" ? label.toFixed(1) : label}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

