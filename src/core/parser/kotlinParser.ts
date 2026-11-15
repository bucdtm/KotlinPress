import {
  ScreenDefinition,
  UIComponentNode,
  CustomKotlinFile,
  StateVariable,
  ModifierConfig,
  ComponentProps,
  ComponentType,
  isContainerComponent,
} from '../ast/schema.ts';

export interface ImportResult {
  success: boolean;
  message: string;
  screen?: ScreenDefinition;
  customFile?: CustomKotlinFile;
  detectedType: 'screen' | 'class' | 'unknown';
}

/**
 * Analiza un bloque de código Kotlin e identifica si se trata de un Composable
 * para generar una pantalla visual o de una clase/modelo Kotlin.
 */
export function parseKotlinCode(rawCode: string): ImportResult {
  if (!rawCode || rawCode.trim() === '') {
    return {
      success: false,
      message: 'El código proporcionado está vacío.',
      detectedType: 'unknown',
    };
  }

  const code = rawCode.trim();

  // 1. Detectar si es una clase o modelo Kotlin (data class, enum, class, object)
  const isDataClass = /data\s+class\s+(\w+)/.test(code);
  const isEnumClass = /enum\s+class\s+(\w+)/.test(code);
  const isRegularClass = /(?:class|object)\s+(\w+)/.test(code);

  const hasComposable = /@Composable/.test(code) || /fun\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?(?:Column|Row|Box|Card|LazyColumn|Text|Button)/.test(code);

  // Si tiene Composable, priorizamos la creación de una pantalla interactiva
  if (hasComposable) {
    try {
      const screen = parseComposableToScreen(code);
      return {
        success: true,
        message: `Se ha analizado y adaptado la pantalla "${screen.name}" con ${countNodes(screen.rootComponent)} componentes y ${screen.stateVariables.length} variables.`,
        screen,
        detectedType: 'screen',
      };
    } catch (err: any) {
      console.warn('Error en parseComposableToScreen, intentando fallback como clase:', err);
    }
  }

  // 2. Si es una definición de clase Kotlin
  if (isDataClass || isEnumClass || isRegularClass) {
    const customFile = parseClassDefinition(code);
    return {
      success: true,
      message: `Se ha registrado el archivo Kotlin "${customFile.name}" (${customFile.kind}) en el proyecto.`,
      customFile,
      detectedType: 'class',
    };
  }

  // 3. Intento de parseo de fragmento Composable libre (ej: solo un Column o Card)
  try {
    const rootNode = parseComposeElement(code);
    if (rootNode) {
      const screen: ScreenDefinition = {
        id: `imported-screen-${Date.now()}`,
        name: 'ImportedScreen',
        route: 'imported',
        title: 'Pantalla Importada',
        stateVariables: [],
        rootComponent: rootNode.type === 'Column' || rootNode.type === 'Box'
          ? rootNode
          : {
              id: `root-${Date.now()}`,
              type: 'Column',
              name: 'Contenedor Principal',
              modifier: { fillMaxSize: true, paddingAll: 16 },
              props: {},
              children: [rootNode],
            },
      };

      return {
        success: true,
        message: 'Se ha adaptado el fragmento Compose como una nueva pantalla.',
        screen,
        detectedType: 'screen',
      };
    }
  } catch (err: any) {
    // Continuar al fallback
  }

  return {
    success: false,
    message: 'No se reconoció una estructura Composable ni una clase Kotlin válida.',
    detectedType: 'unknown',
  };
}

