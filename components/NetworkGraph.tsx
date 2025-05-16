"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Network } from "vis-network";
import { executeQuery } from "@/lib/neo4j";
import { AppWindow, Link as Line, Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApplicationForm } from "./ApplicationForm";
import { FlowForm } from "./FlowForm";
import { ConfirmModal } from "./ConfirmModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { QueryInput } from "@/components/QueryInput";

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

type TableData = {
  id: string;
  [key: string]: any;
};

const options = {
  nodes: {
    shape: "box",
    font: { size: 16 },
    shadow: true,
  },
  edges: {
    font: { size: 12, align: "middle" },
    color: { color: "#848484", highlight: "#848484" },
    width: 2,
    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
  },
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 200,
      springConstant: 0.04,
    },
    stabilization: {
      enabled: true,
      iterations: 1000,
      updateInterval: 50,
      onlyDynamicEdges: false,
      fit: true,
    },
  },
  layout: {
    improvedLayout: true,
  },
  groups: {
    application: {
      color: { background: "#74b9ff", border: "#0984e3" },
      shape: "box",
    },
    flow: {
      color: { background: "#ffeaa7", border: "#fdcb6e" },
      shape: "triangle",
    },
  },
};

function transformData(data: any) {
  const result: any = {};

  data.forEach((row) => {
    for (const key in row) {
      const item = row[key];
      const {
        elementId,
        properties,
        labels,
        type,
        startNodeElementId,
        endNodeElementId,
      } = item;

      if (!elementId) continue;

      const cleanedProperties = Object.fromEntries(
        Object.entries(properties).map(([k, v]) => {
          if (typeof v === "string") {
            try {
              const parsed = JSON.parse(v);

              if (Array.isArray(parsed)) {
                // Se array vuoto
                if (
                  parsed.length === 0 ||
                  (parsed.length === 1 && parsed[0] === "[]")
                ) {
                  return [k, ""];
                }
                // Se array con valori
                return [k, parsed.join(", ")];
              }
            } catch (e) {
              // Non è un JSON parsabile, continua
            }
          }

          if (Array.isArray(v) && v.length === 0) {
            return [k, ""];
          }

          return [k, v];
        })
      );

      result[elementId] = {
        ...(labels ? { labels: labels[0] } : {}),
        ...(type ? { type } : {}),
        ...(startNodeElementId
          ? { initiator_application: startNodeElementId }
          : {}),
        ...(endNodeElementId ? { target_application: endNodeElementId } : {}),
        ...cleanedProperties,
      };
    }
  });

  return result;
}

function createNodeTooltip(properties: Record<string, any>): string {
  const excludedFields = ["elementId", "labels"];
  const fields = Object.entries(properties)
    .filter(
      ([key]) =>
        !excludedFields.includes(key) &&
        properties[key] !== null &&
        properties[key] !== ""
    )
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `<strong>${formatKey(key)}</strong>: ${value.join(", ")}`;
      }
      return `<strong>${formatKey(key)}</strong>: ${value}`;
    });

  return `<div style="max-width: 300px; padding: 8px;">
    ${fields.join("<br>")}
  </div>`;
}

function createEdgeTooltip(properties: Record<string, any>): string {
  if (!properties || Object.keys(properties).length === 0) {
    return "";
  }

  const fields = Object.entries(properties)
    .filter(([_, value]) => value !== null && value !== "")
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `<strong>${formatKey(key)}</strong>: ${value.join(", ")}`;
      }
      return `<strong>${formatKey(key)}</strong>: ${value}`;
    });

  return `<div style="max-width: 300px; padding: 8px;">
    ${fields.join("<br>")}
  </div>`;
}

function formatKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const currentDataRef = useRef<{
    nodes: Map<string, any>;
    edges: Map<string, any>;
  }>({
    nodes: new Map(),
    edges: new Map(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const physicsStateRef = useRef(isPhysicsEnabled);
  const [graphData, setGraphData] = useState<{
    nodes: any[];
    edges: any[];
  } | null>({nodes: [], edges : []});
  const [dataTransformed, setDataTransformed] = useState<any>([]);
  const dataTransformedRef = useRef(dataTransformed);
  const [applicationData, setApplicationData] = useState<any>({});
  const [flowData, setFlowData] = useState<any>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState({
    show: false,
    data: {}
  });

  const handleQueryResults = useCallback((results: any[]) => {
    const nodes = new Map();
    const edges = [];

    //console.log("RESULTS ",results)
    setDataTransformed(transformData(results));

    results.forEach((record) => {
      const nodeA = record.a;
      const nodeB = record.b;
      const relationship = record.e;

      if (nodeA && !nodes.has(nodeA.elementId)) {
        const label =
          nodeA.properties.name || nodeA.properties.nickname || "Unnamed";
        nodes.set(nodeA.elementId, {
          id: nodeA.elementId,
          label: label,
          title: createNodeTooltip(nodeA.properties),
          group: nodeA.labels[0].toLowerCase(),
        });
      }

      if (nodeB && !nodes.has(nodeB.elementId)) {
        const label =
          nodeB.properties.name || nodeB.properties.nickname || "Unnamed";
        nodes.set(nodeB.elementId, {
          id: nodeB.elementId,
          label: label,
          title: createNodeTooltip(nodeB.properties),
          group: nodeB.labels[0].toLowerCase(),
        });
      }

      if (
        relationship &&
        relationship.startNodeElementId &&
        relationship.endNodeElementId
      ) {
        edges.push({
          id: relationship.elementId,
          from: relationship.startNodeElementId,
          to: relationship.endNodeElementId,
          label: relationship.properties?.name || relationship.type,
          arrows: "to",
          title: createEdgeTooltip(relationship.properties),
        });
      }
    });

    setGraphData({
      nodes: Array.from(nodes.values()),
      edges: edges,
    });
  }, []);

  const handleApplicationSubmit = async (data: any) => {
    try {
      const transformedData = {
        ...data,
        /*internal_application_specialists: data.internal_application_specialists ? JSON.stringify(data.internal_application_specialists.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        business_partner_business_contacts: data.business_partner_business_contacts ? JSON.stringify(data.business_partner_business_contacts.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        business_contacts: data.business_contacts ? JSON.stringify(data.business_contacts.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        internal_developers: data.internal_developers ? JSON.stringify(data.internal_developers.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        ams_contacts_email: data.ams_contacts_email ? JSON.stringify(data.ams_contacts_email.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        ams_contact_phone: data.ams_contact_phone ? JSON.stringify(data.ams_contact_phone.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        smes_factory: data.smes_factory ? JSON.stringify(data.smes_factory.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        notes: data.notes ? JSON.stringify(data.notes.split(',').map(v => v.trim()).filter(Boolean)) : "[]",*/
        ams_contact_phone: data.ams_contact_phone || "",
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
        //notes: data.notes ? JSON.stringify(data.notes.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
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
      const createNodeQuery = `
        CREATE (a:Application {
          application_id: $application_id,
          name: $name,
          description: $description,
          ownerships: $ownerships,
          application_type: $application_type,
          complexity: $complexity,
          criticality: $criticality,
          processes: $processes,
          active: $active,
          internal_application_specialists: $internal_application_specialists,
          business_partner_business_contacts: $business_partner_business_contacts,
          business_contacts: $business_contacts,
          internal_developers: $internal_developers,
          hosting: $hosting,
          ams: $ams,
          bi: $bi,
          disaster_recovery: $disaster_recovery,
          user_license_type: $user_license_type,
          access_type: $access_type,
          sw_supplier: $sw_supplier,
          ams_expire_date: $ams_expire_date,
          ams_contacts_email: $ams_contacts_email,
          ams_contact_phone: $ams_contact_phone,
          ams_supplier: $ams_supplier,
          smes_factory: $smes_factory,
          ams_portal: $ams_portal,
          organization_family: $organization_family,
          links_to_documentation: $links_to_documentation,
          scope: $scope,
          ams_service: $ams_service,
          ams_type: $ams_type,
          decommission_date: $decommission_date,
          to_be_decommissioned: $to_be_decommissioned,
          notes: $notes,
          links_to_sharepoint_documentation: $links_to_sharepoint_documentation
        })
        RETURN a
      `;

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

      const result = await executeQuery(
        Object.keys(applicationData).length === 0
          ? createNodeQuery
          : editNodeQuery,
        data
      );

      if (result && result.length > 0) {
        if (Object.keys(applicationData).length === 0) {
          const newNode = result[0].a;

          if (networkRef.current) {
            const nodeData = {
              id: newNode.elementId,
              label: newNode.properties.name,
              title: createNodeTooltip(newNode.properties),
              group: "application",
            };

            networkRef.current.body.data.nodes.add(nodeData);
            currentDataRef.current.nodes.set(newNode.elementId, nodeData);
          }

          const newApp = transformData(result);
          const newAppKey = newNode.elementId;

          setDataTransformed({
            ...dataTransformed,
            [newAppKey]: newApp[newNode.elementId],
          });

          toast.success("Application added successfully");
        } else {
          toast.success("Application edited successfully");
        }

        handleQueryResults;
        setIsApplicationDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFlow = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    try {
      const createFlowQuery = `
        MATCH (initiator:Application {application_id: $initiator_application})
        MATCH (target:Application {application_id: $target_application})

        CREATE (initiator)-[f:flow {
          flow_id: $flow_id,
          name: $name,
          description: $description,
          initiator_application: $initiator_application,
          target_application: $target_application,
          communication_mode: $communication_mode,
          intent: $intent,
          message_format: $message_format,
          data_flow: $data_flow,
          protocol: $protocol,
          frequency: $frequency,
          estimated_calls_per_day: $estimated_calls_per_day,
          average_execution_time_in_sec: $average_execution_time_in_sec,
          average_message_size_in_kb: $average_message_size_in_kb,
          api_gateway: $api_gateway,
          release_date: $release_date,
          notes: $notes,
          labels: $labels
        }]->(target)
        RETURN f
      `;

      const editFlowQuery = `
        MATCH (initiator:Application {application_id: $initiator_application})
        MATCH (target:Application {application_id: $target_application})
        MATCH (initiator)-[f:flow]->(target)

        SET
          f.name = $name,
          f.initiator_application = $initiator_application,
          f.target_application = $target_application,
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
          f.notes = $notes,
          f.labels = $labels
        RETURN f
        `;

      //console.log("Data submit ", data);
      const result = await executeQuery(
        Object.keys(flowData).length === 0 ? createFlowQuery : editFlowQuery,
        data
      );

      if (result && result.length > 0) {
        //console.log("Result ", result);

        if (Object.keys(flowData).length === 0) {
          const newNode = result[0].f;

          if (networkRef.current) {
            const edgeData = {
              id: newNode.elementId,
              from: newNode.startNodeElementId,
              to: newNode.endNodeElementId,
              label: newNode.properties.name || newNode.type,
              arrows: "to",
              title: createEdgeTooltip(newNode.properties),
            };

            networkRef.current.body.data.edges.add(edgeData);
            currentDataRef.current.edges.set(newNode.elementId, edgeData);
          }

          const newApp = transformData(result);
          const newAppKey = newNode.elementId;

          setDataTransformed({
            ...dataTransformed,
            [newAppKey]: newApp[newNode.elementId],
          });

          toast.success("Flow added successfully");
        } else {
          toast.success("Flow edited successfully");
        }

        handleQueryResults;
        setIsFlowDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteButton = async (data: any) => {
    if (!data) return;

    const {elementId, type} = data;

    setIsLoading(true);

    if (type == "flow") {
      try {
        const deleteFlowQuery = `MATCH ()-[r:flow]->() WHERE r.flow_id = "${data.flow_id}" DELETE r`;
        const result = await executeQuery(deleteFlowQuery, {});

        if (result) {
          toast.success("Flow deleted");

          if (networkRef.current) {
            networkRef.current.body.data.edges.remove(elementId);
          }
        }
      } catch (err) {
        toast.error("Error deleting the flow");
      }
    } else if(type == 'application'){
      try {
        const deleteAppQuery = `MATCH (n:Application { application_id: "${data.application_id}" }) DELETE n`;
        const result = await executeQuery(deleteAppQuery, {});

        if (result) {
          toast.success("Application deleted");

          if (networkRef.current) {
            networkRef.current.body.data.nodes.remove(elementId);
          }

        }
      } catch (err) {
        toast.error("Error deleting the application");
      }
    }

    setIsConfirmModalOpen({ show: false, data: {} });
    setIsLoading(false);

  };

  const togglePhysics = useCallback(() => {
    if (networkRef.current) {
      const newPhysicsState = !isPhysicsEnabled;
      setIsPhysicsEnabled(newPhysicsState);
      physicsStateRef.current = newPhysicsState;

      networkRef.current.setOptions({
        physics: {
          enabled: newPhysicsState,
        },
      });
    }
  }, [isPhysicsEnabled]);

  const expandNode = async (nodeId: string) => {
    if (!networkRef.current) return;

    setIsLoading(true);
    try {
      networkRef.current.setOptions({ physics: { enabled: false } });

      const sourceNodePosition = networkRef.current.getPosition(nodeId);

      const results = await executeQuery(
        `
        MATCH (source)-[r]-(target)
        WHERE elementId(source) = $nodeId
        AND (target:Application OR target:Flow)
        RETURN source as a, r as e, target as b
        UNION
        MATCH (source)-[r]-(target)
        WHERE elementId(target) = $nodeId
        AND (source:Application OR source:Flow)
        RETURN source as a, r as e, target as b
        `,
        { nodeId },
        new AbortController().signal
      );

      const newNodes = [];
      const newEdges = [];

      const radius = 200;
      const angleStep = (2 * Math.PI) / results.length;

      const newData = transformData(results);

      setDataTransformed((prev: any) => ({
        ...prev,
        ...newData,
      }));

      results.forEach((record, index) => {
        const nodeA = record.a;
        const nodeB = record.b;
        const relationship = record.e;

        [nodeA, nodeB].forEach((node) => {
          if (node && !currentDataRef.current.nodes.has(node.elementId)) {
            const angle = angleStep * index;
            const x = sourceNodePosition.x + radius * Math.cos(angle);
            const y = sourceNodePosition.y + radius * Math.sin(angle);

            const nodeData = {
              id: node.elementId,
              label:
                node.properties.name || node.properties.nickname || "Unnamed",
              title: createNodeTooltip(node.properties),
              group: node.labels[0].toLowerCase(),
              x: x,
              y: y,
            };
            currentDataRef.current.nodes.set(node.elementId, nodeData);
            newNodes.push(nodeData);
          }
        });

        if (
          relationship &&
          !currentDataRef.current.edges.has(relationship.elementId)
        ) {
          const edgeData = {
            id: relationship.elementId,
            from: relationship.startNodeElementId,
            to: relationship.endNodeElementId,
            label: relationship.properties.name || relationship.type,
            arrows: "to",
            title: createEdgeTooltip(relationship.properties),
          };
          currentDataRef.current.edges.set(relationship.elementId, edgeData);
          newEdges.push(edgeData);
        }
      });

      if (newNodes.length > 0) {
        networkRef.current.body.data.nodes.add(newNodes);
      }
      if (newEdges.length > 0) {
        networkRef.current.body.data.edges.add(newEdges);
      }

      if (newNodes.length > 0 || newEdges.length > 0) {
        setTimeout(() => {
          if (networkRef.current) {
            networkRef.current.setOptions({
              physics: {
                enabled: isPhysicsEnabled,
                stabilization: {
                  enabled: true,
                  iterations: 50,
                  updateInterval: 25,
                  onlyDynamicEdges: false,
                  fit: false,
                },
              },
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error expanding node:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNetwork = useCallback(() => {
    if (!containerRef.current || !graphData) return;

    try {
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      currentDataRef.current.nodes = new Map(
        graphData.nodes.map((node) => [node.id, node])
      );
      currentDataRef.current.edges = new Map(
        graphData.edges.map((edge) => [edge.id, edge])
      );

      networkRef.current = new Network(
        containerRef.current,
        graphData,
        options
      );

      networkRef.current.on("dragStart", () => {
        networkRef.current?.setOptions({ physics: { enabled: false } });
      });

      networkRef.current.on("dragEnd", () => {
        networkRef.current?.setOptions({
          physics: { enabled: physicsStateRef.current },
        });
      });

      networkRef.current.on("doubleClick", (params) => {
        if (params.nodes.length > 0) {
          expandNode(params.nodes[0]);
        }
      });

      //Visualizzare la modale di modifica
      networkRef.current.on("oncontext", (params) => {
        params.event.preventDefault();
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const nodeData = dataTransformedRef.current[nodeId];
          nodeData["elementId"] = nodeId;
          nodeData["type"] = 'application';
          const appData = {
            nodeData,
            hasRelationship: params.edges.length > 0 ? true : false,
          };
          setApplicationData(appData);
          setIsApplicationDialogOpen(true);
        }

        if (params.edges.length > 0 && params.nodes.length === 0) {
          const edgeId = params.edges[0];
          const edgeData = dataTransformedRef.current[edgeId];
          edgeData["elementId"] = edgeId;
          setFlowData(edgeData);
          //console.log('Clicked edge data:', edgeData);
          setIsFlowDialogOpen(true);
        }
      });

      networkRef.current.once("afterDrawing", () => {
        networkRef.current?.fit();
      });
    } catch (error) {
      console.error("Error initializing network:", error);
    }
  }, [graphData]);

  useEffect(() => {
    if (!isApplicationDialogOpen) {
      setApplicationData({});
    }
  }, [isApplicationDialogOpen]);

  useEffect(() => {
    if (!isFlowDialogOpen) {
      setFlowData({});
    }
  }, [isFlowDialogOpen]);

  useEffect(() => {
    const setup = async () => {
      setIsLoading(true);
      await initializeNetwork();
      setIsLoading(false);
    };
    setup();
  }, [initializeNetwork]);

  useEffect(() => {
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, []);

    useEffect(() => {
    dataTransformedRef.current = dataTransformed;
  }, [dataTransformed]);

  return (
    <div className="w-full h-full border rounded-lg bg-card flex flex-col">
      <div className="p-2 border-b flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsApplicationDialogOpen(true)}
              >
                <AppWindow className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add application</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFlowDialogOpen(true)}
              >
                <Line className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add flow</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPhysicsEnabled ? "default" : "outline"}
                size="icon"
                onClick={togglePhysics}
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPhysicsEnabled ? "Disable" : "Enable"} physics</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      <div className="mt-4 px-4 pb-4">
        <QueryInput onQueryResults={handleQueryResults} />
      </div>

      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>
              {Object.keys(applicationData).length === 0
                ? "Add new application"
                : "Edit application"}
            </DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new application and add it to the network
            graph.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <ApplicationForm
                onSubmit={handleApplicationSubmit}
                data={applicationData.nodeData}
              />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
            <div className="flex w-full justify-between items-center">
              {Object.keys(applicationData).length > 0 &&
              applicationData.hasRelationship == false ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsConfirmModalOpen({
                      show: true,
                      data: applicationData.nodeData,
                    });
                    setIsApplicationDialogOpen(false);
                  }}
                >
                  Delete application
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsApplicationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="application-form"
                  disabled={isLoading}
                >
                  Save application
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>
              {Object.keys(flowData).length === 0
                ? "Add new flow"
                : "Edit flow"}
            </DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new flow.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <FlowForm onSubmit={handleFlowSubmit} data={flowData} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
            <div className="flex w-full justify-between items-center">
              {Object.keys(flowData).length > 0 ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsConfirmModalOpen({
                      show: true,
                      data: flowData,
                    });
                    setIsFlowDialogOpen(false);
                  }}
                >
                  Delete flow
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsFlowDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" form="flow-form" disabled={isLoading}>
                  Save flow
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isConfirmModalOpen.show}
        onClose={() => setIsConfirmModalOpen({ show: false, data: {}})}
        onConfirm={() => handleDeleteButton(isConfirmModalOpen.data)}
        title={`Delete ${isConfirmModalOpen.data.type}`}
        description={`Are you sure you want to delete this ${isConfirmModalOpen.data.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
