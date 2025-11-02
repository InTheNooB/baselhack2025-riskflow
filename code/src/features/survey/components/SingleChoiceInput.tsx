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
      <Label
        htmlFor={`single-${label}`}
        className="text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <RadioGroup
        id={`single-${label}`}
        value={value ?? ""}
        onValueChange={onChange}
        className="space-y-3"
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      >
        <div className="space-y-3">
          {options.map((option) => (
            <Label
              key={option.value}
              htmlFor={`${label}-${option.value}`}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RadioGroupItem
                value={option.value}
                id={`${label}-${option.value}`}
              />
              <span className="font-normal text-gray-700 flex-1">
                {option.label}
              </span>
            </Label>
          ))}
        </div>
      </RadioGroup>
      {helpText && (
        <p id={`${label}-help`} className="text-xs text-gray-500 mt-1">
          {helpText}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
