"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/FormField";
import { useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

interface ApplicationFormProps {
  onSubmit: (data: any) => void;
  data: any
}

export function ApplicationForm({ onSubmit, data }: ApplicationFormProps) {
  const form = useForm<any>({
    defaultValues: {
      application_id: crypto.randomUUID(),
      name: "",
      description: "",
      application_type: "Web Application",
      ownerships: "",
      active: true,
      internal_developers: "",
      hosting: "",      
      ams: false,
      sw_supplier: "",
      disaster_recovery: false,
      user_license_type: "",
      access_type: "",
      ams_expire_date: "",
      ams_contacts_email: "",
      ams_contacts_phone: "",
      ams_portal: "",
      ams_service: "No",
      ams_type: "",
      ams_supplier: "",
      organization_family: [],
      scope: "",
      to_be_decommissioned: false,
      decommission_date: "",
      bi: "",
      criticality: "Medium",
      complexity: "Medium",
      effort: "Medium",
      links_to_sharepoint_documentation: "",
      links_to_documentation: "",
      notes: "",
      processes: "",
      internal_application_specialists: "",
      business_partner_business_contacts: "",
      business_contacts: "",
      smes_factory: ""
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
      <form id="application-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
              placeholder="Application name"
            />
            <FormField
              form={form}
              name="description"
              label="Description"
              type="rich-text"
              placeholder="Describe your application"
            />
            <FormField
              form={form}
              name="ownerships"
              label="Ownerships"
              type="text"
              placeholder="Enter comma-separated values"
            />
          </div>

          {/* Application details */}
          <div className="space-y-6">
            <FormField
              form={form}
              name="application_type"
              label="Application type*"
              type="select"
              placeholder="Select type"
              options={[
                { value: "Mobile Application", label: "Mobile application" },
                { value: "Web Application", label: "Web application" },
                { value: "Desktop Application", label: "Desktop application" },
                { value: "BackEnd Application", label: "Backend application" },
                { value: "Other", label: "Other" }
              ]}
            />
            <FormField
              form={form}
              name="complexity"
              label="Complexity*"
              type="select"
              placeholder="Select complexity"
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
                { value: "Critical", label: "Critical" },
                { value: "Unknown", label: "Unknown" }
              ]}
            />
            <FormField
              form={form}
              name="criticality"
              label="Criticality*"
              type="select"
              placeholder="Select criticality"
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
                { value: "Critical", label: "Critical" },
                { value: "Unknown", label: "Unknown" }
              ]}
            />
            <FormField
              form={form}
              name="effort"
              label="Effort*"
              type="select"
              placeholder="Select effort"
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
                { value: "Critical", label: "Critical" },
                { value: "Unknown", label: "Unknown" }
              ]}
            />
          </div>

          <div className="space-y-6">
            <FormField
              form={form}
              name="processes"
              label="Processes*"
              type="select"
              placeholder="Select processes"
              multiple
              options={[
                { value: "People", label: "People" },
                { value: "Finance", label: "Finance" },
                { value: "Contract Logistics", label: "Contract logistics" },
                { value: "LTL / B2C", label: "LTL / B2C" },
                { value: "Sales", label: "Sales" },
                { value: "FTL", label: "FTL" },
                { value: "Workshop Management", label: "Workshop management" },
                { value: "Air&Sea", label: "Air & sea" },
                { value: "Direct Purchasing", label: "Direct purchasing" },
                { value: "Security", label: "Security" },
                { value: "Sustainability & HSE", label: "Sustainability & HSE" },
                { value: "Tech 4 Tech", label: "Tech 4 tech" }
              ]}
            />
            <FormField
              form={form}
              name="scope"
              label="Scope*"
              type="select"
              placeholder="Select scope"
              options={[
                { value: "Data & AI", label: "Data & AI" },
                { value: "Document & Content", label: "Document & content" },
                { value: "Finance", label: "Finance" },
                { value: "HR", label: "HR" },
                { value: "Infrastructure", label: "Infrastructure" },
                { value: "Integration/EDI", label: "Integration/EDI" },
                { value: "Purchasing", label: "Purchasing" },
                { value: "Sales", label: "Sales" },
                { value: "Sustainability", label: "Sustainability" },
                { value: "TMS", label: "TMS" },
                { value: "Traceability", label: "Traceability" },
                { value: "Workshop", label: "Workshop" }
              ]}
            />
            <FormField
              form={form}
              name="organization_family"
              label="Organization family*"
              type="select"
              placeholder="Select organization family"
              multiple
              options={[
                { value: "Core Services", label: "Core Services" },
                { value: "Data & AI", label: "Data & AI" },
                { value: "Enterprise", label: "Enterprise" },
                { value: "Infrastructure", label: "Infrastructure" }
              ]}
            />
          </div>

          {/* Infrastructure */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Infrastructure</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="hosting"
                label="Hosting*"
                type="select"
                placeholder="Select hosting"
                options={[
                  { value: "Engineering Data Center", label: "Engineering data center" },
                  { value: "GCP (Go Reply)", label: "GCP (Go Reply)" },
                  { value: "Standalone", label: "Standalone" },
                  { value: "Azure (Arcese)", label: "Azure (Arcese)" },
                  { value: "Supplier Private Cloud", label: "Supplier private cloud" },
                  { value: "Azure (Microsoft)", label: "Azure (Microsoft)" }
                ]}
              />
              <FormField
                form={form}
                name="bi"
                label="BI*"
                type="select"
                placeholder="Select BI status"
                options={[
                  { value: "Unknown", label: "Unknown" },
                  { value: "Actual BI", label: "Actual BI" },
                  { value: "To manage", label: "To manage" },
                  { value: "Partial BI", label: "Partial BI" },
                  { value: "Data Platform", label: "Data platform" }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="user_license_type"
                label="User license type*"
                type="select"
                placeholder="Select license type"
                options={[
                  { value: "Licenza concorrente", label: "Licenza concorrente" },
                  { value: "Licenza nominale", label: "Licenza nominale" },
                  { value: "Licenza non applicata all'utente", label: "Licenza non applicata all'utente" },
                  { value: "Nessuna licenza", label: "Nessuna licenza" }
                ]}
              />
              <FormField
                form={form}
                name="access_type"
                label="Access type*"
                type="select"
                placeholder="Select access types"
                options={[
                  { value: "Utenza Applicativa", label: "Utenza applicativa" },
                  { value: "Password ADFS (O365)", label: "Password ADFS (O365)" },
                  { value: "Password applicazione", label: "Password applicazione" },
                  { value: "Password di domino (LDAP)", label: "Password di domino (LDAP)" }
                ]}
                multiple
              />
            </div>
          </div>

          {/* Documentation */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Documentation</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="sw_supplier"
                label="Software supplier"
                type="text"
                placeholder="Enter supplier name"
              />
              <FormField
                form={form}
                name="links_to_sharepoint_documentation"
                label="SharePoint documentation links"
                type="text"
                placeholder="Enter comma-separated URLs"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Contacts</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="internal_application_specialists"
                label="Internal application specialists"
                type="text"
                placeholder="Enter comma-separated values"
              />
              <FormField
                form={form}
                name="business_partner_business_contacts"
                label="Business partner contacts"
                type="text"
                placeholder="Enter comma-separated values"
              />
              <FormField
                form={form}
                name="business_contacts"
                label="Business contacts"
                type="text"
                placeholder="Enter comma-separated values"
              />
              <FormField
                form={form}
                name="internal_developers"
                label="Internal developers"
                type="text"
                placeholder="Enter comma-separated values"
              />
            </div>
          </div>
          
          <div className="col-span-2 space-y-6">
              <FormField
                form={form}
                name="smes_factory"
                label="SMEs factory"
                type="text"
                placeholder="Enter comma-separated values"
              />
          </div>

          {/* AMS information */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">AMS information</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="ams"
                label="AMS"
                type="switch"
                description="Enable application management services"
              />
              <FormField
                form={form}
                name="ams_service"
                label="AMS service*"
                type="select"
                placeholder="Select AMS service"
                options={[
                  { value: "No", label: "No" },
                  { value: "On Demand", label: "On demand" }
                ]}
              />
            </div>

            {amsEnabled && (
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  form={form}
                  name="ams_expire_date"
                  label="AMS expiry date"
                  type="date"
                />
                <FormField
                  form={form}
                  name="ams_supplier"
                  label="AMS supplier"
                  type="text"
                  placeholder="Enter supplier name"
                />
                <FormField
                  form={form}
                  name="ams_contacts_email"
                  label="AMS contacts email"
                  type="text"
                  placeholder="Enter comma-separated values"
                />
                <FormField
                  form={form}
                  name="ams_contacts_phone"
                  label="AMS contacts phone"
                  type="text"
                  placeholder="Enter comma-separated international phone numbers"
                />
                <FormField
                  form={form}
                  name="ams_portal"
                  label="AMS portal"
                  type="text"
                  placeholder="Enter portal URL"
                />
                <FormField
                  form={form}
                  name="ams_type"
                  label="AMS type"
                  type="text"
                  placeholder="Enter AMS type"
                />
              </div>
            )}
          </div>

          {/* Status and flags */}
          <div className="col-span-2 space-y-6">
            <h3 className="text-lg font-semibold">Status and flags</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <FormField
                form={form}
                name="active"
                label="Active"
                type="switch"
                description="Is this application currently active?"
              />
              <FormField
                form={form}
                name="disaster_recovery"
                label="Disaster recovery"
                type="switch"
                description="Is disaster recovery enabled?"
              />
              <FormField
                form={form}
                name="to_be_decommissioned"
                label="To be decommissioned"
                type="switch"
                description="Is this application scheduled for decommissioning?"
              />
              <FormField
                form={form}
                name="decommission_date"
                label="Decommission date"
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
            <FormField
              form={form}
              name="links_to_documentation"
              label="Documentation links"
              type="text"
              placeholder="Enter documentation links"
            />
          </div>
        </div>
      </form>
    </Form>
  );
}