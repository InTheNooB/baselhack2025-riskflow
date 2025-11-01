"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  error?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  required = false,
  helpText,
  placeholder,
  error,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`text-${label}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={`text-${label}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

