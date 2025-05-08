"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

export function HelpPage() {
  return (
    <div className="w-full h-full border rounded-lg bg-card p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Help Center</h1>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="graph-view">
              <AccordionTrigger className="text-xl">Graph View</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <section>
                  <h3 className="font-semibold text-lg mb-2">Overview</h3>
                  <p className="text-muted-foreground">
                    The Graph View displays applications and their relationships in an interactive network diagram.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Features</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Double-click a node to expand and show connected applications</li>
                    <li>Drag nodes to rearrange the graph layout</li>
                    <li>Hover over nodes and edges to see detailed information</li>
                    <li>Use the mouse wheel to zoom in and out</li>
                  </ul>
                </section>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="applications">
              <AccordionTrigger className="text-xl">Applications</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <section>
                  <h3 className="font-semibold text-lg mb-2">Adding Applications</h3>
                  <p className="text-muted-foreground">
                    Click the application icon in the toolbar to add a new application. Fill in the required fields:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2 text-muted-foreground">
                    <li>Name (required)</li>
                    <li>Application type (required)</li>
                    <li>Complexity and criticality levels</li>
                    <li>Process categories (at least one required)</li>
                    <li>Access types (at least one required)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
                  <p className="text-muted-foreground">
                    Contact information should be provided as JSON arrays, for example:
                    <code className="block bg-muted p-2 rounded-md mt-2">
                      ["contact1@example.com", "contact2@example.com"]
                    </code>
                  </p>
                </section>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="flows">
              <AccordionTrigger className="text-xl">Business & Technical Flows</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <section>
                  <h3 className="font-semibold text-lg mb-2">Business Flows</h3>
                  <p className="text-muted-foreground">
                    Business flows represent high-level processes and are shown as diamond-shaped nodes in the graph.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Technical Flows</h3>
                  <p className="text-muted-foreground">
                    Technical flows represent system integrations and data flows, displayed as triangle-shaped nodes.
                  </p>
                </section>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="drawing">
              <AccordionTrigger className="text-xl">Drawing Tool</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">
                  The drawing tool allows you to create and annotate diagrams:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Create shapes, arrows, and text</li>
                  <li>Draw freehand illustrations</li>
                  <li>Export diagrams as images</li>
                  <li>Collaborate in real-time</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shortcuts">
              <AccordionTrigger className="text-xl">Keyboard Shortcuts</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold mb-2">Graph Navigation</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Zoom In</span>
                      <span className="font-mono">Scroll Up</span>
                      <span>Zoom Out</span>
                      <span className="font-mono">Scroll Down</span>
                      <span>Pan</span>
                      <span className="font-mono">Click + Drag</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold mb-2">Drawing Tools</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Undo</span>
                      <span className="font-mono">Ctrl/⌘ + Z</span>
                      <span>Redo</span>
                      <span className="font-mono">Ctrl/⌘ + Y</span>
                      <span>Delete</span>
                      <span className="font-mono">Delete/Backspace</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  );
}