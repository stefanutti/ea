"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/FormField";
import { useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

interface FlowFormProps {
  onSubmit: (data: any) => void;
  data: any
}

export function FlowForm({ onSubmit, data }: FlowFormProps) {
  const form = useForm<any>({
    defaultValues: {
      flow_id: crypto.randomUUID(),
      name: "",
      description: "",
      initiator_application: "",
      target_application: "",
      communication_mode: "",
      intent: "",
      message_format: "",      
      data_flow: "",
      protocol: "",
      frequency: "",
      estimated_calls_per_day: "",
      average_execution_time_in_sec: "",
      average_message_size_in_kb: "",
      api_gateway: false,
      release_date: "", 
      notes: "",
    },
    mode: "onChange",
    criteriaMode: "all",
    shouldUnregister: false
  });

  useEffect(() => {
    if (data) {
      form.reset({
        ...form.getValues(), // fallback per campi mancanti
        ...data
      });
    }
  }, [data, form]);

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

  const isValidCsvString = (input: string): boolean => {
    const csvPattern = /^(\s*("[^"]+"|[^",]+)\s*)(,\s*("[^"]+"|[^",]+)\s*)*$/;
    return csvPattern.test(input);
  };
  
  const validateJsonFields = (data: any): boolean => {
    const jsonFields = [
      'internal_developers',
      'ams_contacts_email',
      'ams_contacts_phone',
      'internal_application_specialists',
      'business_partner_business_contacts',
      'business_contacts',
      'smes_factory',
      'ownerships',
      'links_to_sharepoint_documentation'
    ];
  
    return jsonFields.every(field => {
      const value = data[field];
      if (!value) return true;
      return isValidCsvString(value);
    });
  };
  
  const handleSubmit = async (data: any) => {
    if (!validateJsonFields(data)) {
      form.setError('root', {
        type: 'manual',
        message: 'Invalid format in one or more fields.'
      });
      return;
    }

    const transformedData = { ...data };

    // Convert array fields to comma-separated strings
    if (Array.isArray(transformedData.access_type)) {
      transformedData.access_type = transformedData.access_type.join(', ');
    }

    if (Array.isArray(transformedData.processes)) {
      transformedData.processes = transformedData.processes.join(', ');
    }

    if (Array.isArray(transformedData.organization_family)) {
      transformedData.organization_family = transformedData.organization_family.join(', ');
    }

    onSubmit(transformedData);
  };

  const amsEnabled = form.watch("ams");

  return (
    <Form {...form}>
      <form id="flow-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {form.formState.errors.root && (
          <div className="text-red-500">{form.formState.errors.root.message}</div>
        )}
        <div className="grid grid-cols-2 gap-8">
          {/* Basic information */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Basic information</h3>
            <FormField
              form={form}
              name="name"
              label="Name*"
              type="text"
              placeholder="Flow name"
            />
            <FormField
              form={form}
              name="description"
              label="Description"
              type="rich-text"
              placeholder="Describe your flow"
            />
          </div>

          {/* Flow details */}
          <div className="space-y-6">

            <FormField
              form={form}
              name="initiator_application"
              label="Initiator Application"
              type="text"
              placeholder="Initiator Application"
            />

            <FormField
              form={form}
              name="communication_mode"
              label="Communication Mode"
              type="select"
              placeholder="Select communication mode"
              options={[
                { value: "Synchronous", label: "Synchronous" },
                { value: "Asynchronous", label: "Asynchronous" },
              ]}
            />


            <FormField
              form={form}
              name="message_format"
              label="Message format"
              type="select"
              placeholder="Select message format"
              options={[
                { value: "binary", label: "Binary" },
                { value: "csv", label: "CSV" },
                { value: "doc", label: "Doc" },
                { value: "image", label: "Image" },
                { value: "json", label: "JSON" },
                { value: "pdf", label: "PDF" },
                { value: "text", label: "Text" },
                { value: "xml", label: "XML" },
                { value: "multiple-formats", label: "Multiple formats" },
                { value: "unknown", label: "Unknown" }
              ]}
            />

            <FormField
              form={form}
              name="protocol"
              label="Protocol"
              type="select"
              placeholder="Select protocol"
              options={[
                { value: "api", label: "api" },
                { value: "cdc:debezium", label: "cdc:debezium" },
                { value: "db", label: "db" },
                { value: "db:stored-procedure", label: "db:stored-procedure" },
                { value: "edi:generic", label: "edi:generic" },
                { value: "email", label: "email" },
                { value: "folder", label: "folder" },
                { value: "ftp", label: "ftp" },
                { value: "http", label: "http" },
                { value: "http:azure-blob-storage", label: "http:azure-blob-storage" },
                { value: "human-manual-task", label: "human-manual-task" },
                { value: "ldap", label: "ldap" },
                { value: "queue", label: "queue" },
                { value: "queue:azure-service-bus", label: "queue:azure-service-bus" },
                { value: "soap", label: "soap" },
                { value: "topic", label: "topic" },  
                { value: "topic:kafka", label: "topic:kafka" },  
                { value: "wcf", label: "wcf" },  
                { value: "web-api", label: "web-api" },  
                { value: "unknown", label: "unknown" },            
              ]}
            />

            
          </div>

          <div className="space-y-6">

            <FormField
              form={form}
              name="target_application"
              label="Target Application"
              type="text"
              placeholder="Target Application"
            />
            

            <FormField
              form={form}
              name="intent"
              label="Intent"
              type="select"
              placeholder="Select type"
              options={[
                { value: "read", label: "read" },
                { value: "write", label: "write" },
                { value: "read:query", label: "read:query" },
                { value: "read:dequeue", label: "read:dequeue" },
                { value: "read:subscribe", label: "read:subscribe" },
                { value: "write:command", label: "write:command" },
                { value: "write:insert", label: "write:insert" },
                { value: "write:enqueue", label: "write:enqueue" },
                { value: "write:publish", label: "write:publish" },
                { value: "unknown", label: "unknown" },
              ]}
            />


            <FormField
              form={form}
              name="data_flow"
              label="Data flow"
              type="select"
              placeholder="Select data flow"
              options={[
                { value: "in", label: "In" },
                { value: "out", label: "Out" },
              ]}
            />

          </div>

          {/* Details */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Details</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="frequency"
                label="Frequency"
                type="text"
                placeholder="Frequency"
              />

              <FormField
                form={form}
                name="estimated_calls_per_day"
                label="Estimated calls per day"
                type="text"
                placeholder="Frequency"
              />

              <FormField
                form={form}
                name="average_execution_time_in_sec"
                label="Average execution time in sec"
                type="text"
                placeholder="Average execution time in sec"
              />

              <FormField
                form={form}
                name="average_message_size_in_kb"
                label="Average message size in kb"
                type="text"
                placeholder="Average message size in kb"
              />

            </div>
          </div>


          {/* Status and flags */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Status and flags</h3>
            
            <div className="grid grid-cols-2 gap-8">

              <FormField
                form={form}
                name="api_gateway"
                label="Api Gateway"
                type="switch"
                description="Is api gateway enabled?"
              />


              <FormField
                  form={form}
                  name="release_date"
                  label="Release date"
                  type="date"
              />

            </div>
          </div>

          {/* Additional information */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Additional information</h3>
            
            <FormField
              form={form}
              name="notes"
              label="Notes"
              type="rich-text"
              placeholder="Enter notes"
            />
          </div>
        </div>
      </form>
    </Form>
  );
}