import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { parseAndroidProjectFiles, parseAndroidProjectZip } from './projectParser.ts';

describe('Android Project Importer (ZIP & Folder Parser)', () => {
  it('importa y reconstruye un proyecto Android Studio desde archivos sueltos', () => {
    const files = [
      {
        path: 'settings.gradle.kts',
        content: 'rootProject.name = "TiendaOnline"\ninclude(":app")',
      },
      {
        path: 'app/build.gradle.kts',
        content: `
plugins {
    alias(libs.plugins.android.application)
}
android {
    namespace = "com.tienda.online"
    defaultConfig {
        applicationId = "com.tienda.online"
        versionCode = 2
        versionName = "2.0.1"
    }
}
`,
      },
      {
        path: 'app/src/main/res/values/strings.xml',
        content: `
<resources>
    <string name="app_name">Tienda Online</string>
    <string name="btn_comprar">Comprar Producto</string>
    <string name="lbl_precio">Precio: 99 €</string>
</resources>
`,
      },
      {
        path: 'app/src/main/java/com/tienda/online/models/Producto.kt',
        content: `
package com.tienda.online.models

data class Producto(
    val id: String,
    val nombre: String,
    val precio: Double,
    val enStock: Boolean = true
)
`,
      },
      {
        path: 'app/src/main/java/com/tienda/online/models/EstadoPedido.kt',
        content: `
package com.tienda.online.models

enum class EstadoPedido {
    PENDIENTE, ENVIADO, ENTREGADO
}
`,
      },
      {
        path: 'app/src/main/java/com/tienda/online/ui/screens/CatalogoScreen.kt',
        content: `
package com.tienda.online.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun CatalogoScreen() {
    var busqueda by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Catálogo de Productos", fontSize = 24.sp)
        OutlinedTextField(
            value = busqueda,
            onValueChange = { busqueda = it },
            label = { Text("Buscar...") }
        )
        Button(onClick = { /* Comprar */ }) {
            Text("Ver Detalles")
        }
    }
}
`,
      },
      {
        path: 'app/src/main/java/com/tienda/online/navigation/AppNavigation.kt',
        content: `
@Composable
fun AppNavigation() {
    NavHost(navController = rememberNavController(), startDestination = "catalogo") {
        composable("catalogo") { CatalogoScreen() }
    }
}
`,
      },
    ];

    const result = parseAndroidProjectFiles(files);
    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();

    const ast = result.ast!;
    expect(ast.appInfo.appName).toBe('TiendaOnline');
    expect(ast.appInfo.packageName).toBe('com.tienda.online');
    expect(ast.appInfo.versionCode).toBe(2);
    expect(ast.appInfo.versionName).toBe('2.0.1');

    // Pantalla detectada
    expect(ast.screens.length).toBe(1);
    expect(ast.screens[0].name).toBe('CatalogoScreen');
    expect(ast.screens[0].route).toBe('catalogo');
    expect(ast.startScreenId).toBe(ast.screens[0].id);

    // Clases / Modelos detectados
    expect(ast.customFiles).toBeDefined();
    expect(ast.customFiles?.length).toBe(2);
    expect(ast.customFiles?.some(c => c.name === 'Producto.kt' && c.kind === 'data_class')).toBe(true);
    expect(ast.customFiles?.some(c => c.name === 'EstadoPedido.kt' && c.kind === 'enum')).toBe(true);

    // Strings detectadas
    expect(result.summary.stringsCount).toBe(3);
    expect(result.summary.strings['btn_comprar']).toBe('Comprar Producto');
  });

  it('descomprime y parsea un archivo ZIP real de un proyecto Android Compose', async () => {
    const zip = new JSZip();
    zip.file('settings.gradle.kts', 'rootProject.name = "MiAppZip"');
    zip.file('app/build.gradle.kts', 'android { namespace = "com.ejemplo.zip" }');
    zip.file('app/src/main/res/values/strings.xml', '<resources><string name="app_name">Mi App Zip</string></resources>');
    zip.file(
      'app/src/main/java/com/ejemplo/zip/ui/HomeScreen.kt',
      `
@Composable
fun HomeScreen() {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("Pantalla Principal desde ZIP")
    }
}
`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const result = await parseAndroidProjectZip(zipBlob);

    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();
    expect(result.ast?.appInfo.appName).toBe('MiAppZip');
    expect(result.ast?.appInfo.packageName).toBe('com.ejemplo.zip');
    expect(result.ast?.screens.length).toBe(1);
    expect(result.ast?.screens[0].name).toBe('HomeScreen');
  });

  it('reconoce y restaura directamente un proyecto que contiene un AST JSON', () => {
    const mockAst = {
      schemaVersion: '1.0.0',
      appInfo: {
        appName: 'ProyectoExportado',
        packageName: 'com.exportado.test',
        versionCode: 1,
        versionName: '1.0.0',
      },
      theme: {
        primaryColor: '#7F52FF',
        isDark: true,
      },
      globalState: [],
      startScreenId: 'sc-1',
      screens: [
        {
          id: 'sc-1',
          name: 'Home',
          route: 'home',
          title: 'Inicio',
          stateVariables: [],
          rootComponent: {
            id: 'c-1',
            type: 'Column',
            name: 'Root',
            modifier: {},
            props: {},
            children: [],
          },
        },
      ],
      customFiles: [],
    };

    const files = [
      {
        path: 'ProyectoExportado_AST.json',
        content: JSON.stringify(mockAst),
      },
    ];

    const result = parseAndroidProjectFiles(files);
    expect(result.success).toBe(true);
    expect(result.ast?.appInfo.appName).toBe('ProyectoExportado');
    expect(result.ast?.appInfo.packageName).toBe('com.exportado.test');
    expect(result.ast?.screens.length).toBe(1);
  });

  it('analiza e importa correctamente el proyecto real ListaDeTareas', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = 'C:\\Users\\Admin\\AndroidStudioProjects\\ListaDeTareas\\app\\src\\main';

    if (!fs.existsSync(rootDir)) {
      console.warn('Directorio no encontrado, omitiendo test local');
      return;
    }

    function scanFiles(dir: string, base: string): { path: string; content: string }[] {
      let res: { path: string; content: string }[] = [];
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        const full = path.join(dir, e);
        if (fs.statSync(full).isDirectory()) {
          res = res.concat(scanFiles(full, base));
        } else {
          const rel = path.relative(base, full).replace(/\\/g, '/');
          res.push({ path: rel, content: fs.readFileSync(full, 'utf-8') });
        }
      }
      return res;
    }

    const files = scanFiles(rootDir, rootDir);
    const result = parseAndroidProjectFiles(files);

    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();
    console.log('--- RESULTADO PARSEO LISTADETAREAS ---');
    console.log('App:', result.ast?.appInfo.appName);
    console.log('Package:', result.ast?.appInfo.packageName);
    console.log('Screens:', result.ast?.screens.map(s => ({
      name: s.name,
      componentCount: s.rootComponent.children?.length,
      variables: s.stateVariables.map(v => v.name)
    })));
    console.log('Custom files:', result.ast?.customFiles?.map(c => ({ name: c.name, kind: c.kind })));
    console.log('Strings:', result.summary.strings);
    console.log('TareaScreen components:', JSON.stringify(result.ast?.screens[0].rootComponent.children?.map(c => ({
      type: c.type,
      name: c.name,
      props: c.props,
      children: c.children?.length
    })), null, 2));

    expect(result.ast?.appInfo.appName).toBe('ListaDeTareas');
    expect(result.ast?.appInfo.packageName).toBe('com.example.listadetareas');
    expect(result.ast?.screens.some(s => s.name === 'TareaScreen')).toBe(true);
    expect(result.ast?.customFiles?.some(c => c.name === 'Tarea.kt')).toBe(true);
    expect(result.ast?.customFiles?.some(c => c.name === 'TareaUIState.kt')).toBe(true);
  });
});
