import JSZip from 'jszip';
import { AppAST, ScreenDefinition, CustomKotlinFile, AppThemeConfig } from '../ast/schema.ts';
import {
  extractComposableFunctions,
  parseComposableToScreen,
  parseClassDefinition,
  countNodes,
} from './kotlinParser.ts';

export interface ProjectFileInput {
  path: string;
  content: string;
}

export interface ScreenSummaryInfo {
  id: string;
  name: string;
  route: string;
  nodeCount: number;
  variableCount: number;
}

export interface ClassSummaryInfo {
  name: string;
  kind: string;
  packageSuffix?: string;
}

export interface ProjectImportResult {
  success: boolean;
  message: string;
  ast?: AppAST;
  summary: {
    appName: string;
    packageName: string;
    screensCount: number;
    classesCount: number;
    stringsCount: number;
    screens: ScreenSummaryInfo[];
    classes: ClassSummaryInfo[];
    strings: Record<string, string>;
  };
  warnings?: string[];
}

/**
 * Lee y descomprime un archivo ZIP de proyecto Android o KotlinPress
 */
export async function parseAndroidProjectZip(
  fileOrBuffer: Blob | File | ArrayBuffer | Uint8Array
): Promise<ProjectImportResult> {
  try {
    const zip = await JSZip.loadAsync(fileOrBuffer);
    const files: ProjectFileInput[] = [];

    const fileEntries: { path: string; file: JSZip.JSZipObject }[] = [];
    zip.forEach((relativePath, file) => {
      if (!file.dir) {
        fileEntries.push({ path: relativePath, file });
      }
    });

    for (const entry of fileEntries) {
      const lower = entry.path.toLowerCase();
      // Solo leer archivos relevantes de texto/código/configuración
      if (
        lower.endsWith('.kt') ||
        lower.endsWith('.kts') ||
        lower.endsWith('.xml') ||
        lower.endsWith('.json') ||
        lower.endsWith('.properties') ||
        lower.endsWith('.gradle')
      ) {
        const text = await entry.file.async('string');
        files.push({
          path: entry.path.replace(/\\/g, '/'),
          content: text,
        });
      }
    }

    if (files.length === 0) {
      return {
        success: false,
        message: 'El archivo ZIP no contiene archivos de código Kotlin o configuración válidos.',
        summary: createEmptySummary(),
      };
    }

    return parseAndroidProjectFiles(files);
  } catch (err: any) {
    return {
      success: false,
      message: `Error al descomprimir el proyecto: ${err?.message || 'Archivo ZIP no válido'}`,
      summary: createEmptySummary(),
    };
  }
}

/**
 * Analiza un conjunto de archivos de un proyecto Android Studio y reconstruye el AST completo
 */
