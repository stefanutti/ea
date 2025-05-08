"use client";

import dynamic from 'next/dynamic';
import '@tldraw/tldraw/tldraw.css';

const Tldraw = dynamic(
  () => import('@tldraw/tldraw').then((mod) => mod.Tldraw),
  { ssr: false }
);

export function DrawingEditor() {
  return (
    <div className="w-full h-full border rounded-lg bg-card overflow-hidden">
      <Tldraw />
    </div>
  );
}