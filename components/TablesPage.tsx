"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUpDown, Pencil } from "lucide-react";
import { executeQuery } from "@/lib/neo4j";
import { toast } from "sonner";
import { ApplicationForm } from "./ApplicationForm";
import { FlowForm } from "./FlowForm";
import { ScrollArea } from "@/components/ui/scroll-area";

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

type TableData = {
  id: string;
  [key: string]: any;
};

const appColumns = [
  "application_id",
  "name",
  "description",
  "application_type",
  "ownerships",
  "active",
  "internal_developers",
  "hosting",
  "ams",
  "sw_supplier",
  "disaster_recovery",
  "user_license_type",
  "access_type",
  "ams_expire_date",
  "ams_contacts_email",
  "ams_contacts_phone",
  "ams_portal",
  "ams_service",
  "ams_type",
  "ams_supplier",
  "organization_family",
  "scope",
  "to_be_decommissioned",
  "decommission_date",
  "bi",
  "criticality",
  "complexity",
  "effort",
  "links_to_sharepoint_documentation",
  "links_to_documentation",
  "notes",
  "processes",
  "internal_application_specialists",
  "business_partner_business_contacts",
  "business_contacts",
  "smes_factory",
];

const flowColumns = [
  "flow_id",
  "name",
  "description",
  "communication_mode",
  "intent",
  "message_format",
  "data_flow",
  "protocol",
  "frequency",
  "estimated_calls_per_day",
  "average_execution_time_in_sec",
  "average_message_size_in_kb",
  "api_gateway",
  "release_date",
  "notes",
];

