export type ComponentType = 'Frame' | 'Button' | 'Text' | 'Input';

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };

export type BaseComponentProps = Size & {
  fill?: string;
  stroke?: string;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  placeholder?: string;
};

export interface UIComponent {
  id: string;
  type: ComponentType;
  pageId: string;
  position: Point;
  props: BaseComponentProps;
}

export interface Page {
  id: string;
  name: string;
  size: Size;
}

export interface FlowEdge {
  id: string;
  componentId: string;
  toPageId: string;
}

export interface ProjectModel {
  id: string;
  name: string;
  pages: Page[];
  components: UIComponent[];
  flows: FlowEdge[];
  currentPageId: string;
}

export const DEFAULT_PAGE_SIZE: Size = { width: 1200, height: 800 };

