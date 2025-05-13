"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/FormField";
import { useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

interface SaveDrawingFormProps {
  onSubmit: (data: any) => void;
}

export function SaveDrawingForm({ onSubmit }: SaveDrawingFormProps) {
  const form = useForm<any>({
    defaultValues: {
      filename: "",
      user_id: 12345,
      drawings: "",
      version: 1,
    },

    mode: "onChange",
    criteriaMode: "all",
    shouldUnregister: false
  });

  const debouncedTrigger = useCallback(
    debounce(() => form.trigger(), 500),
    [form]
  );

  useEffect(() => {
    const subscription = form.watch(() => {
      debouncedTrigger();
    });
    return () => {
      subscription.unsubscribe();
      debouncedTrigger.cancel();
    };
  }, [form, debouncedTrigger]);

  
  const handleSubmit = async (data: any) => {

    const transformedData = { ...data };

    onSubmit(transformedData);
  };


  return (
    <Form {...form}>
      <form id="save-drawing-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {form.formState.errors.root && (
          <div className="text-red-500">{form.formState.errors.root.message}</div>
        )}
          <div className="col-span-2 space-y-12">
            <FormField
              form={form}
              name="filename"
              label="File name*"
              type="text"
              placeholder="File name"
            />
          </div>
      </form>
    </Form>
  );
}