export function parseClassDefinition(code: string, customName?: string, packageSuffix?: string): CustomKotlinFile {
  let kind: CustomKotlinFile['kind'] = 'class';
  let className = customName || 'CustomClass';

  const dataMatch = code.match(/data\s+class\s+(\w+)/);
  const enumMatch = code.match(/enum\s+class\s+(\w+)/);
  const classMatch = code.match(/(?:class|object)\s+(\w+)/);

  if (dataMatch) {
    kind = 'data_class';
    if (!customName) className = dataMatch[1];
  } else if (enumMatch) {
    kind = 'enum';
    if (!customName) className = enumMatch[1];
  } else if (classMatch) {
    kind = 'class';
    if (!customName) className = classMatch[1];
  }

  // Si customName viene con extensión .kt, quitarla para el nombre de clase
  const cleanName = className.replace(/\.kt$/, '');

  return {
    id: `custom-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: `${cleanName}.kt`,
    packageSuffix: packageSuffix || 'models',
    content: code,
    kind,
  };
}

/**
 * Extrae todas las funciones @Composable visuales de un archivo Kotlin
 */
export function extractComposableFunctions(code: string): { name: string; code: string }[] {
  const results: { name: string; code: string }[] = [];
  const regex = /@Composable\s+(?:inline\s+)?fun\s+([A-Z]\w*)\s*\([^)]*\)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const fnName = match[1];
    // Ignorar funciones de vista previa de Android Studio o temas
    if (fnName.endsWith('Preview') || fnName.endsWith('Theme')) continue;

    const startIndex = match.index;
    const braceStart = code.indexOf('{', match.index + match[0].length - 1);
    if (braceStart === -1) continue;

    let depth = 1;
    let i = braceStart + 1;
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
      i++;
    }

    if (depth === 0) {
      const fullFnCode = code.slice(startIndex, i);
      results.push({ name: fnName, code: fullFnCode });
    }
  }

  return results;
}

/**
 * Extrae la pantalla, variables de estado y la jerarquía de UI a partir de un Composable
 */
export function parseComposableToScreen(code: string, customName?: string): ScreenDefinition {
  // 1. Nombre de la pantalla
  let screenName = customName || 'ImportedScreen';
  const funMatch = code.match(/fun\s+([A-Z]\w+)\s*\(/);
  if (funMatch && !customName) {
    screenName = funMatch[1];
    if (screenName.endsWith('Content')) {
      screenName = screenName.replace(/Content$/, '');
    }
  }

  const route = screenName
    .replace(/Screen$/, '')
    .toLowerCase() || 'imported';

  // 2. Extraer variables de estado
  const stateVariables: StateVariable[] = extractStateVariables(code);

  // 3. Extraer el cuerpo visual del Composable
  let bodyCode = code;
  const bodyStart = code.indexOf('{');
  const bodyEnd = code.lastIndexOf('}');
  if (bodyStart !== -1 && bodyEnd > bodyStart) {
    bodyCode = code.slice(bodyStart + 1, bodyEnd);
  }

  // 4. Parsear el árbol de componentes Compose
  const children = parseComposeChildren(bodyCode);

  let rootComponent: UIComponentNode;
  if (children.length === 1 && isContainerComponent(children[0].type)) {
    rootComponent = children[0];
  } else {
    rootComponent = {
      id: `root-${Date.now()}`,
      type: 'Column',
      name: 'Contenedor Principal',
      modifier: { fillMaxSize: true, paddingAll: 16 },
      props: { verticalArrangement: 'Top', horizontalAlignment: 'Start' },
      children,
    };
  }

  return {
    id: `screen-${Date.now()}`,
    name: screenName,
    route,
    title: screenName.replace(/([A-Z])/g, ' $1').trim(),
    stateVariables,
    rootComponent,
  };
}

function extractStateVariables(code: string): StateVariable[] {
  const vars: StateVariable[] = [];
  const foundNames = new Set<string>();

  // A. remember { mutableStateOf(...) }
  const rememberRegex = /(?:var|val)\s+(\w+)\s*(?:by|=)\s*remember\s*\{\s*mutableStateOf\s*\(([^)]*)\)\s*\}/g;
  let rMatch: RegExpExecArray | null;
  while ((rMatch = rememberRegex.exec(code)) !== null) {
    const varName = rMatch[1];
    const rawVal = rMatch[2].trim();

    if (!foundNames.has(varName)) {
      foundNames.add(varName);
      let type: StateVariable['type'] = 'String';
      let initialValue: any = rawVal.replace(/"/g, '');

      if (/^-?\d+$/.test(rawVal)) {
        type = 'Int';
        initialValue = parseInt(rawVal, 10);
      } else if (/^-?\d+\.\d+f?$/.test(rawVal)) {
        type = 'Float';
        initialValue = parseFloat(rawVal);
      } else if (rawVal === 'true' || rawVal === 'false') {
        type = 'Boolean';
        initialValue = rawVal === 'true';
      } else if (/listOf|emptyList/.test(rawVal)) {
        type = 'List<String>';
        initialValue = [];
      }

      vars.push({
        id: `var-${Date.now()}-${vars.length}`,
        name: varName,
        type,
        initialValue,
      });
    }
  }

  // B. Enlaces a uiState.<variable>
  const uiStateRegex = /uiState\.(\w+)/g;
  let uMatch: RegExpExecArray | null;
  while ((uMatch = uiStateRegex.exec(code)) !== null) {
    const varName = uMatch[1];
    if (!foundNames.has(varName)) {
      foundNames.add(varName);

      // Determinar tipo por el contexto de uso
      let type: StateVariable['type'] = 'String';
      let initialValue: any = '';

      if (new RegExp(`increment${varName}|decrement${varName}`, 'i').test(code)) {
        type = 'Int';
        initialValue = 0;
      } else if (new RegExp(`toggle${varName}|checked\\s*=\\s*uiState\\.${varName}`, 'i').test(code)) {
        type = 'Boolean';
        initialValue = false;
      } else if (new RegExp(`items\\(uiState\\.${varName}\\)`, 'i').test(code)) {
        type = 'List<String>';
        initialValue = ['Elemento 1', 'Elemento 2'];
      }

      vars.push({
        id: `var-${Date.now()}-${vars.length}`,
        name: varName,
        type,
        initialValue,
      });
    }
  }

  return vars;
}

const KNOWN_COMPONENTS = [
  'Column',
  'Row',
  'Box',
  'Card',
  'LazyColumn',
  'Text',
  'OutlinedTextField',
  'TextField',
  'OutlinedButton',
  'Button',
  'RadioButton',
  'Switch',
  'Checkbox',
  'Image',
  'Spacer',
  'HorizontalDivider',
  'Divider',
];

/**
 * Parsea una secuencia de hijos Compose dentro de un bloque
 */
function parseComposeChildren(block: string): UIComponentNode[] {
  const nodes: UIComponentNode[] = [];
  let i = 0;

  while (i < block.length) {
    // Saltar espacios en blanco
    while (i < block.length && /\s/.test(block[i])) i++;
    if (i >= block.length) break;

    // Buscar si la posición coincide con algún componente conocido
    let matchedType: string | null = null;
    for (const comp of KNOWN_COMPONENTS) {
      if (block.startsWith(comp, i)) {
        // Verificar que no sea un prefijo de otra palabra (ej: TextStyle no es Text)
        const nextChar = block[i + comp.length];
        if (nextChar === '(' || nextChar === '{' || /\s/.test(nextChar)) {
          matchedType = comp;
          break;
        }
      }
    }

    if (!matchedType) {
      // Avanzar al siguiente carácter
      i++;
      continue;
    }

    // Avanzar el índice después del nombre del componente
    i += matchedType.length;
    while (i < block.length && /\s/.test(block[i])) i++;

    // 1. Extraer argumentos entre paréntesis () si existen
    let argsString = '';
    if (block[i] === '(') {
      const startParen = i;
      i = findMatchingClose(block, i, '(', ')');
      argsString = block.slice(startParen + 1, i);
      i++; // saltar el ')'
    }

    while (i < block.length && /\s/.test(block[i])) i++;

    // 2. Extraer bloque lambda de hijos {} si existe
    let bodyString = '';
    if (block[i] === '{') {
      const startBrace = i;
      i = findMatchingClose(block, i, '{', '}');
      bodyString = block.slice(startBrace + 1, i);
      i++; // saltar el '}'
    }

    // Normalizar tipos
    let normalizedType: ComponentType = matchedType as any;
    if (matchedType === 'TextField') normalizedType = 'OutlinedTextField';
    if (matchedType === 'HorizontalDivider') normalizedType = 'Divider';

    const node = createNodeFromParsed(normalizedType, argsString, bodyString);
    nodes.push(node);
  }

  return nodes;
}

function parseComposeElement(code: string): UIComponentNode | null {
  const children = parseComposeChildren(code);
  return children.length > 0 ? children[0] : null;
}

function findMatchingClose(str: string, openIndex: number, openChar: string, closeChar: string): number {
  let depth = 1;
  let inString = false;
  let quoteChar = '';

  for (let idx = openIndex + 1; idx < str.length; idx++) {
    const ch = str[idx];

    // Control de cadenas para ignorar llaves o paréntesis dentro de strings "..."
    if ((ch === '"' || ch === "'") && str[idx - 1] !== '\\') {
      if (!inString) {
        inString = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inString = false;
      }
      continue;
    }

    if (!inString) {
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) return idx;
      }
    }
  }

  return str.length;
}

function createNodeFromParsed(
  type: ComponentType,
  args: string,
  body: string
): UIComponentNode {
  const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const modifier = parseModifier(args);
  const props = parseProps(type, args, body);

  const node: UIComponentNode = {
    id,
    type,
    name: type,
    modifier,
    props,
  };

  if (isContainerComponent(type)) {
    // Parsear hijos anidados recursivamente
    node.children = parseComposeChildren(body);
  } else if ((type === 'Button' || type === 'OutlinedButton') && body.trim()) {
    // En Compose los botones suelen tener Text("...") dentro del bloque lambda {}
    const textMatch = body.match(/Text\(\s*(?:text\s*=\s*)?(?:"([^"]*)"|stringResource\([^)]*R\.string\.(\w+)[^)]*\)|uiState\.(\w+))/);
    if (textMatch) {
      node.props.label = textMatch[1] || textMatch[2] || textMatch[3] || 'Botón';
    }
  }

  return node;
}

function parseModifier(args: string): ModifierConfig {
  const mod: ModifierConfig = {};
  if (!args) return mod;

  if (args.includes('fillMaxSize')) mod.fillMaxSize = true;
  if (args.includes('fillMaxWidth')) mod.fillMaxWidth = true;
  if (args.includes('fillMaxHeight')) mod.fillMaxHeight = true;

  // padding general: .padding(16.dp) o .padding(all = 16.dp)
  const padAll = args.match(/\.padding\(\s*(?:all\s*=\s*)?(\d+)(?:\.dp)?\s*\)/);
  if (padAll) mod.paddingAll = parseInt(padAll[1], 10);

  // padding horizontal y vertical
  const padHV = args.match(/\.padding\(\s*horizontal\s*=\s*(\d+)(?:\.dp)?,\s*vertical\s*=\s*(\d+)(?:\.dp)?\s*\)/);
  if (padHV) {
    mod.paddingHorizontal = parseInt(padHV[1], 10);
    mod.paddingVertical = parseInt(padHV[2], 10);
  }

  // padding individual
  const padTop = args.match(/top\s*=\s*(\d+)(?:\.dp)?/);
  if (padTop) mod.paddingTop = parseInt(padTop[1], 10);

  const padBottom = args.match(/bottom\s*=\s*(\d+)(?:\.dp)?/);
  if (padBottom) mod.paddingBottom = parseInt(padBottom[1], 10);

  const padStart = args.match(/start\s*=\s*(\d+)(?:\.dp)?/);
  if (padStart) mod.paddingStart = parseInt(padStart[1], 10);

  const padEnd = args.match(/end\s*=\s*(\d+)(?:\.dp)?/);
  if (padEnd) mod.paddingEnd = parseInt(padEnd[1], 10);

  // corner radius: RoundedCornerShape(8.dp)
  const radius = args.match(/RoundedCornerShape\(\s*(\d+)(?:\.dp)?\s*\)/);
  if (radius) mod.cornerRadius = parseInt(radius[1], 10);

  // size / width / height
  const sizeMatch = args.match(/\.size\(\s*(\d+)(?:\.dp)?\s*\)/);
  if (sizeMatch) {
    mod.width = parseInt(sizeMatch[1], 10);
    mod.height = parseInt(sizeMatch[1], 10);
  }

  const widthMatch = args.match(/\.width\(\s*(\d+)(?:\.dp)?\s*\)/);
  if (widthMatch) mod.width = parseInt(widthMatch[1], 10);

  const heightMatch = args.match(/\.height\(\s*(\d+)(?:\.dp)?\s*\)/);
  if (heightMatch) mod.height = parseInt(heightMatch[1], 10);

  return mod;
}

function parseProps(type: ComponentType, args: string, body: string): ComponentProps {
  const p: ComponentProps = {};

  // Text
  if (type === 'Text') {
    const textLit = args.match(/text\s*=\s*"([^"]*)"/);
    const textPlain = args.match(/Text\(\s*"([^"]*)"/);
    const textBinding = args.match(/text\s*=\s*uiState\.(\w+)/);
    const strRes = args.match(/text\s*=\s*stringResource\(R\.string\.(\w+)\)/);

    if (textBinding) p.textBinding = textBinding[1];
    else if (textLit) p.text = textLit[1];
    else if (textPlain) p.text = textPlain[1];
    else if (strRes) p.text = strRes[1].replace(/_/g, ' ');

    const fontSize = args.match(/fontSize\s*=\s*(\d+)(?:\.sp)?/);
    if (fontSize) p.fontSize = parseInt(fontSize[1], 10);

    const fontWeight = args.match(/fontWeight\s*=\s*FontWeight\.(\w+)/);
    if (fontWeight) p.fontWeight = fontWeight[1] as any;

    if (args.includes('FontStyle.Italic')) p.fontStyle = 'Italic';

    const textAlign = args.match(/textAlign\s*=\s*TextAlign\.(\w+)/);
    if (textAlign) p.textAlign = textAlign[1] as any;

    if (args.includes('TextDecoration.Underline')) p.textDecoration = 'Underline';
    if (args.includes('TextDecoration.LineThrough')) p.textDecoration = 'LineThrough';
  }

  // TextField
  if (type === 'OutlinedTextField') {
    const valBind = args.match(/value\s*=\s*uiState\.(\w+)/);
    if (valBind) p.valueBinding = valBind[1];

    const labelMatch = args.match(/label\s*=\s*\{\s*Text\("([^"]*)"\)\s*\}/);
    if (labelMatch) p.label = labelMatch[1];

    const hintMatch = args.match(/placeholder\s*=\s*\{\s*Text\("([^"]*)"\)\s*\}/);
    if (hintMatch) p.placeholder = hintMatch[1];
  }

  // RadioButton
  if (type === 'RadioButton') {
    const selBind = args.match(/uiState\.(\w+)\s*==\s*"([^"]*)"/);
    if (selBind) {
      p.selectedBinding = selBind[1];
      p.radioValue = selBind[2];
    }
  }

  // Switch / Checkbox
  if (type === 'Switch' || type === 'Checkbox') {
    const checkBind = args.match(/checked\s*=\s*uiState\.(\w+)/);
    if (checkBind) p.checkedBinding = checkBind[1];
  }

  // Image
  if (type === 'Image') {
    const res = args.match(/R\.drawable\.(\w+)/);
    if (res) p.imageResource = res[1];

    const desc = args.match(/contentDescription\s*=\s*"([^"]*)"/);
    if (desc) p.contentDescription = desc[1];
  }

  // Spacer
  if (type === 'Spacer') {
    const height = args.match(/Modifier\.height\(\s*(\d+)(?:\.dp)?\s*\)/);
    if (height) p.size = parseInt(height[1], 10);
  }

  // Layout Alignments
  const vArr = args.match(/verticalArrangement\s*=\s*Arrangement\.(\w+)/);
  if (vArr) p.verticalArrangement = vArr[1] as any;

  const hAlign = args.match(/horizontalAlignment\s*=\s*Alignment\.(\w+)/);
  if (hAlign) p.horizontalAlignment = hAlign[1] as any;

  const hArr = args.match(/horizontalArrangement\s*=\s*Arrangement\.(\w+)/);
  if (hArr) p.horizontalArrangement = hArr[1] as any;

  const vAlign = args.match(/verticalAlignment\s*=\s*Alignment\.(\w+)/);
  if (vAlign) p.verticalAlignment = vAlign[1] as any;

  const contentAlign = args.match(/contentAlignment\s*=\s*Alignment\.(\w+)/);
  if (contentAlign) p.contentAlignment = contentAlign[1] as any;

  // LazyColumn
  if (type === 'LazyColumn') {
    const itemsBind = body.match(/items\(\s*uiState\.(\w+)\s*\)/);
    if (itemsBind) p.itemsBinding = itemsBind[1];
  }

  return p;
}

export function countNodes(node: UIComponentNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}
