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
      <Label
        htmlFor={`multiple-${label}`}
        className="text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Checkbox
              id={`${label}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                handleChange(option.value, checked === true)
              }
            />
            <Label
              htmlFor={`${label}-${option.value}`}
              className="cursor-pointer font-normal text-gray-700 flex-1"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
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
