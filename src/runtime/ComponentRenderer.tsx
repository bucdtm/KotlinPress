import React from 'react';
import { UIComponentNode } from '../core/ast/schema.ts';
import { useEditorStore } from '../editor/state/editorStore.ts';
import { RuntimeState, executeActions } from './actionExecutor.ts';

interface ComponentRendererProps {
  node: UIComponentNode;
  runtimeState: RuntimeState;
  setRuntimeState: (updater: (prev: RuntimeState) => RuntimeState) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  node,
  runtimeState,
  setRuntimeState,
}) => {
  const { selectedComponentId, selectComponent, interactiveMode } = useEditorStore();
  const isSelected = !interactiveMode && selectedComponentId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactiveMode) {
      if (node.events?.onClick) {
        executeActions(node.events.onClick, runtimeState, setRuntimeState);
      }
    } else {
      selectComponent(node.id);
    }
  };

  // Convertir Modifiers a CSS inline
  const style: React.CSSProperties = {
    padding: node.modifier.paddingAll !== undefined ? `${node.modifier.paddingAll}px` : undefined,
    paddingTop: node.modifier.paddingTop !== undefined ? `${node.modifier.paddingTop}px` : undefined,
    paddingBottom: node.modifier.paddingBottom !== undefined ? `${node.modifier.paddingBottom}px` : undefined,
    paddingLeft: node.modifier.paddingStart !== undefined ? `${node.modifier.paddingStart}px` : undefined,
    paddingRight: node.modifier.paddingEnd !== undefined ? `${node.modifier.paddingEnd}px` : undefined,
    borderRadius: node.modifier.cornerRadius !== undefined ? `${node.modifier.cornerRadius}px` : undefined,
    backgroundColor: node.modifier.backgroundColor || undefined,
  };

  let layoutClasses = '';
  if (node.modifier.fillMaxSize) layoutClasses += ' w-full h-full';
  else {
    if (node.modifier.fillMaxWidth) layoutClasses += ' w-full';
    if (node.modifier.fillMaxHeight) layoutClasses += ' h-full';
  }

  const selectionOutline = isSelected
    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 relative'
    : !interactiveMode
    ? 'hover:ring-1 hover:ring-cyan-500/50'
    : '';

  switch (node.type) {
    case 'Column': {
      let justify = 'justify-start';
      if (node.props.verticalArrangement === 'Center') justify = 'justify-center';
      if (node.props.verticalArrangement === 'Bottom') justify = 'justify-end';
      if (node.props.verticalArrangement === 'SpaceBetween') justify = 'justify-between';

      let align = 'items-start';
      if (node.props.horizontalAlignment === 'CenterHorizontally') align = 'items-center';
      if (node.props.horizontalAlignment === 'End') align = 'items-end';

      return (
        <div
          onClick={handleClick}
          style={style}
          className={`flex flex-col ${justify} ${align} ${layoutClasses} ${selectionOutline} transition-all`}
        >
          {isSelected && (
            <span className="absolute -top-3 left-2 bg-cyan-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow z-10">
              {node.name || node.type}
            </span>
          )}
          {node.children?.map(child => (
            <ComponentRenderer
              key={child.id}
              node={child}
              runtimeState={runtimeState}
              setRuntimeState={setRuntimeState}
            />
          ))}
        </div>
      );
    }

    case 'Row': {
      let justify = 'justify-start';
      if (node.props.horizontalArrangement === 'Center') justify = 'justify-center';
      if (node.props.horizontalArrangement === 'End') justify = 'justify-end';
      if (node.props.horizontalArrangement === 'SpaceBetween') justify = 'justify-between';

      let align = 'items-center';
      if (node.props.verticalAlignment === 'Top') align = 'items-start';
      if (node.props.verticalAlignment === 'Bottom') align = 'items-end';

      return (
        <div
          onClick={handleClick}
          style={style}
          className={`flex flex-row ${justify} ${align} ${layoutClasses} ${selectionOutline} transition-all`}
        >
          {isSelected && (
            <span className="absolute -top-3 left-2 bg-cyan-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow z-10">
              {node.name || node.type}
            </span>
          )}
          {node.children?.map(child => (
            <ComponentRenderer
              key={child.id}
              node={child}
              runtimeState={runtimeState}
              setRuntimeState={setRuntimeState}
            />
          ))}
        </div>
      );
    }

    case 'Card': {
      return (
        <div
          onClick={handleClick}
          style={style}
          className={`bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-md p-4 ${layoutClasses} ${selectionOutline} transition-all`}
        >
          {isSelected && (
            <span className="absolute -top-3 left-2 bg-cyan-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow z-10">
              Card
            </span>
          )}
          {node.children?.map(child => (
            <ComponentRenderer
              key={child.id}
              node={child}
              runtimeState={runtimeState}
              setRuntimeState={setRuntimeState}
            />
          ))}
        </div>
      );
    }

    case 'Text': {
      const displayText = node.props.textBinding
        ? runtimeState.values[node.props.textBinding] ?? ''
        : node.props.text ?? '';

      const fontWeight =
        node.props.fontWeight === 'Bold'
          ? 'font-bold'
          : node.props.fontWeight === 'Medium'
          ? 'font-medium'
          : 'font-normal';

      return (
        <p
          onClick={handleClick}
          style={{
            ...style,
            fontSize: node.props.fontSize ? `${node.props.fontSize}px` : undefined,
          }}
          className={`${fontWeight} text-slate-100 ${layoutClasses} ${selectionOutline} cursor-pointer select-none`}
        >
          {String(displayText)}
        </p>
      );
    }

    case 'Button': {
      return (
        <button
          onClick={handleClick}
          style={style}
          className={`bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-medium py-2.5 px-6 rounded-full shadow-lg transition-all ${layoutClasses} ${selectionOutline}`}
        >
          {node.props.label || 'Botón'}
        </button>
      );
    }

    case 'OutlinedButton': {
      return (
        <button
          onClick={handleClick}
          style={style}
          className={`border border-purple-400 text-purple-300 hover:bg-purple-950/40 active:scale-95 font-medium py-2.5 px-6 rounded-full transition-all ${layoutClasses} ${selectionOutline}`}
        >
          {node.props.label || 'Botón'}
        </button>
      );
    }

    case 'OutlinedTextField': {
      const binding = node.props.valueBinding;
      const currentVal = binding ? runtimeState.values[binding] ?? '' : '';

      return (
        <div onClick={handleClick} className={`relative my-1 ${layoutClasses} ${selectionOutline}`}>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            {node.props.label || 'Campo'}
          </label>
          <input
            type="text"
            value={currentVal}
            onChange={(e) => {
              if (binding) {
                setRuntimeState(prev => ({
                  ...prev,
                  values: { ...prev.values, [binding]: e.target.value },
                }));
              }
            }}
            placeholder={node.props.placeholder || ''}
            className="w-full bg-slate-900 border border-slate-600 focus:border-purple-400 rounded-lg px-3.5 py-2 text-sm text-white outline-none transition-colors"
          />
        </div>
      );
    }

    case 'Switch': {
      const binding = node.props.checkedBinding;
      const isChecked = binding ? Boolean(runtimeState.values[binding]) : false;

      return (
        <div onClick={handleClick} className={`inline-flex items-center cursor-pointer ${selectionOutline}`}>
          <div
            onClick={() => {
              if (interactiveMode && binding) {
                setRuntimeState(prev => ({
                  ...prev,
                  values: { ...prev.values, [binding]: !isChecked },
                }));
              }
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isChecked ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md" />
          </div>
        </div>
      );
    }

    case 'LazyColumn': {
      const binding = node.props.itemsBinding;
      const items: string[] = binding && Array.isArray(runtimeState.values[binding])
        ? runtimeState.values[binding]
        : [];

      return (
        <div
          onClick={handleClick}
          style={style}
          className={`flex flex-col gap-2 overflow-y-auto max-h-[360px] p-2 bg-slate-950/40 rounded-xl border border-slate-800 ${layoutClasses} ${selectionOutline}`}
        >
          {items.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-6">
              (Lista vacía en este momento)
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/90 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between text-sm shadow-sm"
              >
                <span>{item}</span>
                {interactiveMode && binding && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRuntimeState(prev => {
                        const nextList = [...items];
                        nextList.splice(idx, 1);
                        return {
                          ...prev,
                          values: { ...prev.values, [binding]: nextList },
                        };
                      });
                    }}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-950/40"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      );
    }

    case 'Spacer': {
      const size = node.props.size || 16;
      return <div onClick={handleClick} style={{ height: `${size}px` }} className={selectionOutline} />;
    }

    case 'Divider': {
      return <hr onClick={handleClick} className={`border-slate-700 my-2 ${selectionOutline}`} />;
    }

    default:
      return null;
  }
};
