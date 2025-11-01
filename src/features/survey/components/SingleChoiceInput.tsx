"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SingleChoiceInputProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function SingleChoiceInput({
  label,
  value,
  onChange,
  required = false,
  helpText,
  error,
  options,
}: SingleChoiceInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`single-${label}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        id={`single-${label}`}
        value={value ?? ""}
        onValueChange={onChange}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      >
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`${label}-${option.value}`} />
              <Label
                htmlFor={`${label}-${option.value}`}
                className="cursor-pointer font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
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

