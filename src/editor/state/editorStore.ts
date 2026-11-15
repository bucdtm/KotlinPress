import { create } from 'zustand';
import {
  AppAST,
  ScreenDefinition,
  UIComponentNode,
  ComponentProps,
  ModifierConfig,
  StateVariable,
  ComponentType,
  AppThemeConfig,
  isContainerComponent,
  CustomKotlinFile,
} from '../../core/ast/schema.ts';
import { sampleAppAST } from '../../core/ast/sampleApp.ts';
import { THEME_PRESETS } from '../../core/ast/themePresets.ts';
import { parseKotlinCode, ImportResult } from '../../core/parser/kotlinParser.ts';

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
  moveComponent: (componentId: string, direction: 'up' | 'down') => void;
  reorderComponent: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  duplicateComponent: (componentId: string) => void;

  addStateVariable: (screenId: string, variable: StateVariable) => void;
  updateStateVariable: (screenId: string, varId: string, variable: Partial<StateVariable>) => void;
  deleteStateVariable: (screenId: string, varId: string) => void;

  addScreen: (name: string, route: string) => void;
  deleteScreen: (screenId: string) => void;

  // Gestión de Clases y Archivos Kotlin Personalizados
  addCustomFile: (file: CustomKotlinFile) => void;
  updateCustomFile: (id: string, file: Partial<CustomKotlinFile>) => void;
  deleteCustomFile: (id: string) => void;
  importKotlin: (code: string) => ImportResult;

  updateTheme: (theme: Partial<AppThemeConfig>) => void;
  applyThemePreset: (presetId: string) => void;

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

function findParentAndIndex(
  root: UIComponentNode,
  targetId: string
): { parent: UIComponentNode; index: number } | null {
  if (!root.children) return null;
  const idx = root.children.findIndex(c => c.id === targetId);
  if (idx !== -1) {
    return { parent: root, index: idx };
  }
  for (const child of root.children) {
    const res = findParentAndIndex(child, targetId);
    if (res) return res;
  }
  return null;
}

