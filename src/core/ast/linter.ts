import { AppAST, ScreenDefinition, UIComponentNode, isContainerComponent } from './schema.ts';

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  screenId?: string;
  screenName?: string;
  componentId?: string;
  componentName?: string;
  title: string;
  message: string;
  suggestion?: string;
}

export function lintAppAST(ast: AppAST): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  // 1. Validar unicidad de rutas en pantallas
  const routeCounts = new Map<string, number>();
  for (const s of ast.screens) {
    const count = (routeCounts.get(s.route) || 0) + 1;
    routeCounts.set(s.route, count);
  }
  for (const [route, count] of routeCounts.entries()) {
    if (count > 1) {
      issues.push({
        id: `dup-route-${route}`,
        severity: 'error',
        title: 'Ruta de pantalla duplicada',
        message: `La ruta "${route}" está asignada a ${count} pantallas distintas. Esto provocará un fallo en NavHost.`,
        suggestion: 'Asigna una ruta única a cada pantalla en el ScreenManager.',
      });
    }
  }

  const existingRoutes = new Set(ast.screens.map(s => s.route));

  // 2. Validar cada pantalla
  for (const screen of ast.screens) {
    const varMap = new Map(screen.stateVariables.map(v => [v.name, v]));

    lintNode(screen.rootComponent, screen, varMap, existingRoutes, issues);
  }

  return issues;
}

