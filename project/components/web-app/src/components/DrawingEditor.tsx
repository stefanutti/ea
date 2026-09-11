import {
  DefaultContextMenu,
  DefaultContextMenuContent,
  DefaultPageMenu,
  DefaultQuickActions,
  DefaultQuickActionsContent,
  TLComponents,
  TLUiContextMenuProps,
  TLUiStylePanelProps,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  loadSnapshot,
  track,
  useEditor,
  getArrowBindings,
  Editor, // Importa Editor direttamente da tldraw
} from "tldraw";
import "tldraw/tldraw.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SaveDrawingForm } from "./SaveDrawingForm";
import { DrawingCollapsible } from "./Collapsible";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { FlowForm } from "./FlowForm";
import { ApplicationForm } from "./ApplicationForm";
import { AppWindow, Link } from "lucide-react";
import { icons } from "@/assets/icons";
import { ApplicationShapeUtil } from "./custom_shapes/ApplicationShape";
import { getNodesRelationships } from "@/lib/neo4jUtils";
import { getIconsForApplication } from "@/lib/utils";
interface Application {
  id: string;
  name: string;
}

interface DragDropItem extends Application {
  selected: boolean;
  type: "shape" | "label" | "image";
  icons: string[];
}

export function DrawingEditor() {
  const [selected, setSelected] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [showFlowContext, setShowFlowContext] = useState(false);
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [flowFormData, setFlowFormData] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [dragDropApplications, setDragDropApplications] = useState<DragDropItem[]>([]);
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);
  const [isSVGCollapseOpen, setIsSVGCollapseOpen] = useState(false);
  const [flowLabels, setFlowLabels] = useState<DragDropItem[]>([]);
  const [isLabelsCollapseOpen, setIsLabelsCollapseOpen] = useState(false);
  const previousShapesRef = useRef<Record<string, any>>({});
  const [selectedShapes, setSelectedShapes] = useState<Boolean>(false);
  const [selectedArrowId, setselectedArrowId] = useState<any>();

  useEffect(() => {
    fetchApplications();
    fetchDrawings();
    fetchFlowLabels();
  }, []);

  useEffect(() => {
    if (!isFlowDialogOpen) setFlowFormData({});
  }, [isFlowDialogOpen]);

  const applicationIconsMapRef = useRef<Record<string, any[]>>({});

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/neo4j/applications');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      if (result && result.length > 0) {
        const iconsMap: Record<string, any[]> = {};
        const apps = result.map((r: any) => r.a);
        setApplications(apps);
        const transformedData: DragDropItem[] = apps.map((item: any) => {          
        const icons = getIconsForApplication(item); // calcola le icone dai dati completi
        applicationIconsMapRef.current[item.properties.application_id] = icons; // ← popolo la ref
        return {
          id: item.properties.application_id,
          name: item.properties.name,
          selected: false,
          type: "shape",
          icons: icons,  // <- qui le aggiungi
        };
      });
        setDragDropApplications(transformedData);
      } else {
        toast.error("Failed to load applications");
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to load applications");
    }
  };

  const fetchFlowLabels = async () => {
    try {
      const response = await fetch('/api/neo4j/flows?action=labels');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      if (result && result.length > 0) {
        const transformedDataLabels: DragDropItem[] = result.map((item: string) => ({
          id: item,
          name: item,
          selected: false,
          type: "label",
        }));
        setFlowLabels(transformedDataLabels);
      } else {
        toast.error("Failed to load flow labels");
        setFlowLabels([]);
      }
    } catch (error) {
      console.error('Error fetching flow labels:', error);
      toast.error("Failed to load flow labels");
      setFlowLabels([]);
    }
  };

  const fetchDrawings = async () => {
    try {
      const response = await fetch('/api/drawings');
      if (!response.ok) {
        throw new Error('Failed to fetch drawings');
      }
      const data = await response.json();
      setDrawings(data);
    } catch (error: any) {
      console.error("Errore nel recupero dei drawings:", error.message);
      toast.error("Failed to load drawings");
    }
  };

  function handleRemoveShape(id: string | number) {
    setDragDropApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, selected: false } : app))
    );
  }

  const ShapeRemoval = () => {
    const editor = useEditor();

    useEffect(() => {
      if (!editor) return;

      previousShapesRef.current = Object.fromEntries(
        editor.getCurrentPageShapes().map((s: any) => [s.id, s])
      );

      function onChange() {
        const currentShapes = Object.fromEntries(
          editor.getCurrentPageShapes().map((s: any) => [s.id, s])
        );

        const removedShapeIds = Object.keys(previousShapesRef.current).filter(
          (id) => !(id in currentShapes)
        );

        if (removedShapeIds.length > 0) {
          removedShapeIds.forEach((removedId) => {
            const cleanId = removedId.replace(/^shape:/, "");
            handleRemoveShape(cleanId);
          });
        }

        previousShapesRef.current = currentShapes;
      }

      editor.on("change", onChange);

      return () => {
        editor.off("change", onChange);
      };
    }, [editor]);

    return null;
  };

  const ShapeListener = track(function MetaUiHelper() {
    const editor = useEditor();

    useEffect(() => {
      const onlySelected = editor.getOnlySelectedShape();
      const selectedShapes = editor.getSelectedShapes();

      const isApplicationPair =
        selectedShapes.length === 2 &&
        selectedShapes.every((shape) => shape.type === "application");

      setSelectedShapes(isApplicationPair);

      if (onlySelected?.type === "arrow") {
        setselectedArrowId(onlySelected.id);
        setShowFlowContext(true);
      } else {
        setShowFlowContext(false);
      }
    }, [editor, editor.getSelectedShapeIds().join()]);

    return null;
  });

  /* ------------------Utility------------------*/
  const saveDrawing = async (obj: any) => {
    const editor = editorRef.current;
    if (!editor) return;
    const snapshot = editor.store.getSnapshot();
    const { filename, version, user_id } = obj;
    
    try {
      const response = await fetch('/api/drawings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: filename,
          content: snapshot,
          user_id: user_id || 'default',
          version: version || 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save drawing');
      }
      
      const data = await response.json();
      return [data];
    } catch (error: any) {
      console.error("Errore Prisma:", error.message);
      throw error;
    }
  };

  const handleSubmit = (data: any) => {
    saveDrawing(data)
      .then((resp: any) => {
        fetchDrawings().then(() => {
          const newDrawing = resp[0];
          setSelected(newDrawing);
        });
        setIsDialogOpen(false);
        toast.success("Drawing saved correctly");
      })
      .catch(() => {
        toast.error("Error in saving the drawing");
      });
  };

  const handleApplicationSubmit = async (data: any) => {
    try {
      const transformedData = {
        ...data,
        ams_contacts_phone: data.ams_contacts_phone || "",
        ams_expire_date: data.ams_expire_date || null,
        ams_supplier: data.ams_supplier || "",
        ams_portal: data.ams_portal || "",
        links_to_documentation: data.links_to_documentation || "",
        ams_type: data.ams_type || "",
        decommission_date: data.decommission_date || null,
        notes: data.notes || "",
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
        release_date: data.release_date || null,
      };

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
      const response = await fetch('/api/neo4j/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      const result = await response.json();
      
      if (result && result.length > 0) {
        toast.success("Application added successfully");
        setIsApplicationDialogOpen(false);
        await fetchApplications();
      } else {
        toast.error("Failed to save application");
      }
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error("Failed to save application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFlow = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/neo4j/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      const result = await response.json();
      
      if (result && result.length > 0) {
        toast.success("Flow added successfully");
        setIsFlowDialogOpen(false);
      } else {
        toast.error("Failed to save flow");
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error("Failed to save flow");
    } finally {
      setIsLoading(false);
    }
  };

  function getRelationships(idShapeA: string, nodeA: string, idShapeB:string, nodeB: string) {
    const editor = editorRef.current;
    if (!editor) return;

    //const shapeAId = idShapeA; //`shape:${nodeA}`;
    //const shapeBId = idShapeB; //`shape:${nodeB}`;

    const shapeA = editor.getShape(idShapeA);
    const shapeB = editor.getShape(idShapeB);
    const objShapes: Record<string, string> = {};

    if (!shapeA || !shapeB) {
      toast.error("Shapes not found on canvas");
      return;
    }
    
    objShapes[nodeA] = idShapeA;
    objShapes[nodeB] = idShapeB;

    getNodesRelationships({ idA: nodeA, idB: nodeB }).then((result) => {
      if (!result || result.length === 0) {
        toast.error("There are no relationships between the two applications");
        return;
      }

      const forward = result.filter(
        (r: any) =>
          r.r.properties.initiator_application === nodeA &&
          r.r.properties.target_application === nodeB
      );

      const backward = result.filter(
        (r: any) =>
          r.r.properties.initiator_application === nodeB &&
          r.r.properties.target_application === nodeA
      );

      const drawArrow = (
        rel: any,
        index: number,
        total: number,
        isForward: boolean
      ) => {
        const flowId = rel.r.properties.flow_id;
        const flowIdUnique = "shape:" + flowId + `${crypto.randomUUID()}`;
        const name = rel.r.properties.name ?? "Connection";
        const from = rel.r.properties.initiator_application;
        const to = rel.r.properties.target_application;

        const fromShapeId = objShapes[from]; //`shape:${from}`;
        const toShapeId = objShapes[to]; //`shape:${to}`;
        const fromShape = editor.getShape(fromShapeId);
        
        //console.log("from ", objShapes[from])
        //console.log("to ", objShapes[to])

        // Evita di creare shape o binding se esistono già
        //if (!editor.getShape(`shape:${flowId}`)) {

          editor.createShape({
            id: flowIdUnique,
            type: "arrow",
            props: {
              text: name,
              arrowheadEnd: "arrow",
              icons: fromShape?.props?.icons ?? [],
              bend: (index - (total - 1) / 2) * 80 * (isForward ? 1 : -1),
              start: { x: 0, y: 0 }, // Questi verranno poi overridati dai binding
              end: { x: 0, y: 0 },   // Questi verranno poi overridati dai binding
            },           
          });
          editor.createBinding({
            type: "arrow",
            fromId: flowIdUnique,
            toId: fromShapeId,
            props: { terminal: "start" },
          });

          editor.createBinding({
            type: "arrow",
            fromId: flowIdUnique,
            toId: toShapeId,
            props: { terminal: "end" },
          });
          
        //}
      };

      forward.forEach((rel: any, i: number) =>
        drawArrow(rel, i, forward.length, true)
      );
      backward.forEach((rel: any, i: number) =>
        drawArrow(rel, i, backward.length, false)
      );
    });
  }

  /* ---------------Custom TLDR--------------------- */
  function customActions() {
    const handleUpdateDrawing = async () => {
      const editor = editorRef.current;
      if (!selected || !editor) return;

      try {
        const snapshot = editor.store.getSnapshot();
        const { version, id, filename } = selected;
        const newVersion = version + 1;

        const response = await fetch(`/api/drawings/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: filename || selected.name,
            content: snapshot,
            version: newVersion,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update drawing');
        }
        
        const data = await response.json();

        setSelected((prev: any) => ({
          ...prev,
          version: newVersion,
          drawings: snapshot,
        }));

        toast.success("Drawing updated");
        fetchDrawings();
      } catch (err) {
        console.error("Errore aggiornamento:", err);
        toast.error("Error editing drawing");
      }
    };

    return (
      <DefaultQuickActions>
        <DefaultQuickActionsContent />
        <div className="tlui-buttons__horizontal">
          <button
            type="button"
            onClick={handleUpdateDrawing}
            disabled={!selected}
            className="tlui-menu__item tlui-button tlui-button__menu tlui-button__default"
            title="Edit drawing"
          >
            <div
              className={"tlui-button__icon" + (!selected ? " opacity-50" : "")}
            >
              <img src="/svg/edit_icon.svg" alt="Edit" className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="Save drawing"
          >
            <div className="tlui-button__icon">
              <img src="/svg/save_icon.svg" alt="Save" className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsApplicationDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="New Application"
          >
            <div className="tlui-button__icon">
              <AppWindow className="h-4 w-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsFlowDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="New Flow"
          >
            <div className="tlui-button__icon">
              <Link className="h-4 w-4" />
            </div>
          </button>
        </div>
      </DefaultQuickActions>
    );
  }

  function CustomPageMenu() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <SelectDrawing />
        <DefaultPageMenu />
      </div>
    );
  }

  function CustomContextMenu(props: TLUiContextMenuProps) {
    return (
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="flowContext">
          <div>
            {selectedShapes && (
              <TldrawUiMenuItem
                id="show_connections"
                label="Show connections"
                onSelect={() => {
                  const editor = editorRef.current;
                  if (!editor) return;

                  const shapes = editor.getSelectedShapes();
                  if (shapes.length < 2) return;

                  const [shape1, shape2] = shapes;
                  getRelationships(
                    shape1.id,
                    shape1.meta.data.id.replace(/^shape:/, ""),
                    shape2.id,
                    shape2.meta.data.id.replace(/^shape:/, "")
                  );
                }}
              />
            )}
            {showFlowContext && (
              <TldrawUiMenuItem
                id="flow"
                label="Flusso EA"
                readonlyOk
                onSelect={() => {
                  const editor = editorRef.current;
                  if (!editor) return;

                  const shape = editor.getOnlySelectedShape();
                  if (!shape || shape.type !== "arrow") return;

                  const bindings = getArrowBindings(editor, shape);
                  const startId = bindings.start?.toId;
                  const endId = bindings.end?.toId;

                  if (!startId || !endId) {
                    toast.error("Error loading application data.");
                    return;
                  }

                  const allShapes = editor.getCurrentPageShapes();
                  const startApp = allShapes.find((s: any) => s.id === startId);
                  const endApp = allShapes.find((s: any) => s.id === endId);

                  if (!startApp || !endApp) {
                    toast.error("Error loading application data.");
                    return;
                  }

                  setFlowFormData({
                    initiator_application: startApp.meta?.data?.id,
                    target_application: endApp.meta?.data?.id,
                  });

                  setIsFlowDialogOpen(true);
                }}
              />
            )}
          </div>
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
    );
  }

  function Collapsibles(props: TLUiStylePanelProps) {
    return (
      <div
        className="p-2 absolute flex flex-col gap-[8px] z-[50]"
        style={{ pointerEvents: "auto", top: "50px" }}
      >
        <DrawingCollapsible
          type="text"
          title="Applications"
          items={dragDropApplications}
          isOpen={isCollapseOpen}
          onToggle={(open: boolean) => setIsCollapseOpen(open)}
        />

        <DrawingCollapsible
          type="text"
          title="Labels"
          items={flowLabels}
          isOpen={isLabelsCollapseOpen}
          onToggle={(open: boolean) => setIsLabelsCollapseOpen(open)}
        />

        <DrawingCollapsible
          type="images"
          title="Icons"
          items={Object.values(icons)}
          isOpen={isSVGCollapseOpen}
          onToggle={(open: boolean) => setIsSVGCollapseOpen(open)}
          footer={(search) => (
            <div className="space-y-2">
              <a
                href={`https://fonts.google.com/icons?icon.query=${encodeURIComponent(
                  search
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline text-sm"
              >
                Search on Google Icons
              </a>
              <a
                href={`https://www.svgrepo.com/vectors/${encodeURIComponent(
                  search
                )}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline text-sm"
              >
                Search on SVG Repo
              </a>
            </div>
          )}
        />
      </div>
    );
  }

  function SelectDrawing() {
    const handleSelectChange = async (id: string) => {
      const drawing = drawings.find((d) => String(d.id) === id);
      if (!drawing) return;

      try {
        const snapshot = drawing.drawings;
        const editor = editorRef.current;

        if (editor && snapshot) {
          loadSnapshot(editor.store, snapshot);
          requestAnimationFrame(() => {
            editor.setCamera({ x: 0, y: 0, z: 1 });
            editor.zoomToFit();
          });
          toast.success("Drawing loaded");
        }

        setSelected(drawing);
      } catch (err) {
        console.error("Errore nel caricamento:", err);
        toast.error("Error loading drawing");
      }
    };

    return (
      <div
        style={{ pointerEvents: "auto" }}
      >
        <Select
          onValueChange={handleSelectChange}
          value={selected ? String(selected.id) : undefined}
        >
          <SelectTrigger
            aria-label="Select Drawing"
            className="
          flex items-center justify-between
          h-8
          px-2
          ml-2
          rounded-md
          bg-transparent
          text-sm font-sm
          text-gray-700
          hover:bg-gray-200
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500
          border border-transparent
          cursor-pointer
          min-w-[180px]
        "
          >
            <SelectValue placeholder="New Drawing" />
          </SelectTrigger>

          <SelectContent
            side="bottom"
            align="start"
            className="max-h-48 w-100 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg z-[1000]"
          >
            {sortedDrawings.map((drawing) => (
              <SelectItem
                key={drawing.id}
                value={String(drawing.id)}
                className="text-sm"
              >
                {drawing.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  /*------------------------------*/

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (!data || !editorRef.current) return;

      const item = JSON.parse(data);
      const editor = editorRef.current;

      const bounds = (e.target as HTMLElement).getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const dropPoint = editor.screenToPage({ x: clientX, y: clientY });

      // SVG Icons
      if (item.type === "image") {
        const assetId = `asset:${crypto.randomUUID()}`;
        const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(item.svg)}`;
        editor.store.put([
          {
            id: assetId,
            typeName: "asset",
            type: "image",
            props: {
              src: svgDataUrl,
              mimeType: "image/svg+xml",
              w: 100,
              h: 100,
              name: `svg-${assetId}`,
              isAnimated: false,
              icons: item.icons,
            },
            meta: {},
          },
        ]);
        editor.createShape({
          id: `shape:${crypto.randomUUID()}`,
          type: "image",
          x: dropPoint.x,
          y: dropPoint.y,
          props: {
            assetId: assetId,
            w: 100,
            h: 100,
          },
        });
        return;
      }
      // Handle Label Drop
      else if (item.type === "label") {
        const label = item.name;
        const loadingToastId = toast.loading(`Loading graph for "${label}"...`);

        try {
          const response = await fetch(`/api/neo4j/flows?action=graph&label=${encodeURIComponent(label)}`);
          if (!response.ok) throw new Error('Failed to fetch graph');
          const neo4jResult = await response.json();

          if (neo4jResult && neo4jResult.length > 0) {
            const newShapesToCreate: any[] = [];
            const newBindingsToCreate: any[] = [];
            const existingShapeIds = new Set(
              editor.getCurrentPageShapes().map((s: any) => s.id)
            );

            let nodeCount = 0;
            const nodeSpacing = 800; // Spazio tra i nodi
            const nodesPerRow = 3;   // Nodi per riga

            const processedNodes = new Set<string>();

            neo4jResult.forEach((record: any) => {
                const startNode = record.a;
                const relationship = record.e;
                const endNode = record.b;

                if (!startNode || !relationship || !endNode) {
                    console.warn("Record incompleto ricevuto da Neo4j:", record);
                    return;
                }

                const startAppId = startNode.properties.application_id;
                const startShapeId = `shape:${startAppId}`;
                if (!existingShapeIds.has(startShapeId) && !processedNodes.has(startAppId)) {
                    const row = Math.floor(nodeCount / nodesPerRow);
                    const col = nodeCount % nodesPerRow;

                    newShapesToCreate.push({
                        id: startShapeId,
                        type: "application",
                        x: dropPoint.x + col * nodeSpacing,
                        y: dropPoint.y + row * nodeSpacing,
                        props: {
                            w: 250,
                            h: 100,
                            name: startNode.properties.name,
                        },
                        meta: {
                            type: "application",
                            data: {
                                id: startAppId,
                                name: startNode.properties.name,
                            },
                        },
                    });
                    processedNodes.add(startAppId);
                    nodeCount++;
                }

                const endAppId = endNode.properties.application_id;
                const endShapeId = `shape:${endAppId}`;
                if (!existingShapeIds.has(endShapeId) && !processedNodes.has(endAppId)) {
                    const row = Math.floor(nodeCount / nodesPerRow);
                    const col = nodeCount % nodesPerRow;

                    newShapesToCreate.push({
                        id: endShapeId,
                        type: "application",
                        x: dropPoint.x + col * nodeSpacing,
                        y: dropPoint.y + row * nodeSpacing,
                        props: {
                            w: 250,
                            h: 100,
                            name: endNode.properties.name,
                        },
                        meta: {
                            type: "application",
                            data: {
                                id: endAppId,
                                name: endNode.properties.name,
                            },
                        },
                    });
                    processedNodes.add(endAppId);
                    nodeCount++;
                }

                const flowId = relationship.properties.flow_id;
                const arrowShapeId = `shape:${flowId}`;

                if (!existingShapeIds.has(arrowShapeId)) {
                    newShapesToCreate.push({
                        id: arrowShapeId,
                        type: "arrow",
                        props: {
                            text: relationship.properties.name || relationship.type,
                            arrowheadEnd: "arrow",
                            start: { x: 0, y: 0 },
                            end: { x: 0, y: 0 },
                        },
                    });

                    newBindingsToCreate.push({
                        type: "arrow",
                        fromId: arrowShapeId,
                        toId: startShapeId,
                        props: { terminal: "start" },
                    });

                    newBindingsToCreate.push({
                        type: "arrow",
                        fromId: arrowShapeId,
                        toId: endShapeId,
                        props: { terminal: "end" },
                    });
                    existingShapeIds.add(arrowShapeId);
                }
            });

            if (newShapesToCreate.length > 0) {
                editor.createShapes(newShapesToCreate);
            }
            if (newBindingsToCreate.length > 0) {
                editor.createBindings(newBindingsToCreate);
            }

            toast.success(`Graphs for "${label}" successfully loaded`, {
            id: loadingToastId});
            editor.zoomToFit();
          } else {
            toast.info(`No nodes or flows found for the label "${label}".`, {
            id: loadingToastId});
          }
        } catch (error) {
          console.error("Error loading the graph:", error);
          toast.error("Error loading the graph", {
            id: loadingToastId});
        }
      }
      else if (item.type === "shape") {
        /* Rimossa logica per cui non si possano avere 2 applicazioni uguali sul canvas
        const existingShape = editor
          .getCurrentPageShapes()
          .find((shape: any) => shape.meta?.data?.id === item.id);

        if (existingShape) {
          toast.info("This application is already on the canvas.");
          return;
        }*/
        const icons = applicationIconsMapRef.current[item.id] || [];
        setDragDropApplications((prev) =>
          prev.map((app) =>
            app.id === item.id ? { ...app, selected: false /*!app.selected*/ } : app
          )
        );
        editor.createShape({
          id: `shape:${item.id}@${crypto.randomUUID()}`,
          type: "application",
          x: dropPoint.x,
          y: dropPoint.y,
          props: {
            w: 250,
            h: 100,
            name: item.name,
            icons: icons,
          },
          meta: {
            type: "application",
            data: item,
          },
        });
      } else {
        console.warn("Tipo di elemento droppato non riconosciuto:", item.type);
      }
    },
    [setDragDropApplications]
  );

  const components: TLComponents = {
    QuickActions: customActions,
    PageMenu: CustomPageMenu,
    ContextMenu: CustomContextMenu,
    DebugMenu: Collapsibles,
  };

  const sortedDrawings = [...drawings].sort((a, b) => {
    return a.filename.localeCompare(b.filename);
  });

  return (
    <>
      <div
        className="w-full h-full border rounded-lg bg-card overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Tldraw
          shapeUtils={[ApplicationShapeUtil]}
          components={components}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        >
          <ShapeListener />
          <ShapeRemoval />
        </Tldraw>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="z-[400] sm:max-w-[800px] h-auto flex flex-col"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Save drawing</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Save drawing
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <SaveDrawingForm onSubmit={handleSubmit} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="save-drawing-form">
              Save drawing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add new application</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new application and add it to the network
            graph.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <ApplicationForm onSubmit={handleApplicationSubmit} data={{}} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="flow-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add new flow</DialogTitle>
          </DialogHeader>
          <p id="flow-dialog-description" className="sr-only">
            Use this form to create a new flow between two applications.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <FlowForm
                onSubmit={handleFlowSubmit}
                data={flowFormData}
                //applications={applications}
              />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFlowDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="flow-form"
                disabled={isLoading}
              >
                Save flow
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}