import React from 'react';
import { useAppStore } from '../store';

export function TopBar() {
  const addPage = useAppStore((s) => s.addPage);
  const save = useAppStore((s) => s.saveLocal);
  const load = useAppStore((s) => s.loadLocal);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const exportJson = useAppStore((s) => s.exportJson);
  const importJson = useAppStore((s) => s.importJson);
  const playMode = useAppStore((s) => s.playMode);

  function onExport() {
    const data = exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') importJson(reader.result);
    };
    reader.readAsText(file);
  }

  return (
    <header style={{ height: 56, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#ffffff' }}>
      <div style={{ fontWeight: 700 }}>Prototyper</div>
      <div style={{ flex: 1 }} />
      <button onClick={() => addPage()} style={btn()}>+ Página</button>
      <button onClick={save} style={btn()}>Salvar</button>
      <button onClick={load} style={btn()}>Carregar</button>
      <button onClick={onExport} style={btn()}>Exportar</button>
      <label style={btn(true)}>
        Importar
        <input type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
      </label>
      <button onClick={togglePlay} style={{ ...btn(), background: playMode ? '#10b981' : '#e5e7eb' }}>{playMode ? 'Simular Ativo' : 'Simular'}</button>
    </header>
  );
}

function btn(asLabel = false): React.CSSProperties {
  return {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '6px 10px',
    background: '#f9fafb',
    cursor: 'pointer',
    userSelect: 'none',
    display: asLabel ? 'inline-block' : undefined,
  };
}

export default TopBar;

