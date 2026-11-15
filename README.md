# KotlinPress 🚀
### Entorno Low-Code / No-Code Offline para Jetpack Compose (Kotlin)

**KotlinPress** es un entorno de desarrollo visual que te permite diseñar interfaces para Android, configurar lógica de eventos y estado, y obtener simultáneamente una **simulación interactiva en el navegador** y **código nativo de Jetpack Compose** listo para compilar, ejecutándose 100 % en el cliente (sin servidores, sin internet y sin dependencias de IA).

---

## 🌟 Características Principales

- **100 % Determinista y Offline:**  
  Tanto la vista previa interactiva como el código Kotlin descargable nacen exactamente del mismo **Árbol de Sintaxis Abstracta (AST) en JSON**. No requiere conexión a internet para funcionar.

- **Arquitectura Moderna de Android (Google Android Architecture Guidelines):**  
  Por cada pantalla diseñada, el transpilador genera código siguiendo el patrón **UDF (Unidirectional Data Flow)** y **State Hoisting**:
  - `*UiState.kt`: `data class` inmutable con el contrato del estado y valores por defecto.
  - `*ViewModel.kt`: `ViewModel` con `StateFlow` y métodos inmutables (`update { it.copy(...) }`).
  - `*Screen.kt`: Separación limpia en componente con estado (*Stateful Screen* con `collectAsStateWithLifecycle`) y componente visual puro (*Stateless Content*).

- **Simulador Móvil Interactivo en Tiempo Real:**  
  Chasis tipo smartphone con Material Design 3. Incluye dos modos de uso:
  - **Modo Editar:** Haz clic sobre cualquier componente para seleccionarlo e inspeccionar sus propiedades visuales y modificadores.
  - **Modo Play:** Interactúa con la app en memoria: pulsa botones, escribe en los campos de texto, comprueba la navegación entre pantallas y agrega elementos a listas dinámicas.

- **Generador de Proyecto Android Studio (.ZIP):**  
  Empaqueta con un solo clic una estructura estándar completa de Android Studio:
  - Gradle 8.5+ con Kotlin DSL (`build.gradle.kts`, `settings.gradle.kts`)
  - Version Catalog (`gradle/libs.versions.toml`) con Jetpack Compose BOM 2024+, Navigation Compose y Lifecycle Runtime
  - `AndroidManifest.xml`, recursos (`res/values/strings.xml`) y código fuente Kotlin bajo su paquete oficial.

- **Importación y Exportación de Proyectos JSON:**  
  Guarda tus proyectos como archivos `.json` en tu ordenador y cárgalos en cualquier momento.

---

## 🏗️ Arquitectura del Sistema

```
                  ┌────────────────────────┐
                  │    Editor Visual UI    │
                  │ (Paleta / Capas / Prop)│
                  └───────────┬────────────┘
                              │ Mutaciones
                              ▼
                  ┌────────────────────────┐
                  │   Árbol AST en JSON    │
                  │(Fuente Única de Verdad)│
                  └─────┬────────────┬─────┘
                        │            │
            ┌───────────┘            └───────────┐
            ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────┐
│  Simulador Web Runtime │          │  Transpilador Kotlin   │
│  (HTML/CSS Material 3) │          │  (UiState + ViewModel) │
└────────────────────────┘          └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │    Empaquetador ZIP    │
                                    │(Proyecto Android Listo)│
                                    └────────────────────────┘
```

### Componentes de Compose Soportados

| Componente | Configuración en AST | Equivalente en Jetpack Compose |
| :--- | :--- | :--- |
| **Column** | `verticalArrangement`, `horizontalAlignment` | `Column(modifier, verticalArrangement, horizontalAlignment)` |
| **Row** | `horizontalArrangement`, `verticalAlignment` | `Row(modifier, horizontalArrangement, verticalAlignment)` |
| **Card** | `elevation`, `cornerRadius`, `padding` | `Card(modifier, shape = RoundedCornerShape(...))` |
| **Box** | Alineación libre | `Box(modifier)` |
| **LazyColumn** | `itemsBinding` | `LazyColumn { items(uiState.miLista) { item -> ... } }` |
| **Text** | `text`, `textBinding`, `fontSize`, `fontWeight` | `Text(text = uiState.campo.toString(), fontSize = 16.sp)` |
| **Button** | `label`, `onClick` | `Button(onClick = { viewModel.incrementar() })` |
| **OutlinedButton** | `label`, `onClick` | `OutlinedButton(onClick = { ... })` |
| **OutlinedTextField** | `label`, `valueBinding` | `OutlinedTextField(value = uiState.texto, onValueChange = { ... })` |
| **Switch** | `checkedBinding` | `Switch(checked = uiState.activo, onCheckedChange = { ... })` |
| **Spacer** | `size` | `Spacer(modifier = Modifier.height(16.dp))` |
| **Divider** | `padding` | `HorizontalDivider(modifier = ...)` |

---

## 📂 Estructura del Código

```
KotlinPress/
├── src/
│   ├── core/
│   │   ├── ast/                     # Definición formal del AST y datos demo
│   │   │   ├── schema.ts
│   │   │   └── sampleApp.ts
│   │   ├── transpiler/              # Generador determinista de Kotlin
│   │   │   ├── kotlinGenerator.ts   # Orquestador general
│   │   │   ├── screenGenerator.ts   # Componentes Stateful y Stateless Compose
│   │   │   ├── uiStateGenerator.ts  # Generador de data classes UiState
│   │   │   ├── viewModelGenerator.ts# Generador de ViewModel con StateFlow
│   │   │   ├── actionTranspiler.ts  # Transpilación de eventos UDF
│   │   │   ├── navHostGenerator.ts  # NavHost y rutas de pantallas
│   │   │   ├── themeGenerator.ts    # Theme.kt, Color.kt y MainActivity.kt
│   │   │   └── modifierBuilder.ts   # Modificadores de Jetpack Compose
│   │   └── exporter/
│   │       ├── projectTemplate.ts   # Plantilla base Gradle y AndroidManifest
│   │       └── zipPackager.ts       # Generación de archivo .zip con JSZip
│   ├── runtime/                     # Intérprete y runtime web
│   │   ├── actionExecutor.ts        # Motor de ejecución de eventos en memoria
│   │   ├── ComponentRenderer.tsx    # Renderizador recursivo de componentes
│   │   └── PhoneSimulator.tsx       # Chasis de móvil con barra de estado Android
│   ├── editor/                      # Interfaz visual del constructor
│   │   ├── components/              # Paleta, Capas, Inspector de Propiedades
│   │   ├── codeview/                # Visor de código Kotlin en vivo con badges
│   │   └── state/                   # Store global con Zustand
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/bucdtm/KotlinPress.git
   cd KotlinPress
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:5173`.

4. **Ejecutar pruebas unitarias automatizadas:**
   ```bash
   npm test
   ```

5. **Construir para producción (PWA/Web estática):**
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vitejs.dev/)
- **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Empaquetado Offline:** [JSZip](https://stuk.github.io/jszip/) y [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- **Pruebas Automatizadas:** [Vitest](https://vitest.dev/)
- **Stack Android Generado:** Jetpack Compose (BOM 2024.12+), Material 3, Android Lifecycle Compose, Navigation Compose, Kotlin 2.0, Gradle 8.5+.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.
