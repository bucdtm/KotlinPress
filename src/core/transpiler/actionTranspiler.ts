import { LogicAction } from '../ast/schema.ts';

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Traduce una lista de acciones a llamadas de métodos del ViewModel o NavController
 * siguiendo el patrón oficial UDF (Unidirectional Data Flow) de Android.
 */
export function transpileActions(
  actions: LogicAction[] | undefined,
  indentLevel: number = 3
): string {
  if (!actions || actions.length === 0) return '';

  const indent = '    '.repeat(indentLevel);
  const lines: string[] = [];

  for (const act of actions) {
    switch (act.type) {
      case 'INCREMENT_STATE':
        lines.push(`${indent}viewModel.increment${capitalize(act.targetVar)}(${act.amount})`);
        break;

      case 'DECREMENT_STATE':
        lines.push(`${indent}viewModel.decrement${capitalize(act.targetVar)}(${act.amount})`);
        break;

      case 'SET_STATE':
        if (act.isBinding) {
          lines.push(`${indent}viewModel.update${capitalize(act.targetVar)}(uiState.${act.value})`);
        } else if (typeof act.value === 'string') {
          lines.push(`${indent}viewModel.update${capitalize(act.targetVar)}("${act.value}")`);
        } else {
          lines.push(`${indent}viewModel.set${capitalize(act.targetVar)}(${act.value})`);
        }
        break;

      case 'TOGGLE_BOOLEAN':
        lines.push(`${indent}viewModel.toggle${capitalize(act.targetVar)}()`);
        break;

      case 'RESET_STATE':
        if (act.targetVar) {
          lines.push(`${indent}viewModel.reset${capitalize(act.targetVar)}()`);
        } else {
          lines.push(`${indent}viewModel.resetAll()`);
        }
        break;

      case 'COPY_STATE':
        lines.push(`${indent}viewModel.update${capitalize(act.targetVar)}(uiState.${act.sourceVar})`);
        break;

      case 'CLEAR_STRING':
        lines.push(`${indent}viewModel.update${capitalize(act.targetVar)}("")`);
        break;

      case 'NAVIGATE':
        lines.push(`${indent}navController.navigate("${act.destinationRoute}")`);
        break;

      case 'NAVIGATE_BACK':
        lines.push(`${indent}navController.popBackStack()`);
        break;

      case 'APPEND_LIST':
        if (act.valueBinding) {
          lines.push(`${indent}viewModel.add${capitalize(act.targetListVar)}Item(uiState.${act.valueBinding})`);
        } else if (act.staticValue) {
          lines.push(`${indent}viewModel.add${capitalize(act.targetListVar)}Item("${act.staticValue}")`);
        }
        break;

      case 'REMOVE_FROM_LIST':
        lines.push(`${indent}viewModel.remove${capitalize(act.targetListVar)}Item(${act.indexBinding})`);
        break;

      case 'CLEAR_LIST':
        lines.push(`${indent}viewModel.clear${capitalize(act.targetListVar)}()`);
        break;

      case 'SHOW_SNACKBAR':
        lines.push(`${indent}android.widget.Toast.makeText(context, "${act.message}", android.widget.Toast.LENGTH_SHORT).show()`);
        break;

      case 'OPEN_URL':
        lines.push(`${indent}val browserIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("${act.url}"))`);
        lines.push(`${indent}context.startActivity(browserIntent)`);
        break;
    }
  }

  return lines.join('\n');
}