function lintNode(
  node: UIComponentNode,
  screen: ScreenDefinition,
  varMap: Map<string, any>,
  existingRoutes: Set<string>,
  issues: DiagnosticIssue[]
): void {
  const p = node.props || {};

  // A. Verificación de anidación en hojas
  if (!isContainerComponent(node.type) && node.children && node.children.length > 0) {
    issues.push({
      id: `leaf-has-children-${node.id}`,
      severity: 'error',
      screenId: screen.id,
      screenName: screen.name,
      componentId: node.id,
      componentName: node.name || node.type,
      title: 'Componente hoja no puede tener hijos',
      message: `El componente "${node.type}" no es un contenedor de Jetpack Compose y no debe contener elementos hijos.`,
      suggestion: 'Mueve los elementos hijos a un Column, Row o Box.',
    });
  }

  // B. Text Binding
  if (node.type === 'Text' && p.textBinding) {
    const targetVar = varMap.get(p.textBinding);
    if (!targetVar) {
      issues.push({
        id: `unbound-text-${node.id}`,
        severity: 'error',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Variable de texto no encontrada',
        message: `El texto está vinculado a la variable "${p.textBinding}", que no existe en el UiState de ${screen.name}.`,
        suggestion: `Crea la variable "${p.textBinding}" en el Gestor de Estado o desvincula el campo.`,
      });
    }
  }

  // C. TextField Value Binding
  if (node.type === 'OutlinedTextField') {
    if (p.valueBinding) {
      const targetVar = varMap.get(p.valueBinding);
      if (!targetVar) {
        issues.push({
          id: `unbound-textfield-${node.id}`,
          severity: 'error',
          screenId: screen.id,
          screenName: screen.name,
          componentId: node.id,
          componentName: node.name || node.type,
          title: 'Campo de texto sin variable válida',
          message: `El campo está enlazado a "${p.valueBinding}", pero esa variable no está definida en ${screen.name}.`,
          suggestion: `Añade "${p.valueBinding}" (String) en Variables de Estado.`,
        });
      } else if (targetVar.type !== 'String') {
        issues.push({
          id: `invalid-type-textfield-${node.id}`,
          severity: 'warning',
          screenId: screen.id,
          screenName: screen.name,
          componentId: node.id,
          componentName: node.name || node.type,
          title: 'Tipo de variable inesperado',
          message: `El TextField está enlazado a "${p.valueBinding}" de tipo ${targetVar.type}. Se recomienda String.`,
        });
      }
    } else {
      issues.push({
        id: `empty-binding-textfield-${node.id}`,
        severity: 'warning',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'TextField sin binding',
        message: 'El campo de texto no tiene ninguna variable enlazada y el usuario no podrá guardar lo que escriba.',
        suggestion: 'Vincula una variable de tipo String en las propiedades del TextField.',
      });
    }
  }

  // D. RadioButton
  if (node.type === 'RadioButton') {
    if (!p.selectedBinding) {
      issues.push({
        id: `unbound-radio-${node.id}`,
        severity: 'warning',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'RadioButton sin variable de selección',
        message: 'Este RadioButton no tiene vinculada una variable de estado para marcar su selección.',
        suggestion: 'Asigna una variable String en selectedBinding.',
      });
    } else if (!varMap.has(p.selectedBinding)) {
      issues.push({
        id: `missing-radio-var-${node.id}`,
        severity: 'error',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Variable de RadioButton inexistente',
        message: `La variable "${p.selectedBinding}" asignada no existe en la pantalla.`,
      });
    }

    if (!p.radioValue) {
      issues.push({
        id: `empty-radio-val-${node.id}`,
        severity: 'warning',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Valor de RadioButton vacío',
        message: 'No has definido el valor (radioValue) que este botón asigna al seleccionarse.',
        suggestion: 'Escribe un valor como "opcion_1" en las propiedades.',
      });
    }
  }

  // E. Image
  if (node.type === 'Image') {
    if (!p.imageResource) {
      issues.push({
        id: `missing-img-res-${node.id}`,
        severity: 'warning',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Recurso drawable no especificado',
        message: 'La imagen no tiene un nombre de recurso en imageResource (por defecto usará sample_image).',
      });
    }
    if (!p.contentDescription) {
      issues.push({
        id: `missing-img-desc-${node.id}`,
        severity: 'info',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Falta contentDescription en Image',
        message: 'Para accesibilidad en Android (TalkBack) se recomienda incluir una descripción descriptiva.',
      });
    }
  }

  // F. Switch
  if (node.type === 'Switch' && p.checkedBinding) {
    const targetVar = varMap.get(p.checkedBinding);
    if (!targetVar) {
      issues.push({
        id: `unbound-switch-${node.id}`,
        severity: 'error',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'Switch sin variable válida',
        message: `El Switch está enlazado a "${p.checkedBinding}", pero esa variable no existe.`,
      });
    }
  }

  // G. LazyColumn
  if (node.type === 'LazyColumn') {
    if (p.itemsBinding) {
      const targetVar = varMap.get(p.itemsBinding);
      if (!targetVar) {
        issues.push({
          id: `unbound-lazycolumn-${node.id}`,
          severity: 'error',
          screenId: screen.id,
          screenName: screen.name,
          componentId: node.id,
          componentName: node.name || node.type,
          title: 'Lista de LazyColumn no encontrada',
          message: `El LazyColumn apunta a la variable "${p.itemsBinding}", que no existe en ${screen.name}.`,
        });
      }
    } else if (!node.children || node.children.length === 0) {
      issues.push({
        id: `empty-lazycolumn-${node.id}`,
        severity: 'info',
        screenId: screen.id,
        screenName: screen.name,
        componentId: node.id,
        componentName: node.name || node.type,
        title: 'LazyColumn sin elementos ni lista',
        message: 'Este LazyColumn no tiene elementos hijos estáticos ni una lista enlazada al UiState.',
        suggestion: 'Añade componentes dentro de él o selecciona una variable List<String>.',
      });
    }
  }

  // H. Logic Actions en onClick
  if (node.events?.onClick) {
    for (let i = 0; i < node.events.onClick.length; i++) {
      const action = node.events.onClick[i];
      if (action.type === 'NAVIGATE') {
        if (!existingRoutes.has(action.destinationRoute)) {
          issues.push({
            id: `invalid-nav-${node.id}-${i}`,
            severity: 'error',
            screenId: screen.id,
            screenName: screen.name,
            componentId: node.id,
            componentName: node.name || node.type,
            title: 'Destino de navegación inexistente',
            message: `El botón navega hacia la ruta "${action.destinationRoute}", pero ninguna pantalla la tiene asignada.`,
            suggestion: 'Verifica las rutas en el ScreenManager o corrige el destino.',
          });
        }
      } else if (action.type === 'INCREMENT_STATE' || action.type === 'DECREMENT_STATE') {
        const target = varMap.get(action.targetVar);
        if (!target) {
          issues.push({
            id: `missing-inc-var-${node.id}-${i}`,
            severity: 'error',
            screenId: screen.id,
            screenName: screen.name,
            componentId: node.id,
            componentName: node.name || node.type,
            title: 'Variable de mutación inexistente',
            message: `La acción intenta modificar "${action.targetVar}", pero no existe en ${screen.name}.`,
          });
        } else if (target.type !== 'Int' && target.type !== 'Float') {
          issues.push({
            id: `type-mismatch-inc-${node.id}-${i}`,
            severity: 'error',
            screenId: screen.id,
            screenName: screen.name,
            componentId: node.id,
            componentName: node.name || node.type,
            title: 'Tipo no numérico para incremento',
            message: `La acción de incremento se aplica sobre "${action.targetVar}" que es de tipo ${target.type}. Debe ser Int.`,
          });
        }
      }
    }
  }

  // Recursividad
  if (node.children) {
    for (const child of node.children) {
      lintNode(child, screen, varMap, existingRoutes, issues);
    }
  }
}
