"use client";

import { Table2, PenLine, Network, HelpCircle, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalMenuProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function VerticalMenu({ activeView, onViewChange }: VerticalMenuProps) {
  const topMenuItems = [
    { icon: Network, label: "Graph", id: "graph" },
    { icon: Table2, label: "Table", id: "table" },
    { icon: PenLine, label: "Draw", id: "draw" },
  ];

  const bottomMenuItems = [
    { icon: HelpCircle, label: "Help", id: "help", onClick: () => onViewChange("help") },
    { icon: UserCircle, label: "Profile", id: "profile" },
  ];

  return (
    <nav className="w-12 bg-card border-r border-border flex flex-col items-center py-4">
      <div className="space-y-4">
        {topMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-200",
              activeView === item.id && "bg-accent text-accent-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div className="mt-auto space-y-4">
        {bottomMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-200",
              activeView === item.id && "bg-accent text-accent-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </nav>
  );
}