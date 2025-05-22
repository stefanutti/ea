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
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { executeQuery } from "@/lib/neo4j";
import { FlowForm } from "./FlowForm";
import { ApplicationForm } from "./ApplicationForm";
import { AppWindow, Link, Lock } from "lucide-react";

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
  const [dragDropApplications, setDragDropApplications] = useState<any[]>([]);
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);
  const [isSVGCollapseOpen, setIsSVGCollapseOpen] = useState(false);
  const previousShapesRef = useRef<Record<string, any>>({});

  useEffect(() => {
    fetchApplications();
    fetchDrawings();
  }, []);

  const fetchApplications = async () => {
    try {
      const result: any[] = await executeQuery(
        "MATCH (a:Application) RETURN a ORDER BY a.name ASC",
        {},
        new AbortController().signal
      );
      const apps = result.map((r) => r.a);
      setApplications(apps);

      const transformedData = apps.map((item: any) => ({
        id: item.properties.application_id,
        name: item.properties.name,
        selected: false,
      }));
      setDragDropApplications(transformedData);
    } catch (err) {
      console.error("Errore nel recupero delle applicazioni:", err);
      toast.error("Errore nel caricamento delle applicazioni");
    }
  };

  const fetchDrawings = async () => {
    const { data, error } = await supabase.from("ea-drawings").select("*");
    if (error) {
      console.error("Errore nel recupero dei drawings:", error.message);
    } else {
      setDrawings(data);
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

      // Salva snapshot iniziale delle shape
      previousShapesRef.current = Object.fromEntries(
        editor.getCurrentPageShapes().map((s: any) => [s.id, s])
      );

      function onChange() {
        const currentShapes = Object.fromEntries(
          editor.getCurrentPageShapes().map((s: any) => [s.id, s])
        );

        // Trova shape che erano presenti prima ma ora non più
        const removedShapeIds = Object.keys(previousShapesRef.current).filter(
          (id) => !(id in currentShapes)
        );

        if (removedShapeIds.length > 0) {
          removedShapeIds.forEach((removedId) => {
            const cleanId = removedId.replace(/^shape:/, "");
            console.log("Shape deleted:", cleanId);
            handleRemoveShape(cleanId);
          });
        }

        // Aggiorna snapshot
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
    const selectedShape = editor.getOnlySelectedShape();
    const type = selectedShape?.type;
    const shapeMeta = selectedShape?.meta;

    if (type == "arrow") {
      setShowFlowContext(true);
    } else {
      setShowFlowContext(false);
    }
    return <></>;
  });

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
        //className="absolute bottom-3 right-2 z-[1000] flex flex-row items-center bg-none rounded-md"
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
            className="max-h-48 w-100 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
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

  const saveDrawing = async (obj: any) => {
    const editor = editorRef.current;
    if (!editor) return;
    const snapshot = editor.store.getSnapshot();
    const { filename, version, user_id } = obj;
    const { data, error } = await supabase
      .from("ea-drawings")
      .insert([{ user_id, filename, version, drawings: snapshot }])
      .select();

    if (error) {
      console.error("Errore Supabase:", error.message, error.details);
      throw error;
    }

    return data;
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

      const result = await executeQuery(createNodeQuery, data);

      if (result && result.length > 0) {
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

      const result = await executeQuery(createFlowQuery, data);

      if (result && result.length > 0) {
        toast.success("Flow added successfully");
        setIsFlowDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to save application: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  function customActions() {
    const handleUpdateDrawing = async () => {
      const editor = editorRef.current;
      if (!selected || !editor) return;

      try {
        const snapshot = editor.store.getSnapshot();
        const { version, id } = selected;
        const newVersion = version + 1;

        const { data, error } = await supabase
          .from("ea-drawings")
          .update({ drawings: snapshot, version: newVersion })
          .eq("id", id)
          .select();

        if (error) throw error;

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

                  const { x, y } = shape;
                  const { start, end } = shape.props;

                  // Recupera i due punti collegati
                  const allShapes = editor.getCurrentPageShapes();
                  const startX = x + start.x;
                  const startY = y + start.y;
                  const endX = x + end.x;
                  const endY = y + end.y;

                  const getClosestApplication = (xPos: number, yPos: number) =>
                    allShapes.find((s: any) => {
                      const isApp =
                        s.type === "geo" && s.meta?.type === "application";
                      if (!isApp) return false;
                      const sx = s.x;
                      const sy = s.y;
                      const sw = s.props.w;
                      const sh = s.props.h;
                      return (
                        xPos >= sx &&
                        xPos <= sx + sw &&
                        yPos >= sy &&
                        yPos <= sy + sh
                      );
                    });

                  const startApp = getClosestApplication(startX, startY);
                  const endApp = getClosestApplication(endX, endY);

                  if (!startApp || !endApp) {
                    toast.error("Error loading app data");
                    return;
                  }

                  setFlowFormData({
                    initiator_application: startApp.meta.data.id,
                    target_application: endApp.meta.data.id,
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

    //Da sostituire
    const svgs = [
      {
        id: 1,
        name: "Mail",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 -960 960 960"  fill="#1f1f1f"><path d="M172.31-180Q142-180 121-201q-21-21-21-51.31v-455.38Q100-738 121-759q21-21 51.31-21h615.38Q818-780 839-759q21 21 21 51.31v455.38Q860-222 839-201q-21 21-51.31 21H172.31ZM480-457.69 160-662.31v410q0 5.39 3.46 8.85t8.85 3.46h615.38q5.39 0 8.85-3.46t3.46-8.85v-410L480-457.69Zm0-62.31 313.85-200h-627.7L480-520ZM160-662.31V-720v467.69q0 5.39 3.46 8.85t8.85 3.46H160v-422.31Z"/></svg>',
      },
      {
        id: 2,
        name: "Database",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="M480-120q-151 0-255.5-46.5T120-280v-400q0-66 105.5-113T480-840q149 0 254.5 47T840-680v400q0 67-104.5 113.5T480-120Zm0-488q86 0 176.5-26.5T773-694q-27-32-117.5-59T480-780q-88 0-177 26t-117 60q28 35 116 60.5T480-608Zm-1 214q42 0 84-4.5t80.5-13.5q38.5-9 73.5-22t63-29v-155q-29 16-64 29t-74 22q-39 9-80 14t-83 5q-42 0-84-5t-80.5-14q-38.5-9-73-22T180-618v155q27 16 61 29t72.5 22q38.5 9 80.5 13.5t85 4.5Zm1 214q48 0 99-8.5t93.5-22.5q42.5-14 72-31t35.5-35v-125q-28 16-63 28.5T643.5-352q-38.5 9-80 13.5T479-334q-43 0-85-4.5T313.5-352q-38.5-9-72.5-21.5T180-402v126q5 17 34 34.5t72 31q43 13.5 94 22t100 8.5Z"/></svg>',
      },
      {
        id: 3,
        name: "User",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="M480-481q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42ZM160-160v-94q0-38 19-65t49-41q67-30 128.5-45T480-420q62 0 123 15.5t127.92 44.69q31.3 14.13 50.19 40.97Q800-292 800-254v94H160Zm60-60h520v-34q0-16-9.5-30.5T707-306q-64-31-117-42.5T480-360q-57 0-111 11.5T252-306q-14 7-23 21.5t-9 30.5v34Zm260-321q39 0 64.5-25.5T570-631q0-39-25.5-64.5T480-721q-39 0-64.5 25.5T390-631q0 39 25.5 64.5T480-541Zm0-90Zm0 411Z"/></svg>',
      },
      {
        id: 4,
        name: "Warning",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="m40-120 440-760 440 760H40Zm104-60h672L480-760 144-180Zm340.18-57q12.82 0 21.32-8.68 8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5ZM454-348h60v-224h-60v224Zm26-122Z"/></svg>',
      },
      {
        id: 5,
        name: "Phone",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="M260-40q-24.75 0-42.37-17.63Q200-75.25 200-100v-760q0-24 18-42t42-18h438q24.75 0 42.38 17.62Q758-884.75 758-860v150q18 3 30 16.95 12 13.96 12 31.63V-587q0 19-12 33t-30 17v437q0 24.75-17.62 42.37Q722.75-40 698-40H260Zm0-60h438v-760H260v760Zm0 0v-760 760Zm110-80h218q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H370q-12.75 0-21.37 8.68-8.63 8.67-8.63 21.5 0 12.82 8.63 21.32 8.62 8.5 21.37 8.5Z"/></svg>',
      },
      {
        id: 6,
        name: "Document",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="M319-250h322v-60H319v60Zm0-170h322v-60H319v60ZM220-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h361l219 219v521q0 24-18 42t-42 18H220Zm331-554v-186H220v680h520v-494H551ZM220-820v186-186 680-680Z"/></svg>',
      },
      {
        id: 7,
        name: "Cart",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#1f1f1f"><path d="M286.79-81Q257-81 236-102.21t-21-51Q215-183 236.21-204t51-21Q317-225 338-203.79t21 51Q359-123 337.79-102t-51 21Zm400 0Q657-81 636-102.21t-21-51Q615-183 636.21-204t51-21Q717-225 738-203.79t21 51Q759-123 737.79-102t-51 21ZM235-741l110 228h288l125-228H235Zm-30-60h589.07q22.97 0 34.95 21 11.98 21-.02 42L694-495q-11 19-28.56 30.5T627-453H324l-56 104h491v60H277q-42 0-60.5-28t.5-63l64-118-152-322H51v-60h117l37 79Zm140 288h288-288Z"/></svg>',
      },
    ];

    return (
      <div
        className="p-2 absolute flex flex-col gap-[8px]"
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
          type="images"
          title="Icons"
          items={svgs}
          isOpen={isSVGCollapseOpen}
          onToggle={(open: boolean) => setIsSVGCollapseOpen(open)}
        />
      </div>
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data || !editorRef.current) return;

    const item = JSON.parse(data);
    const editor = editorRef.current;

    const bounds = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const point = editor.screenToPage({ x, y });

    // SVG
    if (item.svg) {
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
          },

          meta: {},
        },
      ]);

      editor.createShape({
        id: `shape:${crypto.randomUUID()}`,
        type: "image",
        x: point.x,
        y: point.y,
        props: {
          assetId: assetId,
          w: 100,
          h: 100,
        },
      });

      return;
    }

    // Altrimenti crea una shape standard (applicazione)
    const existingShape = editor
      .getCurrentPageShapes()
      .find((shape: any) => shape.meta?.data?.id === item.id);

    if (existingShape) {
      return;
    }

    setDragDropApplications((prev) =>
      prev.map((app) =>
        app.id === item.id ? { ...app, selected: !app.selected } : app
      )
    );

    editor.createShape({
      id: `shape:${item.id}`,
      type: "geo",
      x: point.x,
      y: point.y,
      props: {
        geo: "rectangle",
        w: 250,
        h: 100,
        dash: "draw",
        fill: "none",
        color: "black",
        font: "sans",
        size: "m",
        text: item.name,
      },
      meta: {
        type: "application",
        data: item,
      },
    });
  }

  const components: TLComponents = {
    QuickActions: customActions,
    PageMenu: CustomPageMenu,
    ContextMenu: CustomContextMenu,
    InFrontOfTheCanvas: Collapsibles,
  };

  const sortedDrawings = [...drawings].sort((a, b) => {
    return a.filename.localeCompare(b.filename); // Ordina in ordine alfabetico
  });

  return (
    <>
      <div
        className="w-full h-full border rounded-lg bg-card overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Tldraw
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
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add new flow</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new flow.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <FlowForm onSubmit={handleFlowSubmit} data={flowFormData} />
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
              <Button type="submit" form="flow-form" disabled={isLoading}>
                Save flow
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
