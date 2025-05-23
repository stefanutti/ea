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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUpDown } from "lucide-react";
import { executeQuery } from "@/lib/neo4j";
import { toast } from "sonner";

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

type TableData = {
  id: string;
  [key: string]: any;
};

const COLUMNS = [
  'application_id',
  'name',
  'description',
  'application_type',
  'ownerships',
  'active',
  'internal_developers',
  'hosting',
  'ams',
  'sw_supplier',
  'disaster_recovery',
  'user_license_type',
  'access_type',
  'ams_expire_date',
  'ams_contacts_email',
  'ams_contacts_phone',
  'ams_portal',
  'ams_service',
  'ams_type',
  'ams_supplier',
  'organization_family',
  'scope',
  'to_be_decommissioned',
  'decommission_date',
  'bi',
  'criticality',
  'complexity',
  'effort',
  'links_to_sharepoint_documentation',
  'links_to_documentation',
  'notes',
  'processes',
  'internal_application_specialists',
  'business_partner_business_contacts',
  'business_contacts',
  'smes_factory'
];

export function TablesPage() {
  const [applications, setApplications] = useState<TableData[]>([]);
  const [businessFlows, setBusinessFlows] = useState<TableData[]>([]);
  const [technicalFlows, setTechnicalFlows] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });

  const fetchApplications = async () => {
    try {
      const results = await executeQuery(
        "MATCH (a:Application) RETURN a",
        {},
        new AbortController().signal
      );
      setApplications(results.map(record => ({ id: record.a.elementId, ...record.a.properties })));
      toast.success("Applications data loaded successfully");
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  };

  const fetchBusinessFlows = async () => {
    try {
      const results = await executeQuery(
        "MATCH (b:BUSINESS_FLOW) RETURN b",
        {},
        new AbortController().signal
      );
      setBusinessFlows(results.map(record => ({ id: record.b.elementId, ...record.b.properties })));
      toast.success("Business flows data loaded successfully");
    } catch (error) {
      console.error("Error fetching business flows:", error);
      toast.error("Failed to load business flows");
    }
  };

  const fetchTechnicalFlows = async () => {
    try {
      const results = await executeQuery(
        "MATCH (t:TECHNICAL_FLOW) RETURN t",
        {},
        new AbortController().signal
      );
      setTechnicalFlows(results.map(record => ({ id: record.t.elementId, ...record.t.properties })));
      toast.success("Technical flows data loaded successfully");
    } catch (error) {
      console.error("Error fetching technical flows:", error);
      toast.error("Failed to load technical flows");
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchApplications(),
        fetchBusinessFlows(),
        fetchTechnicalFlows()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filterData = (data: TableData[]) => {
    return data.filter(item =>
      Object.values(item).some(value =>
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
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
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
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      
      <div className="flex-1 min-h-0 border rounded-md">
        <div className="h-full overflow-auto">  {/* This is crucial */}
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((column) => (
                      <TableHead
                        key={column}
                        className="sticky top-0 z-10 bg-background whitespace-nowrap shadow-sm"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column)}
                          className="h-8 px-2 font-medium"
                        >
                          {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " ")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item) => (
                    <TableRow key={item.id}>
                      {COLUMNS.map((column) => (
                        <TableCell key={`${item.id}-${column}`} className="whitespace-nowrap">
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
    <div className="w-full h-full border rounded-lg bg-card p-6">
      <Tabs defaultValue="applications" className="h-full flex flex-col">
        <TabsList className="w-full justify-start border-b pb-0 bg-transparent">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="business-flows">Business Flows</TabsTrigger>
          <TabsTrigger value="technical-flows">Technical Flows</TabsTrigger>
        </TabsList>
        <div className="flex-1 pt-4 min-h-0">
          <TabsContent value="applications" className="h-full">
            {renderTable(applications)}
          </TabsContent>
          <TabsContent value="business-flows" className="h-full">
            {renderTable(businessFlows)}
          </TabsContent>
          <TabsContent value="technical-flows" className="h-full">
            {renderTable(technicalFlows)}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}