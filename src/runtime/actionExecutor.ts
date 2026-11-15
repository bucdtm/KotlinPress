import { LogicAction } from '../core/ast/schema.ts';

export interface RuntimeState {
  values: Record<string, any>;
  navigationHistory: string[];
  currentRoute: string;
}

export function executeActions(
  actions: LogicAction[] | undefined,
  _state: RuntimeState,
  setState: (updater: (prev: RuntimeState) => RuntimeState) => void
): void {
  if (!actions || actions.length === 0) return;

  setState(prev => {
    const newValues = { ...prev.values };
    let newRoute = prev.currentRoute;
    const newHistory = [...prev.navigationHistory];

    for (const act of actions) {
      switch (act.type) {
        case 'INCREMENT_STATE': {
          const current = Number(newValues[act.targetVar] ?? 0);
          newValues[act.targetVar] = current + act.amount;
          break;
        }

        case 'DECREMENT_STATE': {
          const current = Number(newValues[act.targetVar] ?? 0);
          newValues[act.targetVar] = current - act.amount;
          break;
        }

        case 'SET_STATE': {
          if (act.isBinding) {
            newValues[act.targetVar] = newValues[String(act.value)];
          } else {
            newValues[act.targetVar] = act.value;
          }
          break;
        }

        case 'TOGGLE_BOOLEAN': {
          newValues[act.targetVar] = !newValues[act.targetVar];
          break;
        }

        case 'NAVIGATE': {
          newHistory.push(newRoute);
          newRoute = act.destinationRoute;
          break;
        }

        case 'NAVIGATE_BACK': {
          if (newHistory.length > 0) {
            newRoute = newHistory.pop()!;
          }
          break;
        }

        case 'APPEND_LIST': {
          const list = Array.isArray(newValues[act.targetListVar])
            ? [...newValues[act.targetListVar]]
            : [];

          let valToAdd = '';
          if (act.valueBinding) {
            valToAdd = String(newValues[act.valueBinding] || '').trim();
          } else if (act.staticValue) {
            valToAdd = act.staticValue;
          }

          if (valToAdd) {
            list.push(valToAdd);
            newValues[act.targetListVar] = list;
          }
          break;
        }

        case 'REMOVE_FROM_LIST': {
          const list = Array.isArray(newValues[act.targetListVar])
            ? [...newValues[act.targetListVar]]
            : [];
          const idx = Number(newValues[act.indexBinding] ?? 0);
          if (idx >= 0 && idx < list.length) {
            list.splice(idx, 1);
            newValues[act.targetListVar] = list;
          }
          break;
        }

        case 'RESET_STATE': {
          if (act.targetVar) {
            // Se restaura a valor por defecto según el tipo o 0/vacío
            if (typeof newValues[act.targetVar] === 'number') newValues[act.targetVar] = 0;
            else if (typeof newValues[act.targetVar] === 'boolean') newValues[act.targetVar] = false;
            else if (Array.isArray(newValues[act.targetVar])) newValues[act.targetVar] = [];
            else newValues[act.targetVar] = '';
          }
          break;
        }

        case 'COPY_STATE': {
          if (act.sourceVar && act.targetVar) {
            newValues[act.targetVar] = newValues[act.sourceVar];
          }
          break;
        }

        case 'CLEAR_STRING': {
          if (act.targetVar) {
            newValues[act.targetVar] = '';
          }
          break;
        }

        case 'CLEAR_LIST': {
          if (act.targetListVar) {
            newValues[act.targetListVar] = [];
          }
          break;
        }

        case 'SHOW_SNACKBAR': {
          if (act.message && typeof window !== 'undefined') {
            console.log(`[KotlinPress Toast]: ${act.message}`);
          }
          break;
        }

        case 'OPEN_URL': {
          if (act.url && typeof window !== 'undefined') {
            window.open(act.url, '_blank');
          }
          break;
        }
      }
    }

    return {
      values: newValues,
      navigationHistory: newHistory,
      currentRoute: newRoute,
    };
  });
}
