"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, GripVertical } from "lucide-react";

interface DrawingItem {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface DrawingCollapsibleProps {
  title: string;
  items: DrawingItem[];
  isOpen: boolean;
  onToggle: any
}

export function DrawingCollapsible({ title, items, isOpen, onToggle }: DrawingCollapsibleProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(items);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);  

  useEffect(() => {
    setList(items);
  }, [items]);

  const filteredItems = list.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (index: number, item: DrawingItem) => {
    dragItemIndex.current = index;
    setDraggingIndex(index);
    // Inserisci i dati per il drop
    const transferData = {
      id: item.id,
      name: item.name,
    };
    event?.dataTransfer?.setData(
      "application/json",
      JSON.stringify(transferData)
    );
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
    setDragOverIndex(index);
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = () => {
    const dragIndex = dragItemIndex.current;
    const overIndex = dragOverItemIndex.current;

    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragOverIndex(null);
      setDraggingIndex(null);
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
      return;
    }

    const updatedList = [...list];
    const draggedItem = updatedList.splice(dragIndex, 1)[0];
    updatedList.splice(overIndex, 0, draggedItem);

    setList(updatedList);
    setDragOverIndex(null);
    setDraggingIndex(null);
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  return (
    <div className="border rounded-md shadow-sm bg-white max-w-md mx-auto w-[350px] p-[2px]">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex justify-between items-center cursor-pointer select-none px-4 py-1 rounded font-semibold text-base min-h-[36px] w-full">
          <span className="text-sm font-medium">{title}</span>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden transition-all duration-300">
          <div className="pt-2 px-2 pb-2">
            <div className="pt-2 px-2">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search.."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div
                style={{
                  maxHeight: "200px",
                  overflowY: filteredItems.length > 5 ? "auto" : "visible",
                }}
                className="space-y-2 mt-4 pr-1"
              >
                {filteredItems.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No element found
                  </div>
                )}

                {filteredItems.map((item, index) => {
                  const isDragOver = index === dragOverIndex;
                  const isDragging = index === draggingIndex;
                  const isPresent = item.selected

                  return (
                    <div
                      key={item.id}
                      draggable={!isPresent}
                      onDragStart={(e) => handleDragStart(index, item)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={() => handleDragLeave(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`flex items-center justify-between p-2 border rounded cursor-grab select-none
                        ${isDragOver ? "bg-blue-100 border-blue-400" : "border-gray-300"}
                        ${isPresent ? "opacity-50 cursor-not-allowed" : "cursor-grab"}
                      `}
                      style={{ userSelect: "none" }}
                    >
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                      <GripVertical className="w-4 h-4 text-gray-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
