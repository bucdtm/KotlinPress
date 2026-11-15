import { describe, it, expect } from 'vitest';
import { sampleAppAST } from '../ast/sampleApp.ts';
import { transpileAppToKotlin, transpileSingleScreen } from './kotlinGenerator.ts';
import { generateUiStateKotlin } from './uiStateGenerator.ts';
import { generateViewModelKotlin } from './viewModelGenerator.ts';

describe('Modern Android Architecture Transpiler (UiState + ViewModel + UDF)', () => {
  it('genera la triada de arquitectura moderna (UiState, ViewModel y Screen) por cada pantalla', () => {
    const result = transpileAppToKotlin(sampleAppAST);

    expect(result.screens).toHaveLength(2);
    // 5 base files (MainActivity, AppNavigation, Color, Shape, Theme) + 3 files per screen * 2 screens = 11 files
    expect(result.allFiles.length).toBe(11);

    const filePaths = result.allFiles.map(f => f.path);
    expect(filePaths).toContain('ui/theme/Color.kt');
    expect(filePaths).toContain('ui/theme/Shape.kt');
    expect(filePaths).toContain('ui/theme/Theme.kt');
    expect(filePaths).toContain('ui/screens/HomeScreenUiState.kt');
    expect(filePaths).toContain('ui/screens/HomeScreenViewModel.kt');
    expect(filePaths).toContain('ui/screens/HomeScreen.kt');
    expect(filePaths).toContain('ui/screens/TasksScreenUiState.kt');
    expect(filePaths).toContain('ui/screens/TasksScreenViewModel.kt');
    expect(filePaths).toContain('ui/screens/TasksScreen.kt');
  });

  it('genera data class UiState con valores inmutables por defecto', () => {
    const homeScreen = sampleAppAST.screens.find(s => s.id === 'home')!;
    const uiStateCode = generateUiStateKotlin(homeScreen, 'com.example.test');

    expect(uiStateCode).toContain('data class HomeScreenUiState(');
    expect(uiStateCode).toContain('val contador: Int = 0');
    expect(uiStateCode).toContain('val nombre: String = "Mundo"');
    expect(uiStateCode).toContain('val activo: Boolean = true');
  });

  it('genera ViewModel con StateFlow y funciones de mutación inmutables', () => {
    const homeScreen = sampleAppAST.screens.find(s => s.id === 'home')!;
    const vmCode = generateViewModelKotlin(homeScreen, 'com.example.test');

    expect(vmCode).toContain('class HomeScreenViewModel : ViewModel()');
    expect(vmCode).toContain('private val _uiState = MutableStateFlow(HomeScreenUiState())');
    expect(vmCode).toContain('val uiState: StateFlow<HomeScreenUiState> = _uiState.asStateFlow()');
    expect(vmCode).toContain('fun incrementContador(amount: Int = 1)');
    expect(vmCode).toContain('fun decrementContador(amount: Int = 1)');
    expect(vmCode).toContain('fun updateNombre(newValue: String)');
  });

  it('separa HomeScreen en componente Stateful y Stateless Content (State Hoisting)', () => {
    const homeScreen = sampleAppAST.screens.find(s => s.id === 'home')!;
    const screenCode = transpileSingleScreen(homeScreen, 'com.example.test');

    expect(screenCode).toContain('fun HomeScreen(');
    expect(screenCode).toContain('viewModel: HomeScreenViewModel = viewModel()');
    expect(screenCode).toContain('val uiState by viewModel.uiState.collectAsStateWithLifecycle()');
    expect(screenCode).toContain('fun HomeScreenContent(');
    expect(screenCode).toContain('uiState: HomeScreenUiState');
    expect(screenCode).toContain('viewModel.incrementContador(1)');
    expect(screenCode).toContain('viewModel.decrementContador(1)');
    expect(screenCode).toContain('navController.navigate("tasks")');
  });

  it('gestiona listas dinámicas con UDF en TasksScreen', () => {
    const tasksScreen = sampleAppAST.screens.find(s => s.id === 'tasks')!;
    const uiStateCode = generateUiStateKotlin(tasksScreen, 'com.example.test');
    const vmCode = generateViewModelKotlin(tasksScreen, 'com.example.test');
    const screenCode = transpileSingleScreen(tasksScreen, 'com.example.test');

    expect(uiStateCode).toContain('val tareas: List<String> = listOf("Aprender Kotlin", "Dominar Compose")');
    expect(vmCode).toContain('fun addTareasItem(item: String)');
    expect(screenCode).toContain('items(uiState.tareas) { item ->');
    expect(screenCode).toContain('viewModel.addTareasItem(uiState.nuevaTarea)');
  });
});