function findNodeInTree(root: UIComponentNode, targetId: string): UIComponentNode | null {
  if (root.id === targetId) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeInTree(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

function isDescendantNode(ancestor: UIComponentNode, potentialChildId: string): boolean {
  if (!ancestor.children) return false;
  for (const child of ancestor.children) {
    if (child.id === potentialChildId) return true;
    if (isDescendantNode(child, potentialChildId)) return true;
  }
  return false;
}

function cloneNodeWithNewIds(node: UIComponentNode): UIComponentNode {
  const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    ...node,
    id: newId,
    name: node.name ? `${node.name} (Copia)` : undefined,
    modifier: { ...node.modifier },
    props: { ...node.props },
    events: node.events ? JSON.parse(JSON.stringify(node.events)) : undefined,
    children: node.children ? node.children.map(cloneNodeWithNewIds) : undefined,
  };
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
    } else if (type === 'RadioButton') {
      newNode.props = { label: 'Opción 1', radioValue: 'opcion_1', selectedBinding: '' };
      newNode.modifier = { paddingVertical: 4 };
    } else if (type === 'Image') {
      newNode.props = { imageResource: 'sample_image', contentDescription: 'Imagen de ejemplo' };
      newNode.modifier = { width: 120, height: 120, cornerRadius: 8 };
    } else if (type === 'Spacer') {
      newNode.props = { size: 16 };
    } else if (type === 'Box') {
      newNode.children = [];
      newNode.props = { contentAlignment: 'Center' };
      newNode.modifier = { paddingAll: 8 };
    } else if (type === 'LazyColumn') {
      newNode.children = [];
      newNode.modifier = { fillMaxWidth: true, paddingAll: 4 };
    } else if (type === 'Column' || type === 'Row' || type === 'Card') {
      newNode.children = [];
      newNode.modifier = { paddingAll: 8 };
    }

    // Regla de Contención: NO permitir introducir hijos dentro de hojas (Text, Spacer, Button, etc.)
    const targetId = parentId || screen.rootComponent.id;
    const targetNode = findNodeInTree(screen.rootComponent, targetId);

    if (targetNode && isContainerComponent(targetNode.type)) {
      // El nodo seleccionado ES un contenedor: se inserta como hijo dentro de él
      if (!targetNode.children) targetNode.children = [];
      targetNode.children.push(newNode);
    } else {
      // El nodo seleccionado es una hoja (Text, Divider, Spacer, Button, etc.)
      // Buscamos su padre contenedor para insertarlo como hermano inmediatamente después
      const parentInfo = findParentAndIndex(screen.rootComponent, targetId);
      if (parentInfo && parentInfo.parent.children) {
        parentInfo.parent.children.splice(parentInfo.index + 1, 0, newNode);
      } else {
        // Si no se encuentra padre, fallback seguro a la raíz de la pantalla
        if (!screen.rootComponent.children) screen.rootComponent.children = [];
        screen.rootComponent.children.push(newNode);
      }
    }

    set({ ast: newAst, selectedComponentId: newId });
  },

  reorderComponent: (sourceId, targetId, position) => {
    const { ast, selectedScreenId } = get();
    if (sourceId === targetId) return;

    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen || screen.rootComponent.id === sourceId) return; // No mover la raíz

    const sourceNode = findNodeInTree(screen.rootComponent, sourceId);
    if (!sourceNode) return;

    // Prevenir ciclos: no mover un nodo dentro de sus propios descendientes
    if (isDescendantNode(sourceNode, targetId)) return;

    // 1. Extraer el nodo origen
    removeNode(screen.rootComponent, sourceId);

    // 2. Insertar en la nueva ubicación
    if (position === 'inside') {
      const targetNode = findNodeInTree(screen.rootComponent, targetId);
      if (targetNode && isContainerComponent(targetNode.type)) {
        if (!targetNode.children) targetNode.children = [];
        targetNode.children.push(sourceNode);
      } else {
        // Si el objetivo no es contenedor, insertar como hermano siguiente
        const parentInfo = findParentAndIndex(screen.rootComponent, targetId);
        if (parentInfo && parentInfo.parent.children) {
          parentInfo.parent.children.splice(parentInfo.index + 1, 0, sourceNode);
        } else {
          screen.rootComponent.children?.push(sourceNode);
        }
      }
    } else if (position === 'before') {
      const parentInfo = findParentAndIndex(screen.rootComponent, targetId);
      if (parentInfo && parentInfo.parent.children) {
        parentInfo.parent.children.splice(parentInfo.index, 0, sourceNode);
      } else {
        screen.rootComponent.children?.unshift(sourceNode);
      }
    } else if (position === 'after') {
      const parentInfo = findParentAndIndex(screen.rootComponent, targetId);
      if (parentInfo && parentInfo.parent.children) {
        parentInfo.parent.children.splice(parentInfo.index + 1, 0, sourceNode);
      } else {
        screen.rootComponent.children?.push(sourceNode);
      }
    }

    set({ ast: newAst, selectedComponentId: sourceId });
  },

  deleteComponent: (componentId) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen || screen.rootComponent.id === componentId) return; // No borrar la raíz

    removeNode(screen.rootComponent, componentId);
    set({ ast: newAst, selectedComponentId: null });
  },

  moveComponent: (componentId, direction) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen) return;

    const res = findParentAndIndex(screen.rootComponent, componentId);
    if (!res || !res.parent.children) return;

    const { parent, index } = res;
    const children = parent.children;
    if (!children) return;

    if (direction === 'up' && index > 0) {
      const temp = children[index];
      children[index] = children[index - 1];
      children[index - 1] = temp;
      set({ ast: newAst });
    } else if (direction === 'down' && index < children.length - 1) {
      const temp = children[index];
      children[index] = children[index + 1];
      children[index + 1] = temp;
      set({ ast: newAst });
    }
  },

  duplicateComponent: (componentId) => {
    const { ast, selectedScreenId } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === selectedScreenId);
    if (!screen || screen.rootComponent.id === componentId) return;

    const res = findParentAndIndex(screen.rootComponent, componentId);
    if (!res || !res.parent.children) return;

    const { parent, index } = res;
    const children = parent.children;
    if (!children) return;

    const clone = cloneNodeWithNewIds(children[index]);
    children.splice(index + 1, 0, clone);
    set({ ast: newAst, selectedComponentId: clone.id });
  },

  addStateVariable: (screenId, variable) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === screenId);
    if (!screen) return;

    screen.stateVariables.push(variable);
    set({ ast: newAst });
  },

  updateStateVariable: (screenId, varId, variable) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    const screen = newAst.screens.find(s => s.id === screenId);
    if (!screen) return;

    const idx = screen.stateVariables.findIndex(v => v.id === varId);
    if (idx !== -1) {
      screen.stateVariables[idx] = { ...screen.stateVariables[idx], ...variable };
      set({ ast: newAst });
    }
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

  addCustomFile: (file) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    if (!newAst.customFiles) newAst.customFiles = [];
    newAst.customFiles.push(file);
    set({ ast: newAst });
  },

  updateCustomFile: (id, file) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    if (!newAst.customFiles) return;
    const idx = newAst.customFiles.findIndex(f => f.id === id);
    if (idx !== -1) {
      newAst.customFiles[idx] = { ...newAst.customFiles[idx], ...file };
      set({ ast: newAst });
    }
  },

  deleteCustomFile: (id) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    if (!newAst.customFiles) return;
    newAst.customFiles = newAst.customFiles.filter(f => f.id !== id);
    set({ ast: newAst });
  },

  importKotlin: (code) => {
    const result = parseKotlinCode(code);
    if (!result.success) return result;

    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;

    if (result.screen) {
      // Garantizar que la ruta sea única
      let finalRoute = result.screen.route;
      let counter = 1;
      while (newAst.screens.some(s => s.route === finalRoute)) {
        finalRoute = `${result.screen.route}_${counter++}`;
      }
      result.screen.route = finalRoute;

      newAst.screens.push(result.screen);
      set({ ast: newAst, selectedScreenId: result.screen.id, selectedComponentId: null });
    }

    if (result.customFile) {
      if (!newAst.customFiles) newAst.customFiles = [];
      newAst.customFiles.push(result.customFile);
      set({ ast: newAst });
    }

    return result;
  },

  updateTheme: (themeUpdate) => {
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    newAst.theme = { ...newAst.theme, ...themeUpdate };
    set({ ast: newAst });
  },

  applyThemePreset: (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const { ast } = get();
    const newAst = JSON.parse(JSON.stringify(ast)) as AppAST;
    newAst.theme = { ...preset.config };
    set({ ast: newAst });
  },

  loadAST: (ast) => set({ ast, selectedScreenId: ast.screens[0]?.id || '', selectedComponentId: null }),

  resetToSample: () => set({
    ast: JSON.parse(JSON.stringify(sampleAppAST)),
    selectedScreenId: 'home',
    selectedComponentId: null,
  }),
}));
