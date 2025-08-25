import React from 'react';
import { useAppStore } from '../store';

export function PropertiesPanel() {
  const selectedId = useAppStore((s) => s.selectedComponentId);
  const component = useAppStore((s) => s.project.components.find((c) => c.id === s.selectedComponentId));
  const updateProps = useAppStore((s) => s.updateComponentProps);
  const remove = useAppStore((s) => s.removeComponent);
  const setFlow = useAppStore((s) => s.setFlow);
  const project = useAppStore((s) => s.project);

  if (!selectedId || !component) return (
    <aside style={{ width: 280, borderLeft: '1px solid #e5e7eb', padding: 12 }}>
      <div style={{ fontWeight: 600 }}>Propriedades</div>
      <div style={{ color: '#6b7280', marginTop: 8 }}>Selecione um componente</div>
    </aside>
  );

  function input<K extends keyof typeof component.props>(key: K, type: 'text' | 'number' | 'color', min?: number) {
    const val = component.props[key] as any;
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#374151' }}>{String(key)}</span>
        <input
          type={type}
          value={val ?? ''}
          min={min}
          onChange={(e) => {
            const next: any = type === 'number' ? Number(e.target.value) : e.target.value;
            updateProps(component.id, { [key]: next } as any);
          }}
          style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px' }}
        />
      </label>
    );
  }

  function selectFlow() {
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#374151' }}>Fluxo (onClick → Página)</span>
        <select
          value={project.flows.find((f) => f.componentId === component.id)?.toPageId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) setFlow(component.id, null);
            else setFlow(component.id, v);
          }}
          style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px' }}
        >
          <option value="">— Nenhum —</option>
          {project.pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <aside style={{ width: 280, borderLeft: '1px solid #e5e7eb', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Propriedades</div>
        <button onClick={() => remove(component.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
          Remover
        </button>
      </div>
      <div style={{ color: '#6b7280' }}>{component.type}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {input('width', 'number', 0)}
        {input('height', 'number', 0)}
        {input('fill', 'text')}
        {input('stroke', 'text')}
        {input('cornerRadius', 'number', 0)}
        {input('fontSize', 'number', 1)}
      </div>
      {component.type !== 'Text' && input('text', 'text')}
      {component.type === 'Input' && input('placeholder', 'text')}
      {selectFlow()}
    </aside>
  );
}

export default PropertiesPanel;

