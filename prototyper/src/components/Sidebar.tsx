import React from 'react';
import { useAppStore } from '../store';
import type { ComponentType } from '../types';

const LIB_ITEMS: { type: ComponentType; label: string }[] = [
  { type: 'Frame', label: 'Frame' },
  { type: 'Button', label: 'Button' },
  { type: 'Text', label: 'Text' },
  { type: 'Input', label: 'Input' },
];

export function Sidebar() {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const project = useAppStore((s) => s.project);

  function onDragStart(e: React.DragEvent<HTMLDivElement>, type: ComponentType) {
    e.dataTransfer.setData('application/x-prototyper-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside style={{ width: 240, borderRight: '1px solid #e5e7eb', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600 }}>Biblioteca</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {LIB_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            style={{
              userSelect: 'none',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '8px 10px',
              textAlign: 'center',
              cursor: 'grab',
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title="Arraste para o canvas"
          >
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontWeight: 600 }}>Páginas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {project.pages.map((p) => (
          <button
            key={p.id}
            onClick={() => setCurrentPage(p.id)}
            style={{
              textAlign: 'left',
              background: p.id === project.currentPageId ? '#eef2ff' : '#fff',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '6px 8px',
              cursor: 'pointer'
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

