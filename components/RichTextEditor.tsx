"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CKEditor = dynamic(
  async () => {
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const { default: ClassicEditor } = await import("@ckeditor/ckeditor5-build-classic");
    return ({ data, onReady, onChange, config }: any) => (
      <CKEditor
        editor={ClassicEditor as any}
        data={data}
        onReady={onReady}
        onChange={onChange}
        config={config}
      />
    );
  },
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] w-full border rounded-md bg-muted/50 animate-pulse" />
    ),
  }
);

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (
        editorRef.current &&
        editorContainerRef.current &&
        document.body.contains(editorContainerRef.current) &&
        typeof editorRef.current.destroy === "function"
      ) {
        editorRef.current.destroy().catch((error: any) => {
          console.error("Error during CKEditor destroy:", error);
        });
        editorRef.current = null;
      }
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[200px] w-full border rounded-md bg-muted/50 animate-pulse" />
    );
  }

  return (
    <div className="prose prose-sm max-w-none" ref={editorContainerRef}>
      <CKEditor
        data={value || ""}
        onReady={(editor: any) => {
          editorRef.current = editor;
        }}
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
        config={{
          placeholder,
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "|",
            "outdent",
            "indent",
            "|",
            "blockQuote",
            "undo",
            "redo",
          ],
          removePlugins: ["MediaEmbed", "Table", "TableToolbar", "CKFinder"],
        }}
      />
    </div>
  );
}
