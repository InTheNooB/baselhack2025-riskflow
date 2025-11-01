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
      <Label htmlFor={`text-${label}`} className="text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={`text-${label}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 bg-white border-gray-300 focus:border-[#0ea5e9] focus:ring-[#0ea5e9]"
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText ? `${label}-help` : undefined}
      />
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

