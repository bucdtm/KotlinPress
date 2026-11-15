import { ScreenDefinition, StateVariable } from '../ast/schema.ts';

/**
 * Genera la data class inmutable UiState para la pantalla según las guías oficiales de Google Android.
 */
export function generateUiStateKotlin(
  screen: ScreenDefinition,
  packageName: string
): string {
  const stateClassName = `${screen.name}UiState`;
  const fields = generateUiStateFields(screen.stateVariables);

  return `package ${packageName}.ui.screens

/**
 * Estado inmutable de la interfaz de usuario (UiState) para ${screen.name}.
 * Sigue las guías de arquitectura recomendadas por Google (Unidirectional Data Flow).
 */
data class ${stateClassName}(
${fields}
)
`;
}

function generateUiStateFields(vars: StateVariable[]): string {
  if (!vars || vars.length === 0) {
    return '    val isLoading: Boolean = false';
  }

  return vars
    .map(v => {
      if (v.type === 'Int') {
        return `    val ${v.name}: Int = ${v.initialValue ?? 0}`;
      }
      if (v.type === 'Float') {
        return `    val ${v.name}: Float = ${v.initialValue ?? 0}f`;
      }
      if (v.type === 'Boolean') {
        return `    val ${v.name}: Boolean = ${v.initialValue ?? false}`;
      }
      if (v.type === 'List<String>') {
        const items = Array.isArray(v.initialValue)
          ? v.initialValue.map(i => `"${i}"`).join(', ')
          : '';
        return `    val ${v.name}: List<String> = listOf(${items})`;
      }
      if (v.type === 'List<Int>') {
        const items = Array.isArray(v.initialValue) ? v.initialValue.join(', ') : '';
        return `    val ${v.name}: List<Int> = listOf(${items})`;
      }
      return `    val ${v.name}: String = "${v.initialValue ?? ''}"`;
    })
    .join(',\n');
}
