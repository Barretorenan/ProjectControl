import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import type { ProjectModel, Page, UIComponent, ComponentType, FlowEdge, Point, BaseComponentProps } from './types';
import { DEFAULT_PAGE_SIZE } from './types';

const STORAGE_KEY = 'prototyper.project.v1';

type StoreState = {
  project: ProjectModel;
  selectedComponentId: string | null;
  playMode: boolean;

  addPage: (name?: string) => void;
  setCurrentPage: (pageId: string) => void;
  addComponent: (type: ComponentType, position: Point) => void;
  updateComponent: (id: string, patch: Partial<UIComponent>) => void;
  updateComponentProps: (id: string, props: Partial<BaseComponentProps>) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  setFlow: (componentId: string, toPageId: string | null) => void;

  togglePlay: () => void;

  saveLocal: () => void;
  loadLocal: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
};

function createInitialProject(): ProjectModel {
  const pageId = nanoid();
  const project: ProjectModel = {
    id: nanoid(),
    name: 'Meu Projeto',
    pages: [{ id: pageId, name: 'Página 1', size: DEFAULT_PAGE_SIZE }],
    components: [],
    flows: [],
    currentPageId: pageId,
  };
  return project;
}

export const useAppStore = create<StoreState>((set, get) => ({
  project: createInitialProject(),
  selectedComponentId: null,
  playMode: false,

  addPage: (name) => set((state) => {
    const page: Page = { id: nanoid(), name: name ?? `Página ${state.project.pages.length + 1}`, size: DEFAULT_PAGE_SIZE };
    const project: ProjectModel = { ...state.project, pages: [...state.project.pages, page], currentPageId: page.id };
    return { project } as Partial<StoreState>;
  }),

  setCurrentPage: (pageId) => set((state) => ({ project: { ...state.project, currentPageId: pageId } })),

  addComponent: (type, position) => set((state) => {
    const currentPageId = state.project.currentPageId;
    const id = nanoid();
    const defaultProps: BaseComponentProps = (() => {
      switch (type) {
        case 'Frame':
          return { width: 300, height: 200, fill: '#f5f5f5', stroke: '#999', cornerRadius: 8 };
        case 'Button':
          return { width: 120, height: 40, fill: '#2563eb', text: 'Button', fontSize: 16, cornerRadius: 6 };
        case 'Text':
          return { width: 200, height: 30, text: 'Texto', fontSize: 18 };
        case 'Input':
          return { width: 220, height: 36, fill: '#ffffff', stroke: '#999', placeholder: 'Digite aqui...' };
      }
    })();
    const comp: UIComponent = {
      id,
      type,
      pageId: currentPageId,
      position,
      props: defaultProps,
    };
    const project = { ...state.project, components: [...state.project.components, comp] };
    return { project, selectedComponentId: id } as Partial<StoreState>;
  }),

  updateComponent: (id, patch) => set((state) => {
    const components = state.project.components.map((c) => (c.id === id ? { ...c, ...patch, props: patch.props ? { ...c.props, ...patch.props } : c.props } : c));
    return { project: { ...state.project, components } } as Partial<StoreState>;
  }),

  updateComponentProps: (id, props) => set((state) => {
    const components = state.project.components.map((c) => (c.id === id ? { ...c, props: { ...c.props, ...props } } : c));
    return { project: { ...state.project, components } } as Partial<StoreState>;
  }),

  removeComponent: (id) => set((state) => {
    const components = state.project.components.filter((c) => c.id !== id);
    const flows = state.project.flows.filter((f) => f.componentId !== id);
    const selectedComponentId = state.selectedComponentId === id ? null : state.selectedComponentId;
    return { project: { ...state.project, components, flows }, selectedComponentId } as Partial<StoreState>;
  }),

  selectComponent: (id) => set(() => ({ selectedComponentId: id })),

  setFlow: (componentId, toPageId) => set((state) => {
    let flows = state.project.flows;
    const existing = flows.find((f) => f.componentId === componentId);
    if (toPageId === null) {
      if (existing) flows = flows.filter((f) => f.id !== existing.id);
    } else if (existing) {
      flows = flows.map((f) => (f.id === existing.id ? { ...f, toPageId } : f));
    } else {
      flows = [...flows, { id: nanoid(), componentId, toPageId } as FlowEdge];
    }
    return { project: { ...state.project, flows } } as Partial<StoreState>;
  }),

  togglePlay: () => set((state) => ({ playMode: !state.playMode, selectedComponentId: null })),

  saveLocal: () => {
    const state = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
  },
  loadLocal: () => set((state) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as Partial<StoreState>;
    try {
      const project = JSON.parse(raw) as ProjectModel;
      return { project } as Partial<StoreState>;
    } catch (e) {
      console.error('Falha ao carregar projeto', e);
      return {} as Partial<StoreState>;
    }
  }),
  exportJson: () => JSON.stringify(get().project, null, 2),
  importJson: (json: string) => set(() => {
    const project = JSON.parse(json) as ProjectModel;
    return { project, selectedComponentId: null, playMode: false } as Partial<StoreState>;
  }),
}));

