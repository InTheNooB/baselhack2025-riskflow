"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface YesNoInputProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  required?: boolean;
  helpText?: string;
  error?: string;
}

export function YesNoInput({
  label,
  value,
  onChange,
  required = false,
  helpText,
  error,
}: YesNoInputProps) {
  console.log("value", value);
  console.log("label", label);
  console.log("required", required);
  console.log("helpText", helpText);
  console.log("error", error);
  const handleChange = (val: string) => {
    if (val === "yes") onChange(true);
    else if (val === "no") onChange(false);
    else onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label
        htmlFor={`yesno-${label}`}
        className="text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <RadioGroup
        id={`yesno-${label}`}
        value={value === true ? "yes" : value === false ? "no" : ""}
        onValueChange={handleChange}
        className="flex gap-4"
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      >
        <div className="flex items-center gap-6">
          <Label
            htmlFor={`yes-${label}`}
            className="flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex-1 max-w-[120px] cursor-pointer"
          >
            <RadioGroupItem value="yes" id={`yes-${label}`} />
            <span className="font-normal text-gray-700">Yes</span>
          </Label>
          <Label
            htmlFor={`no-${label}`}
            className="flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex-1 max-w-[120px] cursor-pointer"
          >
            <RadioGroupItem value="no" id={`no-${label}`} />
            <span className="font-normal text-gray-700">No</span>
          </Label>
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
