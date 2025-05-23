"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, GripVertical } from "lucide-react";

interface DrawingItem {
  id?: string | number;
  name: string;
  svg?: string | null;
  [key: string]: any;
}

interface DrawingCollapsibleProps {
  title: string;
  items: DrawingItem[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  type?: "text" | "images";
  width?: string | number;
  height?: string | number;
  footer?: (search: string) => React.ReactNode;

}

export function DrawingCollapsible({
  title,
  items,
  isOpen,
  onToggle,
  type = "text",
  width = "250px",
  height,
  footer
}: DrawingCollapsibleProps) {
  const [search, setSearch] = useState("");
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

  const handleDragStart = (
    index: number,
    item: DrawingItem,
    event: React.DragEvent
  ) => {
    dragItemIndex.current = index;
    setDraggingIndex(index);
    const transferData = {
      id: item.id,
      name: item.name,
      svg: item.svg || null,
    };
    event.dataTransfer.setData(
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
    <div
      className="border rounded-md shadow-sm bg-white p-[2px] mx-auto"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: height
          ? typeof height === "number"
            ? `${height}px`
            : height
          : undefined,
      }}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex justify-between items-center cursor-pointer select-none px-4 py-1 rounded font-semibold text-base min-h-[36px] w-full">
          <span className="text-sm font-medium">{title}</span>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? "animate-collapsible-down" : "animate-collapsible-up"
          }`}
        >
          <div className="pt-2 px-2 pb-2">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredItems.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                No element found
              </div>
            )}

            {type === "text" && (
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: filteredItems.length > 5 ? "auto" : "visible",
                }}
                className="space-y-2 mt-4 pr-1"
              >
                {filteredItems.map((item, index) => {
                  const isDragOver = index === dragOverIndex;
                  const isDragging = index === draggingIndex;
                  const isPresent = item.selected || false;

                  return (
                    <div
                      key={item.id}
                      draggable={!isPresent}
                      onDragStart={(e) => handleDragStart(index, item, e)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={() => handleDragLeave(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`flex items-center justify-between p-2 border rounded cursor-grab select-none
                        ${
                          isDragOver
                            ? "bg-blue-100 border-blue-400"
                            : "border-gray-300"
                        }
                        ${
                          isPresent
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-grab"
                        }
                      `}
                      style={{ userSelect: "none" }}
                    >
                      <span className="flex items-center gap-2 text-gray-800">
                        {item.svg && (
                          <span
                            className="w-5 h-5"
                            dangerouslySetInnerHTML={{ __html: item.svg }}
                          />
                        )}
                        {item.name}
                      </span>
                      <GripVertical className="w-4 h-4 text-gray-500" />
                    </div>
                  );
                })}
              </div>
            )}

            {type === "images" && (
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: filteredItems.length > 6 ? "auto" : "visible",
                }}
                className="grid grid-cols-3 gap-3 mt-4 pr-1"
              >
                {filteredItems.map((item, index) => {
                  const isDragOver = index === dragOverIndex;
                  const isDragging = index === draggingIndex;
                  const isPresent = item.selected;

                  return (
                    <div
                      key={item.id}
                      draggable={!isPresent}
                      onDragStart={(e) => handleDragStart(index, item, e)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={() => handleDragLeave(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`relative w-full aspect-square border rounded cursor-grab select-none flex flex-col items-center justify-center
                        ${
                          isDragOver
                            ? "bg-blue-100 border-blue-400"
                            : "border-gray-300"
                        }
                        ${
                          isPresent
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-grab"
                        }
                      `}
                      style={{ userSelect: "none" }}
                    >
                      {item.svg ? (
                        <span
                          className="flex items-center justify-center w-1/2 h-1/2 max-w-full max-h-full"
                          style={{ display: "flex" }}
                          dangerouslySetInnerHTML={{ __html: item.svg }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300" />
                      )}
                      <GripVertical className="absolute top-1 right-1 w-1/5 h-1/5 text-gray-500" />
                    </div>
                  );
                })}
              </div>
            )}

             {footer && <div className="mt-2 border-t pt-2">{footer(search)}</div>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
