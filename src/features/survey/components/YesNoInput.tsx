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
  const handleChange = (val: string) => {
    if (val === "yes") onChange(true);
    else if (val === "no") onChange(false);
    else onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`yesno-${label}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        id={`yesno-${label}`}
        value={value === true ? "yes" : value === false ? "no" : ""}
        onValueChange={handleChange}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`yes-${label}`} />
            <Label
              htmlFor={`yes-${label}`}
              className="cursor-pointer font-normal"
            >
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`no-${label}`} />
            <Label
              htmlFor={`no-${label}`}
              className="cursor-pointer font-normal"
            >
              No
            </Label>
          </div>
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

