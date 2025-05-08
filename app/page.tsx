"use client";

import { VerticalMenu } from "@/components/VerticalMenu";
import { NetworkGraph } from "@/components/NetworkGraph";
import { DrawingEditor } from "@/components/DrawingEditor";
import { HelpPage } from "@/components/HelpPage";
import { TablesPage } from "@/components/TablesPage";
import { useState } from "react";

export default function Home() {
  const [activeView, setActiveView] = useState("graph");

  return (
    <div className="flex h-screen bg-background">
      <VerticalMenu activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <div className={`absolute inset-0 ${activeView === "graph" ? "block" : "hidden"}`}>
            <NetworkGraph />
          </div>
          <div className={`absolute inset-0 ${activeView === "draw" ? "block" : "hidden"}`}>
            <DrawingEditor />
          </div>
          <div className={`absolute inset-0 ${activeView === "science" ? "block" : "hidden"}`}>
            {/* Science view content */}
          </div>
          <div className={`absolute inset-0 ${activeView === "table" ? "block" : "hidden"}`}>
            <TablesPage />
          </div>
          <div className={`absolute inset-0 ${activeView === "help" ? "block" : "hidden"}`}>
            <HelpPage />
          </div>
        </div>
      </main>
    </div>
  );
}