export function parseAndroidProjectFiles(files: ProjectFileInput[]): ProjectImportResult {
  const warnings: string[] = [];

  // 1. Verificación prioritaria: ¿Existe un archivo AST JSON de KotlinPress?
  const astJsonFile = files.find(f => {
    const p = f.path.toLowerCase();
    return p.endsWith('_ast.json') || p.endsWith('/ast.json') || p === 'ast.json' || p.endsWith('kotlinpress.json');
  });

  if (astJsonFile) {
    try {
      const parsedAst = JSON.parse(astJsonFile.content) as AppAST;
      if (parsedAst && parsedAst.schemaVersion === '1.0.0' && Array.isArray(parsedAst.screens)) {
        return {
          success: true,
          message: `Proyecto importado con éxito desde la especificación AST de KotlinPress (${parsedAst.appInfo.appName}).`,
          ast: parsedAst,
          summary: generateSummaryFromAST(parsedAst),
        };
      }
    } catch {
      warnings.push('Se detectó un archivo AST.json pero no se pudo leer. Se continuará con el análisis inverso de código Kotlin.');
    }
  }

  // 2. Extraer metadatos de la aplicación (appName, packageName, versión)
  let appName = 'AndroidApp';
  let packageName = 'com.example.app';
  let versionCode = 1;
  let versionName = '1.0.0';

  // Buscar en settings.gradle(.kts)
  const settingsFile = files.find(f => f.path.includes('settings.gradle'));
  if (settingsFile) {
    const nameMatch = settingsFile.content.match(/rootProject\.name\s*=\s*["']([^"']+)["']/);
    if (nameMatch && nameMatch[1]) {
      appName = nameMatch[1].trim();
    }
  }

  // Buscar en build.gradle(.kts)
  const buildGradleFile = files.find(f => f.path.includes('app/build.gradle') || f.path.includes('build.gradle.kts'));
  if (buildGradleFile) {
    const nsMatch = buildGradleFile.content.match(/namespace\s*=\s*["']([^"']+)["']/);
    const appIdMatch = buildGradleFile.content.match(/applicationId\s*=\s*["']([^"']+)["']/);
    const vcMatch = buildGradleFile.content.match(/versionCode\s*=\s*(\d+)/);
    const vnMatch = buildGradleFile.content.match(/versionName\s*=\s*["']([^"']+)["']/);

    if (nsMatch && nsMatch[1]) packageName = nsMatch[1].trim();
    else if (appIdMatch && appIdMatch[1]) packageName = appIdMatch[1].trim();

    if (vcMatch && vcMatch[1]) versionCode = parseInt(vcMatch[1], 10);
    if (vnMatch && vnMatch[1]) versionName = vnMatch[1].trim();
  }

  // Buscar en AndroidManifest.xml
  const manifestFile = files.find(f => f.path.includes('AndroidManifest.xml'));
  if (manifestFile) {
    const pkgMatch = manifestFile.content.match(/package\s*=\s*["']([^"']+)["']/);
    if (pkgMatch && pkgMatch[1] && packageName === 'com.example.app') {
      packageName = pkgMatch[1].trim();
    }
    const labelMatch = manifestFile.content.match(/android:label\s*=\s*["']([^"']+)["']/);
    if (labelMatch && labelMatch[1] && !labelMatch[1].startsWith('@string') && appName === 'AndroidApp') {
      appName = labelMatch[1].trim();
    }
  }

  // 3. Extraer recursos de texto (strings.xml)
  const stringsMap: Record<string, string> = {};
  const stringsFile = files.find(f => f.path.endsWith('strings.xml'));
  if (stringsFile) {
    const stringRegex = /<string\s+name=["']([^"']+)["']>([\s\S]*?)<\/string>/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = stringRegex.exec(stringsFile.content)) !== null) {
      const key = sMatch[1];
      const val = sMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
      stringsMap[key] = val;
    }

    if (stringsMap['app_name'] && appName === 'AndroidApp') {
      appName = stringsMap['app_name'];
    }
  }

  // 4. Extraer tema y colores si existen
  const themeConfig: AppThemeConfig = {
    primaryColor: '#7F52FF',
    secondaryColor: '#9F7DFF',
    tertiaryColor: '#EFB8C8',
    surfaceColor: '#121215',
    backgroundColor: '#09090B',
    textColor: '#F4F4F5',
    isDark: true,
  };

  const colorsFile = files.find(f => f.path.endsWith('Color.kt') || f.path.endsWith('colors.xml'));
  if (colorsFile) {
    const hexColors = colorsFile.content.match(/0x(?:[0-9a-fA-F]{2})?([0-9a-fA-F]{6})/g) ||
                      colorsFile.content.match(/#([0-9a-fA-F]{6})/g);
    if (hexColors && hexColors.length >= 2) {
      const formatHex = (h: string) => {
        if (h.startsWith('0x')) {
          return '#' + h.slice(-6);
        }
        return h;
      };
      themeConfig.primaryColor = formatHex(hexColors[0]);
      themeConfig.secondaryColor = formatHex(hexColors[1]);
    }
  }

  // 5. Detectar destino inicial de navegación
  let detectedStartDestination: string | null = null;
  const navFile = files.find(f => f.path.includes('Nav') || f.content.includes('NavHost'));
  if (navFile) {
    const startMatch = navFile.content.match(/startDestination\s*=\s*["']([^"']+)["']/);
    if (startMatch && startMatch[1]) {
      detectedStartDestination = startMatch[1].trim();
    }
  }

  // 6. Analizar archivos Kotlin para extraer Pantallas Composable y Clases/Modelos
  const screens: ScreenDefinition[] = [];
  const customFiles: CustomKotlinFile[] = [];
  const seenScreenRoutes = new Set<string>();

  const kotlinFiles = files.filter(f => {
    const p = f.path;
    return (
      p.endsWith('.kt') &&
      !p.includes('/test/') &&
      !p.includes('/androidTest/') &&
      !p.endsWith('Test.kt')
    );
  });

  for (const kf of kotlinFiles) {
    const content = kf.content;
    const baseFileName = kf.path.split('/').pop() || 'File.kt';

    // A. Detectar funciones @Composable (Pantallas)
    const isNavFile = /Navigation|NavGraph|NavHost/i.test(baseFileName);
    const hasComposable = /@Composable/.test(content);
    if (hasComposable && !baseFileName.includes('Theme') && !baseFileName.includes('Type') && !isNavFile) {
      const composables = extractComposableFunctions(content);

      if (composables.length > 0) {
        for (const comp of composables) {
          // Ignorar funciones de navegación como AppNavigation o NavGraph
          if (/NavHost|Navigation|NavGraph/.test(comp.name) || comp.code.includes('NavHost(')) {
            continue;
          }
          try {
            const screen = parseComposableToScreen(comp.code, comp.name);
            let finalRoute = screen.route;
            let counter = 1;
            while (seenScreenRoutes.has(finalRoute)) {
              finalRoute = `${screen.route}_${counter++}`;
            }
            screen.route = finalRoute;
            seenScreenRoutes.add(finalRoute);
            screens.push(screen);
          } catch (err) {
            warnings.push(`No se pudo parsear el Composable ${comp.name} en ${baseFileName}.`);
          }
        }
      } else {
        // Fallback: parsear el archivo completo como Composable si tiene elementos Compose y no es navegación
        if (/fun\s+([A-Z]\w+Screen|[A-Z]\w+)\s*\(/.test(content) && !content.includes('NavHost(')) {
          try {
            const screen = parseComposableToScreen(content);
            if (!seenScreenRoutes.has(screen.route)) {
              seenScreenRoutes.add(screen.route);
              screens.push(screen);
            }
          } catch {
            // Continuar
          }
        }
      }
    }

    // B. Detectar definiciones de clases, data class, enums o utilidades
    const isDataClass = /data\s+class\s+(\w+)/.test(content);
    const isEnumClass = /enum\s+class\s+(\w+)/.test(content);
    const isRegularClass = /(?:class|object)\s+(\w+)/.test(content);

    // Si está en carpeta models/, data/, util/ o es una clase sin Composable visual
    const isInModelFolder = /models|data|domain|dto|util/i.test(kf.path);
    if ((isDataClass || isEnumClass || (isRegularClass && isInModelFolder)) && !hasComposable) {
      const pkgMatch = content.match(/package\s+[\w.]+\.(\w+)/);
      const pkgSuffix = pkgMatch ? pkgMatch[1] : (isInModelFolder ? 'models' : undefined);

      const customFile = parseClassDefinition(content, baseFileName, pkgSuffix);
      // Evitar duplicados por nombre
      if (!customFiles.some(cf => cf.name === customFile.name)) {
        customFiles.push(customFile);
      }
    }
  }

  // 7. Si no se detectó ninguna pantalla Compose, crear una pantalla inicial por defecto
  if (screens.length === 0) {
    screens.push({
      id: 'screen-main',
      name: 'MainScreen',
      route: 'main',
      title: appName,
      stateVariables: [],
      rootComponent: {
        id: 'root-main',
        type: 'Column',
        name: 'Contenedor Principal',
        modifier: { fillMaxSize: true, paddingAll: 16 },
        props: { verticalArrangement: 'Center', horizontalAlignment: 'CenterHorizontally' },
        children: [
          {
            id: 'txt-welcome',
            type: 'Text',
            name: 'Título de Bienvenida',
            modifier: {},
            props: { text: `Bienvenido a ${appName}`, fontSize: 20, fontWeight: 'Bold' },
          },
        ],
      },
    });
    warnings.push('No se encontraron funciones @Composable visuales explícitas; se ha creado una pantalla principal inicial.');
  }

  // 8. Determinar pantalla inicial (startScreenId)
  let startScreenId = screens[0].id;
  if (detectedStartDestination) {
    const matched = screens.find(s => s.route === detectedStartDestination || s.name.toLowerCase() === detectedStartDestination?.toLowerCase());
    if (matched) {
      startScreenId = matched.id;
    }
  }

  // 9. Construir el AST final de la aplicación
  const ast: AppAST = {
    schemaVersion: '1.0.0',
    appInfo: {
      appName,
      packageName,
      versionCode,
      versionName,
    },
    theme: themeConfig,
    globalState: [],
    startScreenId,
    screens,
    customFiles,
  };

  const summary = generateSummaryFromAST(ast, stringsMap);

  return {
    success: true,
    message: `Proyecto "${appName}" importado con éxito: ${screens.length} ${screens.length === 1 ? 'pantalla' : 'pantallas'}, ${customFiles.length} ${customFiles.length === 1 ? 'clase/modelo' : 'clases/modelos'}.`,
    ast,
    summary,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function generateSummaryFromAST(ast: AppAST, stringsMap: Record<string, string> = {}): ProjectImportResult['summary'] {
  const screens: ScreenSummaryInfo[] = ast.screens.map(s => ({
    id: s.id,
    name: s.name,
    route: s.route,
    nodeCount: countNodes(s.rootComponent),
    variableCount: s.stateVariables.length,
  }));

  const classes: ClassSummaryInfo[] = (ast.customFiles || []).map(c => ({
    name: c.name,
    kind: c.kind,
    packageSuffix: c.packageSuffix,
  }));

  return {
    appName: ast.appInfo.appName,
    packageName: ast.appInfo.packageName,
    screensCount: screens.length,
    classesCount: classes.length,
    stringsCount: Object.keys(stringsMap).length,
    screens,
    classes,
    strings: stringsMap,
  };
}

function createEmptySummary(): ProjectImportResult['summary'] {
  return {
    appName: 'Desconocido',
    packageName: 'com.example.app',
    screensCount: 0,
    classesCount: 0,
    stringsCount: 0,
    screens: [],
    classes: [],
    strings: {},
  };
}
