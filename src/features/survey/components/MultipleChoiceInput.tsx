"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface MultipleChoiceInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  helpText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function MultipleChoiceInput({
  label,
  value,
  onChange,
  required = false,
  helpText,
  error,
  options,
}: MultipleChoiceInputProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`multiple-${label}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${label}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                handleChange(option.value, checked === true)
              }
            />
            <Label
              htmlFor={`${label}-${option.value}`}
              className="cursor-pointer font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {helpText && (
        <p id={`${label}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

