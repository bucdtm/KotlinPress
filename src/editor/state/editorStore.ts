import { create } from 'zustand';
import {
  AppAST,
  ScreenDefinition,
  UIComponentNode,
  ComponentProps,
  ModifierConfig,
  StateVariable,
  ComponentType,
} from '../../core/ast/schema.ts';
import { sampleAppAST } from '../../core/ast/sampleApp.ts';

interface EditorState {
  ast: AppAST;
  selectedScreenId: string;
  selectedComponentId: string | null;
  interactiveMode: boolean; // true: Simulador activo (Play), false: Modo Selección/Diseño

  setInteractiveMode: (enabled: boolean) => void;
  selectScreen: (screenId: string) => void;
  selectComponent: (id: string | null) => void;

  updateComponentProps: (componentId: string, props: Partial<ComponentProps>) => void;
  updateComponentModifier: (componentId: string, modifier: Partial<ModifierConfig>) => void;
  addComponent: (parentId: string, type: ComponentType) => void;
  deleteComponent: (componentId: string) => void;

  addStateVariable: (screenId: string, variable: StateVariable) => void;
  deleteStateVariable: (screenId: string, varId: string) => void;

  addScreen: (name: string, route: string) => void;
  deleteScreen: (screenId: string) => void;

  loadAST: (ast: AppAST) => void;
  resetToSample: () => void;
}

function findAndMutateNode(
  root: UIComponentNode,
  targetId: string,
  mutate: (node: UIComponentNode) => void
): boolean {
  if (root.id === targetId) {
    mutate(root);
    return true;
  }
  if (root.children) {
    for (const child of root.children) {
      if (findAndMutateNode(child, targetId, mutate)) {
        return true;
      }
    }
  }
  return false;
}

function removeNode(root: UIComponentNode, targetId: string): boolean {
  if (!root.children) return false;
  const idx = root.children.findIndex(c => c.id === targetId);
  if (idx !== -1) {
    root.children.splice(idx, 1);
    return true;
  }
  for (const child of root.children) {
    if (removeNode(child, targetId)) return true;
  }
  return false;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ast: sampleAppAST,
  selectedScreenId: 'home',
  selectedComponentId: null,
  interactiveMode: false,

  setInteractiveMode: (enabled) => set({ interactiveMode: enabled, selectedComponentId: null }),

  selectScreen: (screenId) => set({ selectedScreenId: screenId, selectedComponentId: null }),

  selectComponent: (id) => set({ selectedComponentId: id, interactiveMode: false }),

  updateComponentProps: (componentId, props) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen) return;

    findAndMutateNode(screen.rootComponent, componentId, node => {
      node.props = { ...node.props, ...props };
    });

    set({ ast: newAst });
  },

  updateComponentModifier: (componentId, modifier) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen) return;

    findAndMutateNode(screen.rootComponent, componentId, node => {
      node.modifier = { ...node.modifier, ...modifier };
    });

    set({ ast: newAst });
  },

  addComponent: (parentId, type) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen) return;

    const newId = `node-${Date.now()}`;
    const newNode: UIComponentNode = {
      id: newId,
      type,
      name: `Nuevo ${type}`,
      modifier: {},
      props: {},
    };

    if (type === 'Text') {
      newNode.props = { text: 'Texto de ejemplo', fontSize: 16 };
      newNode.modifier = { paddingBottom: 8 };
    } else if (type === 'Button' || type === 'OutlinedButton') {
      newNode.props = { label: 'Click Aquí' };
      newNode.events = { onClick: [] };
    } else if (type === 'OutlinedTextField') {
      newNode.props = { label: 'Campo de texto', valueBinding: '' };
      newNode.modifier = { fillMaxWidth: true, paddingBottom: 8 };
    } else if (type === 'Spacer') {
      newNode.props = { size: 16 };
    } else if (type === 'Column' || type === 'Row' || type === 'Card') {
      newNode.children = [];
      newNode.modifier = { paddingAll: 8 };
    }

    findAndMutateNode(screen.rootComponent, parentId, parent => {
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
    });

    set({ ast: newAst, selectedComponentId: newId });
  },

  deleteComponent: (componentId) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen || screen.rootComponent.id === componentId) return; // No borrar la raíz

    removeNode(screen.rootComponent, componentId);
    set({ ast: newAst, selectedComponentId: null });
  },

  addStateVariable: (screenId, variable) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === screenId);
    if (!screen) return;

    screen.stateVariables.push(variable);
    set({ ast: newAst });
  },

  deleteStateVariable: (screenId, varId) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === screenId);
    if (!screen) return;

    screen.stateVariables = screen.stateVariables.filter(v => v.id !== varId);
    set({ ast: newAst });
  },

  addScreen: (name, route) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const id = `screen-${Date.now()}`;
    const newScreen: ScreenDefinition = {
      id,
      name,
      route,
      title: name,
      stateVariables: [],
      rootComponent: {
        id: `root-${id}`,
        type: 'Column',
        name: 'Contenedor Principal',
        modifier: { fillMaxSize: true, paddingAll: 16 },
        props: { verticalArrangement: 'Top', horizontalAlignment: 'Start' },
        children: [
          {
            id: `title-${id}`,
            type: 'Text',
            name: 'Título',
            modifier: { paddingBottom: 16 },
            props: { text: name, fontSize: 24, fontWeight: 'Bold' },
          },
        ],
      },
    };

    newAst.screens.push(newScreen);
    set({ ast: newAst, selectedScreenId: id, selectedComponentId: null });
  },

  deleteScreen: (screenId) => {
    const { ast } = get();
    if (ast.screens.length <= 1) return; // Mínimo una pantalla

    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    newAst.screens = newAst.screens.filter(s => s.id !== screenId);
    const nextScreen = newAst.screens[0].id;
    set({ ast: newAst, selectedScreenId: nextScreen, selectedComponentId: null });
  },

  loadAST: (ast) => set({ ast, selectedScreenId: ast.screens[0]?.id || '', selectedComponentId: null }),

  resetToSample: () => set({
    ast: JSON.parse(JSON.stringify(sampleAppAST)),
    selectedScreenId: 'home',
    selectedComponentId: null,
  }),
}));
