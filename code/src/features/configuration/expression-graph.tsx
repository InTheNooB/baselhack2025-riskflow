"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Parser } from "expr-eval";

interface ExpressionGraphProps {
  expression: string;
  ruleType: "risk_factor" | "decline_rule" | "gather_info_rule" | "mortality_formula";
  label: string;
}

export default function ExpressionGraph({
  expression,
  ruleType,
  label,
}: ExpressionGraphProps) {
  const graphData = useMemo(() => {
    try {
      const parser = new Parser();
      const expr = parser.parse(expression);

      // Determine what to visualize based on rule type
      if (ruleType === "risk_factor") {
        // Risk factors usually depend on a single variable (bmi, age, etc.)
        // Try to detect which variable is used
        const vars = expr.variables();
        
        if (vars.length === 0) {
          // Constant value
          const value = expr.evaluate({});
          return [{ x: 0, y: value }, { x: 1, y: value }, { x: 2, y: value }];
        }

        // Get the first variable (most common: bmi, age, etc.)
        const varName = vars[0];
        
        // Sample values based on variable type
        let samples: number[] = [];

        if (varName === "bmi") {
          samples = Array.from({ length: 41 }, (_, i) => 15 + i); // BMI 15-55
        } else if (varName === "age") {
          samples = Array.from({ length: 61 }, (_, i) => 18 + i); // Age 18-78
        } else if (varName === "isSmoking" || varName.includes("is") || varName.includes("Smoking")) {
          // Boolean variable - show two points
          const contextFalse: Record<string, string | number | boolean> = { [varName]: false };
          const contextTrue: Record<string, string | number | boolean> = { [varName]: true };
          return [
            { x: "No", y: Number(expr.evaluate(contextFalse as unknown as Parameters<typeof expr.evaluate>[0])) },
            { x: "Yes", y: Number(expr.evaluate(contextTrue as unknown as Parameters<typeof expr.evaluate>[0])) },
          ];
        } else {
          // Generic numeric variable
          samples = Array.from({ length: 50 }, (_, i) => i);
        }

        // Evaluate expression for each sample
        const data = samples.map((x) => {
          try {
            const context: Record<string, string | number | boolean> = {};
            vars.forEach((v) => {
              if (v === varName) {
                context[v] = x;
              } else {
                // Set default values for other variables
                if (v === "bmi") context[v] = 25;
                else if (v === "age") context[v] = 40;
                else if (v === "isSmoking" || v.toLowerCase().includes("smoking")) context[v] = false;
                else if (v.includes("severity")) context[v] = "moderate";
                else if (v.includes("status")) context[v] = "ongoing";
                else if (v.includes("impact")) context[v] = "partial";
                else context[v] = 0;
              }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const y = expr.evaluate(context as any);
            return { x, y: typeof y === "number" ? y : y ? 1 : 0 };
          } catch {
            return { x, y: 0 };
          }
        });

        return data.map((d) => ({ ...d, y: Math.max(0, d.y) })); // Ensure non-negative for risk factors
      } else if (ruleType === "decline_rule" || ruleType === "gather_info_rule") {
        // Boolean rules - visualize as threshold
        // Try to find the key variable and show when it triggers
        const vars = expr.variables();
        
        if (vars.length === 0) {
          const value = expr.evaluate({});
          return [{ x: 0, y: value ? 1 : 0 }, { x: 1, y: value ? 1 : 0 }];
        }

        const varName = vars[0];
        let samples: number[] = [];

        if (varName === "bmi") {
          samples = Array.from({ length: 41 }, (_, i) => 15 + i);
        } else if (varName === "age") {
          samples = Array.from({ length: 61 }, (_, i) => 18 + i);
        } else {
          samples = Array.from({ length: 50 }, (_, i) => i);
        }

        const data = samples.map((x) => {
          try {
            const context: Record<string, string | number | boolean> = {};
            vars.forEach((v) => {
              if (v === varName) {
                context[v] = x;
              } else {
                // Set defaults
                if (v.includes("severity")) context[v] = "moderate";
                else if (v.includes("status")) context[v] = "ongoing";
                else if (v.includes("impact")) context[v] = "partial";
                else context[v] = v === "bmi" ? 25 : v === "age" ? 40 : 0;
              }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = expr.evaluate(context as any);
            return { x, y: result ? 1 : 0 };
          } catch {
            return { x, y: 0 };
          }
        });

        return data;
      } else {
        // Mortality formula - usually depends on age
        const vars = expr.variables();
        const samples = Array.from({ length: 61 }, (_, i) => 18 + i);

        const data = samples.map((x) => {
          try {
            const context: Record<string, number> = {};
            vars.forEach((v) => {
              context[v] = x;
            });
            const y = expr.evaluate(context);
            return { x, y: typeof y === "number" ? y : 0 };
          } catch {
            return { x, y: 0 };
          }
        });

        return data;
      }
    } catch (error) {
      console.error("Error parsing expression:", error);
      return [{ x: 0, y: 0 }];
    }
  }, [expression, ruleType]);

  // Determine color based on rule type
  const lineColor = 
    ruleType === "risk_factor" ? "#8b5cf6" :
    ruleType === "decline_rule" ? "#ef4444" :
    ruleType === "gather_info_rule" ? "#f59e0b" :
    "#10b981";

  // Determine if it's boolean (0/1) or continuous
  const isBoolean = ruleType === "decline_rule" || ruleType === "gather_info_rule";
  const yDomain = isBoolean ? [0, 1.2] : undefined;

  // Create a safe label ID for gradient
  const gradientId = `gradient-${label.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div className="w-full h-[140px] mt-2 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={graphData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-700" opacity={0.3} />
          <XAxis 
            dataKey="x" 
            tick={{ fontSize: 9, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={(value) => {
              if (typeof value === "string") return value;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value.toString();
            }}
          />
          <YAxis 
            tick={{ fontSize: 9, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            domain={yDomain || ["auto", "auto"]}
            tickFormatter={(value) => {
              if (isBoolean) return value ? "T" : "F";
              if (value < 0.01) return value.toFixed(4);
              if (value < 1) return value.toFixed(2);
              return value.toFixed(1);
            }}
          />
          <Tooltip 
            contentStyle={{ 
              fontSize: "11px", 
              padding: "6px 10px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${lineColor}`,
              borderRadius: "6px",
            }}
            formatter={(value: number) => {
              if (isBoolean) return [`${value ? "TRUE" : "FALSE"}`, "Result"];
              return [`${typeof value === "number" ? value.toFixed(3) : value}`, "Value"];
            }}
            labelFormatter={(label) => `Input: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 2 }}
            fill={`url(#${gradientId})`}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

