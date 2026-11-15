import { describe, it, expect } from 'vitest';
import { parseKotlinCode } from './kotlinParser.ts';

describe('Kotlin Reverse Parser & Importer', () => {
  it('detecta y parsea una data class Kotlin', () => {
    const code = `
package com.example.app.models

data class Estudiante(
    val id: Int,
    val nombre: String,
    val nota: Double = 0.0
)
`;
    const result = parseKotlinCode(code);
    expect(result.success).toBe(true);
    expect(result.detectedType).toBe('class');
    expect(result.customFile).toBeDefined();
    expect(result.customFile?.name).toBe('Estudiante.kt');
    expect(result.customFile?.kind).toBe('data_class');
  });

  it('detecta y adapta una pantalla Composable completa con modificadores y variables', () => {
    const code = `
@Composable
fun DetalleScreen(
    navController: NavController,
    viewModel: DetalleViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Detalles del Perfil",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = uiState.nombreUsuario,
            onValueChange = { viewModel.updateNombreUsuario(it) },
            label = { Text("Nombre de usuario") }
        )
        Button(
            onClick = { navController.popBackStack() },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Guardar y Volver")
        }
    }
}
`;
    const result = parseKotlinCode(code);
    expect(result.success).toBe(true);
    expect(result.detectedType).toBe('screen');
    expect(result.screen).toBeDefined();

    const screen = result.screen!;
    expect(screen.name).toBe('DetalleScreen');
    expect(screen.route).toBe('detalle');
    expect(screen.rootComponent.type).toBe('Column');
    expect(screen.rootComponent.modifier.fillMaxSize).toBe(true);
    expect(screen.rootComponent.modifier.paddingAll).toBe(24);

    const children = screen.rootComponent.children || [];
    expect(children.length).toBe(4); // Text, Spacer, OutlinedTextField, Button
    expect(children[0].type).toBe('Text');
    expect(children[0].props.text).toBe('Detalles del Perfil');
    expect(children[0].props.fontSize).toBe(22);
    expect(children[0].props.fontWeight).toBe('Bold');

    expect(children[1].type).toBe('Spacer');
    expect(children[1].props.size).toBe(16);

    expect(children[2].type).toBe('OutlinedTextField');
    expect(children[2].props.valueBinding).toBe('nombreUsuario');
    expect(children[2].props.label).toBe('Nombre de usuario');

    expect(children[3].type).toBe('Button');
    expect(children[3].props.label).toBe('Guardar y Volver');

    // Variable nombreUsuario detectada
    expect(screen.stateVariables.some(v => v.name === 'nombreUsuario')).toBe(true);
  });

  it('detecta y parsea un enum class Kotlin', () => {
    const code = `
package com.example.app.models

enum class UserRole {
    ADMIN,
    EDITOR,
    VIEWER
}
`;
    const result = parseKotlinCode(code);
    expect(result.success).toBe(true);
    expect(result.detectedType).toBe('class');
    expect(result.customFile?.kind).toBe('enum');
    expect(result.customFile?.name).toBe('UserRole.kt');
  });

  it('detecta y parsea un singleton object Kotlin', () => {
    const code = `
package com.example.app.util

object AppConstants {
    const val API_BASE_URL = "https://api.example.com"
    const val TIMEOUT_SECONDS = 30L
}
`;
    const result = parseKotlinCode(code);
    expect(result.success).toBe(true);
    expect(result.detectedType).toBe('class');
    expect(result.customFile?.kind).toBe('class');
    expect(result.customFile?.name).toBe('AppConstants.kt');
  });

  it('parsea variables declaradas con remember { mutableStateOf(...) } en Composable', () => {
    const code = `
@Composable
fun CounterScreen() {
    var counter by remember { mutableStateOf(0) }
    var isEnabled by remember { mutableStateOf(true) }
    var title by remember { mutableStateOf("Mi Contador") }

    Column {
        Text(text = title)
    }
}
`;
    const result = parseKotlinCode(code);
    expect(result.success).toBe(true);
    expect(result.screen?.stateVariables.length).toBe(3);

    const counterVar = result.screen?.stateVariables.find(v => v.name === 'counter');
    expect(counterVar).toBeDefined();
    expect(counterVar?.type).toBe('Int');
    expect(counterVar?.initialValue).toBe(0);

    const boolVar = result.screen?.stateVariables.find(v => v.name === 'isEnabled');
    expect(boolVar).toBeDefined();
    expect(boolVar?.type).toBe('Boolean');
    expect(boolVar?.initialValue).toBe(true);

    const strVar = result.screen?.stateVariables.find(v => v.name === 'title');
    expect(strVar).toBeDefined();
    expect(strVar?.type).toBe('String');
    expect(strVar?.initialValue).toBe('Mi Contador');
  });
});
