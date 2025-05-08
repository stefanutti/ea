"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { executeQuery } from "@/lib/neo4j";
import { toast } from "sonner";

interface QueryInputProps {
  onQueryResults: (results: any[]) => void;
}

export function QueryInput({ onQueryResults }: QueryInputProps) {
  const [query, setQuery] = useState("MATCH (a)-[e]->(b) WHERE a.name = \"sga\" RETURN a, e, b");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleExecute = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const results = await executeQuery(
        query,
        {},
        abortControllerRef.current.signal
      );
      onQueryResults(results);
      toast.success(`Query executed successfully: ${results.length} records returned`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Query error:", error);
        toast.error("Failed to execute query: " + (error as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Cypher query</h2>
      <div className="flex gap-2">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your Cypher query here..."
          className="font-mono flex-1"
          rows={4}
        />
        <Button 
          onClick={handleExecute} 
          className="h-auto"
          variant="secondary"
          disabled={isLoading}
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}