export function TablesPage() {
  const [columns, setColumns] = useState<any>(appColumns);
  const [applications, setApplications] = useState<TableData[]>([]);
  const [flows, setFlows] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [tableShown, setTableShown] = useState<string>("applications");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [applicationData, setApplicationData] = useState<any>({});
  const [flowData, setFlowData] = useState<any>({});

  const fetchApplications = async () => {
    try {
      const results = await executeQuery(
        "MATCH (a:Application) RETURN a",
        {},
        new AbortController().signal
      );

      setApplications(
        results.map((record) => ({
          id: record.a.elementId,
          ...record.a.properties,
        }))
      );
      toast.success("Applications data loaded successfully");
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  };

  const fetchFlows = async () => {
    try {
      const results = await executeQuery(
        "MATCH ()-[r:technical_flow]->() RETURN r",
        {},
        new AbortController().signal
      );

      setFlows(
        results.map((record) => ({
          id: record.r.elementId,
          ...record.r.properties,
        }))
      );
      toast.success("Flows data loaded successfully");
    } catch (error) {
      console.error("Error fetching flows:", error);
      toast.error("Failed to load flows");
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchApplications(), fetchFlows()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setSelectedRowId(null);

    if (tableShown == "applications") {
      setColumns(appColumns);
    } else {
      setColumns(flowColumns);
    }
  }, [tableShown]);

  const filterData = (data: TableData[]) => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  };

  const sortData = (data: TableData[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      try {
        const parsed = typeof value[0] === "string" ? value : JSON.parse(value);
        return Array.isArray(parsed) ? parsed.join(", ") : String(value);
      } catch {
        return String(value);
      }
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

 function cleanObj(obj: any): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          const cleanArray = parsed
            .map((v) => v?.toString().trim())
            .filter((v) => v && v !== "[]");

          result[key] = cleanArray.length > 0 ? cleanArray.join(",") : "";
          continue;
        }
      } catch {
      }
    }

    result[key] = value;
  }

  return result;
}

  const openDialog = (tableShown: string) => {

    if (tableShown == "applications") {
      setApplicationData(cleanObj(applications.find((obj) => obj.id === selectedRowId)));
      setFlowData({});
      setIsApplicationDialogOpen(true);
    } else {
      setFlowData(flows.find((obj) => obj.id === selectedRowId));
      setApplicationData({});
      setIsFlowDialogOpen(true);
    }
  };

  const handleApplicationSubmit = async (data: any) => {
    try {
      console.log("App submit ", data)
      const transformedData = {
        ...data,
        /*internal_application_specialists: data.internal_application_specialists
          ? JSON.stringify(
              data.internal_application_specialists
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        business_partner_business_contacts:
          data.business_partner_business_contacts
            ? JSON.stringify(
                data.business_partner_business_contacts
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              )
            : "[]",
        business_contacts: data.business_contacts
          ? JSON.stringify(
              data.business_contacts
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        internal_developers: data.internal_developers
          ? JSON.stringify(
              data.internal_developers
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        ams_contacts_email: data.ams_contacts_email
          ? JSON.stringify(
              data.ams_contacts_email
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        ams_contact_phone: data.ams_contact_phone
          ? JSON.stringify(
              data.ams_contact_phone
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        smes_factory: data.smes_factory
          ? JSON.stringify(
              data.smes_factory
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",
        notes: data.notes
          ? JSON.stringify(
              data.notes
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",*/
        ams_expire_date: data.ams_expire_date || null,
        ams_supplier: data.ams_supplier || "",
        ams_portal: data.ams_portal || "",
        links_to_documentation: data.links_to_documentation || "",
        ams_type: data.ams_type || "",
        decommission_date: data.decommission_date || null,
      };

      await handleSaveApplication(transformedData);
    } catch (error) {
      console.error("Error transforming data:", error);
      toast.error("Invalid format in one or more fields");
    }
  };

  const handleFlowSubmit = async (data: any) => {
    try {
      const transformedData = {
        ...data,
        /*notes: data.notes
          ? JSON.stringify(
              data.notes
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          : "[]",*/
        release_date: data.release_date || null,
      };

      //console.log("Data -> ", transformedData)
      await handleSaveFlow(transformedData);
    } catch (error) {
      console.error("Error transforming data:", error);
      toast.error("Invalid format in one or more fields");
    }
  };

  const handleSaveApplication = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    try {
      const editNodeQuery = `
          MATCH (a:Application { application_id: $application_id })
            SET
              a.name = $name,
              a.description = $description,
              a.ownerships = $ownerships,
              a.application_type = $application_type,
              a.complexity = $complexity,
              a.criticality = $criticality,
              a.processes = $processes,
              a.active = $active,
              a.internal_application_specialists = $internal_application_specialists,
              a.business_partner_business_contacts = $business_partner_business_contacts,
              a.business_contacts = $business_contacts,
              a.internal_developers = $internal_developers,
              a.hosting = $hosting,
              a.ams = $ams,
              a.bi = $bi,
              a.disaster_recovery = $disaster_recovery,
              a.user_license_type = $user_license_type,
              a.access_type = $access_type,
              a.sw_supplier = $sw_supplier,
              a.ams_expire_date = $ams_expire_date,
              a.ams_contacts_email = $ams_contacts_email,
              a.ams_contact_phone = $ams_contact_phone,
              a.ams_supplier = $ams_supplier,
              a.smes_factory = $smes_factory,
              a.ams_portal = $ams_portal,
              a.organization_family = $organization_family,
              a.links_to_documentation = $links_to_documentation,
              a.scope = $scope,
              a.ams_service = $ams_service,
              a.ams_type = $ams_type,
              a.decommission_date = $decommission_date,
              a.to_be_decommissioned = $to_be_decommissioned,
              a.notes = $notes,
              a.links_to_sharepoint_documentation = $links_to_sharepoint_documentation
            RETURN a
        `;

      const result = await executeQuery(editNodeQuery, data);

      if (result && result.length > 0) {
        setIsApplicationDialogOpen(false);
        toast.success("Application edited successfully");
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      fetchAllData();
    }
  };

  const handleSaveFlow = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    try {
      const editFlowQuery = `
          MATCH (initiator:Application {application_id: $initiator_application})
          MATCH (target:Application {application_id: $target_application})
          MATCH (initiator)-[f:technical_flow]->(target)
  
          SET
            f.name = $name,
            f.description = $description,
            f.communication_mode = $communication_mode,
            f.intent = $intent,
            f.message_format = $message_format,
            f.data_flow = $data_flow,
            f.protocol = $protocol,
            f.frequency = $frequency,
            f.estimated_calls_per_day = $estimated_calls_per_day,
            f.average_execution_time_in_sec = $average_execution_time_in_sec,
            f.average_message_size_in_kb = $average_message_size_in_kb,
            f.api_gateway = $api_gateway,
            f.release_date = $release_date,
            f.notes = $notes
          RETURN f
          `;

      const result = await executeQuery(editFlowQuery, data);

      if (result && result.length > 0) {
        setIsFlowDialogOpen(false);
        toast.success("Flow edited successfully");
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      fetchAllData();
    }
  };

  const renderTable = (data: TableData[]) => {
    const filteredData = filterData(data);
    const sortedData = sortData(filteredData);

    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Filter..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {/*Pulsante Edit (disabilitato se nessuna riga selezionata) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => openDialog(tableShown)}
              disabled={!selectedRowId}
            >
              <Pencil className={`h-4 w-4`} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchAllData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 border rounded-md">
          <div className="h-full overflow-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 z-10 bg-background whitespace-nowrap shadow-sm">
                        Select
                      </TableHead>
                      {columns.map((column) => (
                        <TableHead
                          key={column}
                          className="sticky top-0 z-10 bg-background whitespace-nowrap shadow-sm"
                        >
                          <Button
                            variant="ghost"
                            onClick={() => handleSort(column)}
                            className="h-8 px-2 font-medium"
                          >
                            {column.charAt(0).toUpperCase() +
                              column.slice(1).replace(/_/g, " ")}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">                        
                          <input
                            type="radio"
                            name="selectRow"
                            checked={selectedRowId === item.id}
                            onChange={() => setSelectedRowId(item.id)}
                          />
                        </TableCell>
                        {columns.map((column) => (
                          <TableCell
                            key={`${item.id}-${column}`}
                            className="whitespace-nowrap"
                          >
                            {formatValue(item[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} entries
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full h-full border rounded-lg bg-card p-6">
        <Tabs defaultValue="applications" className="h-full flex flex-col">
          <TabsList className="w-full justify-start border-b pb-0 bg-transparent">
            <TabsTrigger
              value="applications"
              onClick={() => setTableShown("applications")}
            >
              Applications
            </TabsTrigger>
            <TabsTrigger value="flows" onClick={() => setTableShown("flows")}>
              Flows
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 pt-4 min-h-0">
            <TabsContent value="applications" className="h-full">
              {renderTable(applications)}
            </TabsContent>
            <TabsContent value="flows" className="h-full">
              {renderTable(flows)}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Edit application</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new application and add it to the network
            graph.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <ApplicationForm
                onSubmit={handleApplicationSubmit}
                data={applicationData}
              />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsApplicationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="application-form" disabled={isLoading}>
              Save application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Edit flow</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new flow.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <FlowForm onSubmit={handleFlowSubmit} data={flowData} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsFlowDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="flow-form" disabled={isLoading}>
              Save flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
