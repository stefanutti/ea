"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/RichTextEditor";
import Select from 'react-select';

interface FormFieldProps {
  name: string;
  label: string;
  type: "text" | "select" | "switch" | "date" | "rich-text";
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  form: any;
}

export function FormField({
  name,
  label,
  type,
  placeholder,
  description,
  options,
  multiple,
  form,
}: FormFieldProps) {
  const { register, setValue, watch } = form;
  const value = watch(name);

  const handleChange = (newValue: any) => {
    setValue(name, newValue, { shouldValidate: true });
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--background))',
      borderColor: 'hsl(var(--input))',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'hsl(var(--primary))' 
        : state.isFocused 
          ? 'hsl(var(--accent))' 
          : 'transparent',
      color: state.isSelected 
        ? 'hsl(var(--primary-foreground))' 
        : 'hsl(var(--foreground))',
      ':active': {
        backgroundColor: state.isSelected 
          ? 'hsl(var(--primary))' 
          : 'hsl(var(--accent))',
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--secondary))',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: 'hsl(var(--secondary-foreground))',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: 'hsl(var(--secondary-foreground))',
      ':hover': {
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
      },
    }),
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {type === "text" && (
        <Input
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className="w-full"
        />
      )}

      {type === "rich-text" && (
        <RichTextEditor
          value={value || ""}
          onChange={(newValue) => handleChange(newValue)}
          placeholder={placeholder}
        />
      )}

      {type === "select" && options && (
        multiple ? (
          <Select
            isMulti
            options={options}
            value={options.filter((o) => (value || []).includes(o.value))}
            onChange={(selectedOptions) =>
              handleChange(selectedOptions?.map((o) => o.value) || [])
            }
            placeholder={placeholder}
            styles={selectStyles}
          />
        ) : (
          <Select
            options={options}
            value={options.find((o) => o.value === value)}
            onChange={(selectedOption) =>
              handleChange(selectedOption?.value || "")
            }
            placeholder={placeholder}
            styles={selectStyles}
          />
        )
      )}

      {type === "switch" && (
        <Switch
          checked={value}
          onCheckedChange={(checked) => handleChange(checked)}
        />
      )}

      {type === "date" && (
        <Input
          {...register(name)}
          id={name}
          type="date"
          className="w-full"
        />
      )}
    </div>
  );
}