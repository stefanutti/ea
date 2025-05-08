"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Network } from "vis-network";
import { executeQuery } from "@/lib/neo4j";
import { AppWindow, Flower as Flow, GitBranch, Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApplicationForm } from "./ApplicationForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { QueryInput } from "@/components/QueryInput";

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
      fit: true
    },
  },
  layout: { 
    improvedLayout: true 
  },
  groups: {
    application: {
      color: { background: "#74b9ff", border: "#0984e3" },
      shape: "box",
    },
    business_flow: {
      color: { background: "#55efc4", border: "#00b894" },
      shape: "diamond",
    },
    technical_flow: {
      color: { background: "#ffeaa7", border: "#fdcb6e" },
      shape: "triangle",
    },
  },
};

function createNodeTooltip(properties: Record<string, any>): string {
  const excludedFields = ['elementId', 'labels'];
  const fields = Object.entries(properties)
    .filter(([key]) => !excludedFields.includes(key) && properties[key] !== null && properties[key] !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `<strong>${formatKey(key)}</strong>: ${value.join(', ')}`;
      }
      return `<strong>${formatKey(key)}</strong>: ${value}`;
    });

  return `<div style="max-width: 300px; padding: 8px;">
    ${fields.join('<br>')}
  </div>`;
}

function createEdgeTooltip(properties: Record<string, any>): string {
  if (!properties || Object.keys(properties).length === 0) {
    return '';
  }

  const fields = Object.entries(properties)
    .filter(([_, value]) => value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `<strong>${formatKey(key)}</strong>: ${value.join(', ')}`;
      }
      return `<strong>${formatKey(key)}</strong>: ${value}`;
    });

  return `<div style="max-width: 300px; padding: 8px;">
    ${fields.join('<br>')}
  </div>`;
}

