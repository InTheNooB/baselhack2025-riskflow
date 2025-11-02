"use client";

import * as React from "react";
import { TextInput } from "./TextInput";
import { NumberInput } from "./NumberInput";
import { YesNoInput } from "./YesNoInput";
import { SingleChoiceInput } from "./SingleChoiceInput";
import { MultipleChoiceInput } from "./MultipleChoiceInput";

interface QuestionOption {
  value: string;
  label: string;
}

interface SurveyFieldProps {
  questionId: string;
  type: "TEXT" | "NUMBER" | "YESNO" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  label: string;
  value: string | number | boolean | string[] | null;
  onChange: (value: string | number | boolean | string[] | null) => void;
  required?: boolean;
  helpText?: string;
  error?: string;
  options?: QuestionOption[];
}

export function SurveyField({
  questionId,
  type,
  label,
  value,
  onChange,
  required = false,
  helpText,
  error,
  options = [],
}: SurveyFieldProps) {
  switch (type) {
    case "TEXT":
      return (
        <TextInput
          label={label}
          value={(value as string) || ""}
          onChange={onChange as (v: string) => void}
          required={required}
          helpText={helpText}
          error={error}
        />
      );

    case "NUMBER":
      return (
        <NumberInput
          label={label}
          value={typeof value === "number" ? value : null}
          onChange={onChange as (v: number | null) => void}
          required={required}
          helpText={helpText}
          error={error}
        />
      );

    case "YESNO":
      return (
        <YesNoInput
          label={label}
          value={(value as boolean) ?? null}
          onChange={onChange as (v: boolean | null) => void}
          required={required}
          helpText={helpText}
          error={error}
        />
      );

    case "SINGLE_CHOICE":
      return (
        <SingleChoiceInput
          label={label}
          value={(value as string) ?? null}
          onChange={onChange as (v: string) => void}
          required={required}
          helpText={helpText}
          error={error}
          options={options}
        />
      );

    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceInput
          label={label}
          value={(value as string[]) || []}
          onChange={onChange as (v: string[]) => void}
          required={required}
          helpText={helpText}
          error={error}
          options={options}
        />
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unknown question type: {type}
        </div>
      );
  }
}

