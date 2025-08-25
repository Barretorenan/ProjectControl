import React, { useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Text as KText, Group } from 'react-konva';
import { useAppStore } from '../store';
import type { UIComponent } from '../types';

function ButtonNode({ component, onDragEnd, onSelect, playMode, onActivate }: PropsForNode) {
  const { position, props } = component;
  const handleClick = () => (playMode ? onActivate(component) : onSelect(component));
  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={!playMode}
      onDragEnd={(e) => onDragEnd(component, e.target.x(), e.target.y())}
      onClick={handleClick}
    >
      <Rect width={props.width} height={props.height} fill={props.fill || '#2563eb'} cornerRadius={props.cornerRadius ?? 6} shadowBlur={playMode ? 0 : 2} />
      <KText
        text={props.text || 'Button'}
        fontSize={props.fontSize || 16}
        fill="#fff"
        width={props.width}
        height={props.height}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}

function FrameNode({ component, onDragEnd, onSelect, playMode }: PropsForNode) {
  const { position, props } = component;
  return (
    <Rect
      x={position.x}
      y={position.y}
      width={props.width}
      height={props.height}
      fill={props.fill || '#f5f5f5'}
      stroke={props.stroke || '#d1d5db'}
      cornerRadius={props.cornerRadius ?? 8}
      draggable={!playMode}
      onDragEnd={(e) => onDragEnd(component, e.target.x(), e.target.y())}
      onClick={() => onSelect(component)}
    />
  );
}

function TextNode({ component, onDragEnd, onSelect, playMode }: PropsForNode) {
  const { position, props } = component;
  return (
    <KText
      x={position.x}
      y={position.y}
      text={props.text || 'Texto'}
      fontSize={props.fontSize || 18}
      fill="#111827"
      draggable={!playMode}
      onDragEnd={(e) => onDragEnd(component, e.target.x(), e.target.y())}
      onClick={() => onSelect(component)}
    />
  );
}

function InputNode({ component, onDragEnd, onSelect, playMode }: PropsForNode) {
  const { position, props } = component;
  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={!playMode}
      onDragEnd={(e) => onDragEnd(component, e.target.x(), e.target.y())}
      onClick={() => onSelect(component)}
    >
      <Rect width={props.width} height={props.height} fill={props.fill || '#fff'} stroke={props.stroke || '#9ca3af'} cornerRadius={6} />
      <KText text={props.placeholder || 'Digite aqui...'} x={10} y={props.height / 2 - 9} fontSize={16} fill="#6b7280" />
    </Group>
  );
}

type PropsForNode = {
  component: UIComponent;
  onDragEnd: (c: UIComponent, x: number, y: number) => void;
  onSelect: (c: UIComponent) => void;
  playMode: boolean;
  onActivate: (c: UIComponent) => void;
};

export function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const project = useAppStore((s) => s.project);
  const addComponent = useAppStore((s) => s.addComponent);
  const updateComponent = useAppStore((s) => s.updateComponent);
  const selectComponent = useAppStore((s) => s.selectComponent);
  const selectedId = useAppStore((s) => s.selectedComponentId);
  const playMode = useAppStore((s) => s.playMode);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const currentPage = useMemo(() => project.pages.find((p) => p.id === project.currentPageId)!, [project]);
  const pageComponents = useMemo(() => project.components.filter((c) => c.pageId === project.currentPageId), [project]);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-prototyper-component');
    if (!type) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addComponent(type as any, { x, y });
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes('application/x-prototyper-component')) {
      e.preventDefault();
    }
  }

  function onNodeDragEnd(c: UIComponent, x: number, y: number) {
    updateComponent(c.id, { position: { x, y } as any });
  }

  function onSelectNode(c: UIComponent) {
    if (playMode) return;
    selectComponent(c.id);
  }

  function onActivateNode(c: UIComponent) {
    if (!playMode) return;
    const flow = project.flows.find((f) => f.componentId === c.id);
    if (flow) setCurrentPage(flow.toPageId);
  }

  return (
    <div
      ref={containerRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{ flex: 1, overflow: 'auto', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
        <Stage width={currentPage.size.width} height={currentPage.size.height} style={{ background: '#fff' }}>
          <Layer>
            {pageComponents.map((c) => {
              const isSelected = selectedId === c.id && !playMode;
              const commonProps = { component: c, onDragEnd: onNodeDragEnd, onSelect: onSelectNode, playMode, onActivate: onActivateNode } as PropsForNode;
              return (
                <Group key={c.id} listening>
                  {c.type === 'Frame' && <FrameNode {...commonProps} />}
                  {c.type === 'Button' && <ButtonNode {...commonProps} />}
                  {c.type === 'Text' && <TextNode {...commonProps} />}
                  {c.type === 'Input' && <InputNode {...commonProps} />}
                  {isSelected && (
                    <Rect
                      x={c.position.x - 2}
                      y={c.position.y - 2}
                      width={(c.props.width || 0) + 4}
                      height={(c.props.height || 24) + 4}
                      stroke="#6366f1"
                      dash={[4, 4]}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default Canvas;