function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const physicsStateRef = useRef(isPhysicsEnabled);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; } | null>(null);

  const handleQueryResults = useCallback((results: any[]) => {
    const nodes = new Map();
    const edges = [];

    results.forEach(record => {
      const nodeA = record.a;
      const nodeB = record.b;
      const relationship = record.e;

      if (nodeA && !nodes.has(nodeA.elementId)) {
        const label = nodeA.properties.name || nodeA.properties.nickname || 'Unnamed';
        nodes.set(nodeA.elementId, {
          id: nodeA.elementId,
          label: label,
          title: createNodeTooltip(nodeA.properties),
          group: nodeA.labels[0].toLowerCase(),
        });
      }

      if (nodeB && !nodes.has(nodeB.elementId)) {
        const label = nodeB.properties.name || nodeB.properties.nickname || 'Unnamed';
        nodes.set(nodeB.elementId, {
          id: nodeB.elementId,
          label: label,
          title: createNodeTooltip(nodeB.properties),
          group: nodeB.labels[0].toLowerCase(),
        });
      }

      if (relationship && relationship.startNodeElementId && relationship.endNodeElementId) {
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
        internal_application_specialists: data.internal_application_specialists ? JSON.stringify(data.internal_application_specialists.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        business_partner_business_contacts: data.business_partner_business_contacts ? JSON.stringify(data.business_partner_business_contacts.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        business_contacts: data.business_contacts ? JSON.stringify(data.business_contacts.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        internal_developers: data.internal_developers ? JSON.stringify(data.internal_developers.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        ams_contacts_email: data.ams_contacts_email ? JSON.stringify(data.ams_contacts_email.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        ams_contact_phone: data.ams_contact_phone ? JSON.stringify(data.ams_contact_phone.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        smes_factory: data.smes_factory ? JSON.stringify(data.smes_factory.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        notes: data.notes ? JSON.stringify(data.notes.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        ams_expire_date: data.ams_expire_date || null,
        ams_supplier: data.ams_supplier || "",
        ams_portal: data.ams_portal || "",
        link_to_documentation: data.link_to_documentation || "",
        ams_type: data.ams_type || "",
        decommission_date: data.decommission_date || null
      };

      await handleSaveApplication(transformedData);
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
          id: $id,
          name: $name,
          description: $description,
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
          ams_expire_date: $ams_expire_date,
          ams_contacts_email: $ams_contacts_email,
          ams_contact_phone: $ams_contact_phone,
          ams_supplier: $ams_supplier,
          smes_factory: $smes_factory,
          ams_portal: $ams_portal,
          organization_family: $organization_family,
          link_to_documentation: $link_to_documentation,
          scope: $scope,
          ams_service: $ams_service,
          ams_type: $ams_type,
          decommission_date: $decommission_date,
          to_be_decommissioned: $to_be_decommissioned,
          notes: $notes
        })
        RETURN a
      `;

      const result = await executeQuery(createNodeQuery, data);
      
      if (result && result.length > 0) {
        const newNode = result[0].a;
        
        if (networkRef.current) {
          const nodeData = {
            id: newNode.elementId,
            label: newNode.properties.name,
            title: createNodeTooltip(newNode.properties),
            group: 'application'
          };
          
          networkRef.current.body.data.nodes.add(nodeData);
          currentDataRef.current.nodes.set(newNode.elementId, nodeData);
        }

        toast.success("Application added successfully");
        setIsApplicationDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhysics = useCallback(() => {
    if (networkRef.current) {
      const newPhysicsState = !isPhysicsEnabled;
      setIsPhysicsEnabled(newPhysicsState);
      physicsStateRef.current = newPhysicsState;
      
      networkRef.current.setOptions({ 
        physics: { 
          enabled: newPhysicsState 
        }
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
        AND (target:Application OR target:BUSINESS_FLOW)
        RETURN source as a, r as e, target as b
        UNION
        MATCH (source)-[r]-(target)
        WHERE elementId(target) = $nodeId
        AND (source:Application OR source:BUSINESS_FLOW)
        RETURN source as a, r as e, target as b
        `,
        { nodeId },
        new AbortController().signal
      );

      const newNodes = [];
      const newEdges = [];

      const radius = 200;
      const angleStep = (2 * Math.PI) / results.length;

      results.forEach((record, index) => {
        const nodeA = record.a;
        const nodeB = record.b;
        const relationship = record.e;

        [nodeA, nodeB].forEach(node => {
          if (node && !currentDataRef.current.nodes.has(node.elementId)) {
            const angle = angleStep * index;
            const x = sourceNodePosition.x + radius * Math.cos(angle);
            const y = sourceNodePosition.y + radius * Math.sin(angle);

            const nodeData = {
              id: node.elementId,
              label: node.properties.name || node.properties.nickname || 'Unnamed',
              title: createNodeTooltip(node.properties),
              group: node.labels[0].toLowerCase(),
              x: x,
              y: y,
            };
            currentDataRef.current.nodes.set(node.elementId, nodeData);
            newNodes.push(nodeData);
          }
        });

        if (relationship && !currentDataRef.current.edges.has(relationship.elementId)) {
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
                  fit: false
                }
              }
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
        graphData.nodes.map(node => [node.id, node])
      );
      currentDataRef.current.edges = new Map(
        graphData.edges.map(edge => [edge.id, edge])
      );

      networkRef.current = new Network(containerRef.current, graphData, options);

      networkRef.current.on("dragStart", () => {
        networkRef.current?.setOptions({ physics: { enabled: false } });
      });

      networkRef.current.on("dragEnd", () => {
        networkRef.current?.setOptions({ physics: { enabled: physicsStateRef.current } });
      });

      networkRef.current.on("doubleClick", (params) => {
        if (params.nodes.length > 0) {
          expandNode(params.nodes[0]);
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
    const setup = async () => {
      setIsLoading(true);
      await initializeNetwork(); // anche se non è async, meglio essere pronti
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
              <Button variant="outline" size="icon">
                <Flow className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add business flow</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <GitBranch className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add technical flow</p>
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

      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Add new application</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new application and add it to the network graph.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <ApplicationForm onSubmit={handleApplicationSubmit} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsApplicationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="application-form"
              disabled={isLoading}
            >
              Save application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}