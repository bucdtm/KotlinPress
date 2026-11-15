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
  const { ast, selectedComponentId, selectComponent, interactiveMode } = useEditorStore();
  const theme = ast.theme;
  const isSelected = !interactiveMode && selectedComponentId === node.id;

  let buttonRadiusClass = 'rounded-full';
  if (theme.buttonShape === 'sharp') buttonRadiusClass = 'rounded-[4px]';
  else if (theme.buttonShape === 'semi-rounded') buttonRadiusClass = 'rounded-[8px]';
  else if (theme.buttonShape === 'rounded') buttonRadiusClass = 'rounded-[14px]';

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
          style={{
            backgroundColor: theme.surfaceColor,
            color: theme.textColor || (theme.isDark ? '#E6E1E5' : '#1D1B20'),
            ...style,
          }}
          className={`border border-zinc-700/40 rounded-2xl p-4 shadow-sm ${layoutClasses} ${selectionOutline}`}
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

      let align = 'text-left';
      if (node.props.textAlign === 'Center') align = 'text-center';
      else if (node.props.textAlign === 'End') align = 'text-right';
      else if (node.props.textAlign === 'Justify') align = 'text-justify';

      let weight = 'font-normal';
      if (node.props.fontWeight === 'Medium') weight = 'font-medium';
      else if (node.props.fontWeight === 'SemiBold') weight = 'font-semibold';
      else if (node.props.fontWeight === 'Bold') weight = 'font-bold';
      else if (node.props.fontWeight === 'ExtraBold') weight = 'font-extrabold';

      const fontStyle = node.props.fontStyle === 'Italic' ? 'italic' : 'normal';
      let textDecoration = 'none';
      if (node.props.textDecoration === 'Underline') textDecoration = 'underline';
      else if (node.props.textDecoration === 'LineThrough') textDecoration = 'line-through';

      const widthClass = node.props.textAlign && !node.modifier.width ? 'w-full' : '';

      return (
        <p
          onClick={handleClick}
          style={{
            color: node.props.textColor || theme.textColor || (theme.isDark ? '#E6E1E5' : '#1D1B20'),
            fontSize: node.props.fontSize ? `${node.props.fontSize}px` : undefined,
            fontStyle,
            textDecoration,
            letterSpacing: node.props.letterSpacing ? `${node.props.letterSpacing}px` : undefined,
            lineHeight: node.props.lineHeight ? `${node.props.lineHeight}px` : undefined,
            ...style,
          }}
          className={`${weight} ${align} ${widthClass} ${layoutClasses} ${selectionOutline} cursor-pointer select-none leading-snug`}
        >
          {String(displayText)}
        </p>
      );
    }

    case 'Button': {
      return (
        <button
          onClick={handleClick}
          style={{
            backgroundColor: theme.primaryColor,
            color: '#FFFFFF',
            ...style,
          }}
          className={`hover:opacity-90 active:scale-[0.98] font-medium py-2.5 px-6 shadow-sm transition-all text-sm ${buttonRadiusClass} ${layoutClasses} ${selectionOutline}`}
        >
          {node.props.label || 'Botón'}
        </button>
      );
    }

    case 'OutlinedButton': {
      return (
        <button
          onClick={handleClick}
          style={{
            borderColor: theme.primaryColor,
            color: theme.primaryColor,
            ...style,
          }}
          className={`border hover:bg-black/10 active:scale-[0.98] font-medium py-2 px-5 transition-all text-sm ${buttonRadiusClass} ${layoutClasses} ${selectionOutline}`}
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
          <label
            style={{ color: theme.primaryColor }}
            className="block text-[11px] font-medium mb-1"
          >
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
            style={{
              backgroundColor: theme.surfaceColor,
              color: theme.textColor || (theme.isDark ? '#FFFFFF' : '#1D1B20'),
            }}
            className="w-full border border-zinc-700/80 focus:border-[#7f52ff] rounded-md px-3 py-1.5 text-xs outline-none transition-colors"
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
            style={{
              backgroundColor: isChecked ? theme.primaryColor : undefined,
            }}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
              !isChecked ? 'bg-zinc-700' : ''
            } ${isChecked ? 'justify-end' : 'justify-start'}`}
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
