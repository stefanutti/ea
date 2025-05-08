"use client";

import {
  FormControl,
  FormDescription,
  FormField as FormFieldUI,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";

interface FormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type: "text" | "rich-text" | "select" | "switch" | "date";
  placeholder?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

export function FormField({
  form,
  name,
  label,
  type,
  placeholder,
  description,
  options,
  multiple,
}: FormFieldProps) {
  return (
    <FormFieldUI
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === "text" && (
              <Input placeholder={placeholder} {...field} className="w-full" />
            )}
            {type === "rich-text" && (
              <RichTextEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={placeholder}
              />
            )}
            {type === "select" && (
              <Select
                onValueChange={multiple
                  ? (value) => {
                      const currentValues = field.value || [];
                      const valueIndex = currentValues.indexOf(value);
                      if (valueIndex === -1) {
                        field.onChange([...currentValues, value]);
                      } else {
                        field.onChange(currentValues.filter((v) => v !== value));
                      }
                    }
                  : field.onChange}
                value={multiple ? field.value?.[0] : field.value}
                multiple={multiple}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "switch" && (
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{label}</FormLabel>
                  {description && (
                    <FormDescription>
                      {description}
                    </FormDescription>
                  )}
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
            {type === "date" && (
              <Input type="date" {...field} className="w-full" />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}