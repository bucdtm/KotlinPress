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
    ? 'ring-1 ring-[#7f52ff] ring-offset-1 ring-offset-[#101014] relative'
    : !interactiveMode
    ? 'hover:ring-1 hover:ring-zinc-600'
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
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
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
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
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
          className={`bg-[#1c1c22] border border-zinc-700/60 rounded-2xl p-4 shadow-sm ${layoutClasses} ${selectionOutline}`}
        >
          {isSelected && (
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
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
          className={`${fontWeight} text-zinc-100 ${layoutClasses} ${selectionOutline} cursor-pointer select-none leading-snug`}
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
          className={`bg-[#6750a4] hover:bg-[#7963b6] active:scale-[0.98] text-white font-medium py-2.5 px-6 rounded-full shadow-sm transition-all text-sm ${layoutClasses} ${selectionOutline}`}
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
          className={`border border-[#79747e] text-[#d0bcff] hover:bg-[#6750a4]/10 active:scale-[0.98] font-medium py-2 px-5 rounded-full transition-all text-sm ${layoutClasses} ${selectionOutline}`}
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
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
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
            className="w-full bg-[#16161b] border border-zinc-700 focus:border-[#7f52ff] rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors"
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
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
              isChecked ? 'bg-[#6750a4] justify-end' : 'bg-zinc-700 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-sm" />
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
          className={`flex flex-col gap-1.5 overflow-y-auto max-h-[340px] p-2 bg-[#0c0c0f] rounded-xl border border-zinc-800 ${layoutClasses} ${selectionOutline}`}
        >
          {items.length === 0 ? (
            <div className="text-center text-xs text-zinc-600 py-6">
              (Lista vacía)
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#18181d] border border-zinc-800/80 px-3 py-2 rounded-lg flex items-center justify-between text-xs"
              >
                <span className="text-zinc-200">{item}</span>
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
                    className="text-zinc-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800"
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
      return <hr onClick={handleClick} className={`border-zinc-800 my-2 ${selectionOutline}`} />;
    }

    default:
      return null;
  }
};
