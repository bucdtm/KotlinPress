import { ScreenDefinition, StateVariable } from '../ast/schema.ts';

/**
 * Genera el ViewModel oficial de Android con StateFlow y funciones de mutación inmutables.
 */
export function generateViewModelKotlin(
  screen: ScreenDefinition,
  packageName: string
): string {
  const vmName = `${screen.name}ViewModel`;
  const stateClassName = `${screen.name}UiState`;
  const methods = generateViewModelMethods(screen.stateVariables, stateClassName);

  return `package ${packageName}.ui.screens

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * ViewModel que gestiona la lógica y el estado de ${screen.name}.
 * Expone un StateFlow inmutable para garantizar el flujo unidireccional de datos (UDF).
 */
class ${vmName} : ViewModel() {

    private val _uiState = MutableStateFlow(${stateClassName}())
    val uiState: StateFlow<${stateClassName}> = _uiState.asStateFlow()
${methods}
}
`;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateViewModelMethods(vars: StateVariable[], stateClassName: string): string {
  if (!vars || vars.length === 0) return '';

  const funcs: string[] = [];

  for (const v of vars) {
    const capName = capitalize(v.name);

    if (v.type === 'Int') {
      funcs.push(`
    fun increment${capName}(amount: Int = 1) {
        _uiState.update { currentState ->
            currentState.copy(${v.name} = currentState.${v.name} + amount)
        }
    }

    fun decrement${capName}(amount: Int = 1) {
        _uiState.update { currentState ->
            currentState.copy(${v.name} = currentState.${v.name} - amount)
        }
    }

    fun set${capName}(value: Int) {
        _uiState.update { it.copy(${v.name} = value) }
    }

    fun reset${capName}() {
        _uiState.update { it.copy(${v.name} = ${v.initialValue ?? 0}) }
    }`);
    } else if (v.type === 'Boolean') {
      funcs.push(`
    fun toggle${capName}() {
        _uiState.update { currentState ->
            currentState.copy(${v.name} = !currentState.${v.name})
        }
    }

    fun set${capName}(value: Boolean) {
        _uiState.update { it.copy(${v.name} = value) }
    }

    fun reset${capName}() {
        _uiState.update { it.copy(${v.name} = ${Boolean(v.initialValue)}) }
    }`);
    } else if (v.type === 'String') {
      funcs.push(`
    fun update${capName}(newValue: String) {
        _uiState.update { currentState ->
            currentState.copy(${v.name} = newValue)
        }
    }

    fun reset${capName}() {
        _uiState.update { it.copy(${v.name} = "${v.initialValue ?? ''}") }
    }`);
    } else if (v.type === 'List<String>') {
      const initItems = Array.isArray(v.initialValue)
        ? v.initialValue.map(x => `"${x}"`).join(', ')
        : '';

      funcs.push(`
    fun add${capName}Item(item: String) {
        if (item.isNotBlank()) {
            _uiState.update { currentState ->
                currentState.copy(${v.name} = currentState.${v.name} + item)
            }
        }
    }

    fun remove${capName}Item(index: Int) {
        _uiState.update { currentState ->
            val updated = currentState.${v.name}.toMutableList()
            if (index in updated.indices) {
                updated.removeAt(index)
            }
            currentState.copy(${v.name} = updated)
        }
    }

    fun clear${capName}() {
        _uiState.update { it.copy(${v.name} = emptyList()) }
    }

    fun reset${capName}() {
        _uiState.update { it.copy(${v.name} = listOf(${initItems})) }
    }`);
    }
  }

  funcs.push(`
    fun resetAll() {
        _uiState.value = ${stateClassName}()
    }`);

  return funcs.join('\n');
}
