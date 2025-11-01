"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  required = false,
  helpText,
  placeholder,
  error,
  min,
  max,
}: NumberInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`number-${label}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={`number-${label}`}
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : Number(val));
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      />
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

