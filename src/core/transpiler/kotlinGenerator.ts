import { AppAST, ScreenDefinition } from '../ast/schema.ts';
import { generateScreenKotlin } from './screenGenerator.ts';
import { generateUiStateKotlin } from './uiStateGenerator.ts';
import { generateViewModelKotlin } from './viewModelGenerator.ts';
import { generateNavHostKotlin } from './navHostGenerator.ts';
import { generateColorKotlin, generateShapeKotlin, generateThemeKotlin, generateMainActivityKotlin } from './themeGenerator.ts';

export interface GeneratedFile {
  path: string;       // Ruta relativa dentro del paquete (ej: "ui/screens/HomeScreen.kt")
  content: string;    // Código fuente en Kotlin
}

export interface ScreenGeneratedFiles {
  screenId: string;
  screenName: string;
  uiStateCode: string;
  viewModelCode: string;
  screenCode: string;
}

export interface TranspilationResult {
  screens: ScreenGeneratedFiles[];
  navHost: string;
  theme: { color: string; theme: string };
  mainActivity: string;
  allFiles: GeneratedFile[];
}

export function transpileAppToKotlin(ast: AppAST): TranspilationResult {
  const pkg = ast.appInfo.packageName;
  const appName = ast.appInfo.appName;

  const screenResults: ScreenGeneratedFiles[] = ast.screens.map(screen => {
    const uiStateCode = generateUiStateKotlin(screen, pkg);
    const viewModelCode = generateViewModelKotlin(screen, pkg);
    const screenCode = generateScreenKotlin(screen, pkg);

    return {
      screenId: screen.id,
      screenName: screen.name,
      uiStateCode,
      viewModelCode,
      screenCode,
    };
  });

  const navHostCode = generateNavHostKotlin(ast);
  const colorCode = generateColorKotlin(pkg, ast.theme);
  const shapeCode = generateShapeKotlin(pkg, ast.theme);
  const themeCode = generateThemeKotlin(pkg, appName);
  const mainActivityCode = generateMainActivityKotlin(pkg, appName, ast.theme);

  const allFiles: GeneratedFile[] = [
    { path: 'MainActivity.kt', content: mainActivityCode },
    { path: 'navigation/AppNavigation.kt', content: navHostCode },
    { path: 'ui/theme/Color.kt', content: colorCode },
    { path: 'ui/theme/Shape.kt', content: shapeCode },
    { path: 'ui/theme/Theme.kt', content: themeCode },
  ];

  // Añadir los 3 archivos por cada pantalla (UiState, ViewModel, Screen)
  for (const s of screenResults) {
    allFiles.push({
      path: `ui/screens/${s.screenName}UiState.kt`,
      content: s.uiStateCode,
    });
    allFiles.push({
      path: `ui/screens/${s.screenName}ViewModel.kt`,
      content: s.viewModelCode,
    });
    allFiles.push({
      path: `ui/screens/${s.screenName}.kt`,
      content: s.screenCode,
    });
  }

  return {
    screens: screenResults,
    navHost: navHostCode,
    theme: { color: colorCode, theme: themeCode },
    mainActivity: mainActivityCode,
    allFiles,
  };
}

export function transpileSingleScreen(screen: ScreenDefinition, packageName: string = 'com.example.app'): string {
  return generateScreenKotlin(screen, packageName);
}
