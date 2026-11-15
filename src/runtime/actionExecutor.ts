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
      }
    }

    return {
      values: newValues,
      navigationHistory: newHistory,
      currentRoute: newRoute,
    };
  });
}
