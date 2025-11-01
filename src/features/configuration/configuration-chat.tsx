"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface ConfigurationRules {
  riskFactors: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
  }>;
  declineRules: Array<{
    id: string;
    name: string;
    label: string;
    expression: string;
    description: string | null;
  }>;
  gatherInfoRules: Array<{
    id: string;
    name: string;
    label: string;
    condition: string;
    description: string | null;
  }>;
  mortalityFormulas: Array<{
    id: string;
    sex: string;
    formula: string;
    description: string | null;
  }>;
}

interface ConfigurationChatProps {
  rules: ConfigurationRules;
  onRuleUpdate?: (
    ruleType: string,
    ruleName: string,
    newExpression: string
  ) => void;
}

export default function ConfigurationChat({
  rules,
  onRuleUpdate,
}: ConfigurationChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/configuration/chat",
      body: {
        rules: JSON.stringify(rules),
      },
    }),
    onFinish: async ({ message }) => {
      // Parse AI response to extract rule updates
      try {
        // Extract text from message parts
        const textParts = message.parts
          .filter((part) => part.type === "text")
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");

        const jsonMatch = textParts.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const update = JSON.parse(jsonMatch[1]);
          if (
            update.ruleType &&
            update.ruleName &&
            update.expression &&
            onRuleUpdate
          ) {
            onRuleUpdate(update.ruleType, update.ruleName, update.expression);
          }
        }
      } catch (error) {
        console.error("Error parsing AI response:", error);
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">AI Configuration Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Ask me to modify rules and see them update on the diagram
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-2">Start by asking me to modify a rule!</p>
              <p className="text-xs">
                Example: &quot;Make BMI risk factor increase by 3% per point
                above 25&quot;
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={index}
                        className={`text-sm ${
                          message.role === "assistant"
                            ? "whitespace-pre-wrap"
                            : ""
                        }`}
                      >
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {(status === "submitted" || status === "streaming") && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {status === "submitted" ? "Processing..." : "Streaming..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to modify a rule..."
            disabled={status !== "ready"}
            className="flex-1"
          />
          <Button type="submit" disabled={status !== "ready" || !input.trim()}>
            {status !== "ready" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
