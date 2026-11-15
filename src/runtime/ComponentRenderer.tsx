import React from 'react';
import { ImageIcon } from 'lucide-react';
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

    case 'Box': {
      let alignClass = 'items-center justify-center';
      if (node.props.contentAlignment === 'TopStart') alignClass = 'items-start justify-start';
      else if (node.props.contentAlignment === 'TopCenter') alignClass = 'items-start justify-center';
      else if (node.props.contentAlignment === 'BottomCenter') alignClass = 'items-end justify-center';
      else if (node.props.contentAlignment === 'BottomEnd') alignClass = 'items-end justify-end';

      const hasChildren = node.children && node.children.length > 0;
      const emptyBoxHint = !hasChildren && !interactiveMode;

      return (
        <div
          onClick={handleClick}
          style={{
            ...style,
            width: node.modifier.width ? `${node.modifier.width}px` : undefined,
            height: node.modifier.height ? `${node.modifier.height}px` : undefined,
          }}
          className={`relative flex ${alignClass} ${
            emptyBoxHint ? 'min-h-[70px] min-w-[70px] border border-dashed border-zinc-700/70 rounded-lg p-2 bg-zinc-900/20' : ''
          } ${layoutClasses} ${selectionOutline} transition-all`}
        >
          {isSelected && (
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
              {node.name || 'Box'}
            </span>
          )}
          {emptyBoxHint && (
            <span className="text-[10px] text-zinc-500 font-mono select-none">
              (Box vacío)
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

    case 'RadioButton': {
      const binding = node.props.selectedBinding;
      const radioVal = node.props.radioValue || 'Opción';
      const isRadioSelected = Boolean(binding && runtimeState.values[binding] === radioVal);

      const handleRadioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (interactiveMode && binding) {
          setRuntimeState(prev => ({
            ...prev,
            values: { ...prev.values, [binding]: radioVal },
          }));
        } else if (!interactiveMode) {
          selectComponent(node.id);
        }
      };

      return (
        <div
          onClick={handleRadioClick}
          style={style}
          className={`flex items-center gap-2.5 py-1 px-1 cursor-pointer select-none ${layoutClasses} ${selectionOutline}`}
        >
          <div
            style={{
              borderColor: isRadioSelected ? theme.primaryColor : '#71717a',
            }}
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
          >
            {isRadioSelected && (
              <div
                style={{ backgroundColor: theme.primaryColor }}
                className="w-2.5 h-2.5 rounded-full"
              />
            )}
          </div>
          {node.props.label && (
            <span
              style={{
                color: theme.textColor || (theme.isDark ? '#E6E1E5' : '#1D1B20'),
                fontSize: node.props.fontSize ? `${node.props.fontSize}px` : '13px',
              }}
              className="text-xs font-normal"
            >
              {node.props.label}
            </span>
          )}
        </div>
      );
    }

    case 'Image': {
      const resName = node.props.imageResource || 'sample_image';
      const previewUrl = node.props.imageUrl;
      const width = node.modifier.width ? `${node.modifier.width}px` : '110px';
      const height = node.modifier.height ? `${node.modifier.height}px` : '110px';

      return (
        <div
          onClick={handleClick}
          style={{
            ...style,
            width,
            height,
          }}
          className={`relative overflow-hidden flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl ${layoutClasses} ${selectionOutline}`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={node.props.contentDescription || 'Imagen'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center">
              <ImageIcon className="w-8 h-8 text-[#7f52ff]/80 mb-1.5" strokeWidth={1.5} />
              <span className="text-[10px] font-mono font-medium text-zinc-300">
                R.drawable.{resName}
              </span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate max-w-[90px]">
                {node.props.contentDescription || 'Imagen'}
              </span>
            </div>
          )}
          {isSelected && (
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
              Image
            </span>
          )}
        </div>
      );
    }

    case 'LazyColumn': {
      const binding = node.props.itemsBinding;
      const boundItems: string[] = binding && Array.isArray(runtimeState.values[binding])
        ? runtimeState.values[binding]
        : [];
      const hasChildren = node.children && node.children.length > 0;
      const isEmpty = !hasChildren && (!binding || boundItems.length === 0);

      return (
        <div
          onClick={handleClick}
          style={style}
          className={`flex flex-col gap-2 overflow-y-auto max-h-[360px] p-2 bg-[#0c0c0f]/80 rounded-xl border border-zinc-800/80 ${layoutClasses} ${selectionOutline}`}
        >
          {isSelected && (
            <span className="absolute -top-2.5 left-2 bg-[#7f52ff] text-[9px] font-mono font-medium text-white px-1.5 py-0.2 rounded z-10 shadow-sm">
              LazyColumn
            </span>
          )}

          {isEmpty && (
            <div className="text-center text-xs text-zinc-500 py-6 font-mono">
              (LazyColumn vacío - añade elementos o enlaza una variable)
            </div>
          )}

          {/* Renderizar hijos estáticos (Text, Button, Card, etc.) */}
          {node.children?.map(child => (
            <div key={child.id} className="w-full">
              <ComponentRenderer
                node={child}
                runtimeState={runtimeState}
                setRuntimeState={setRuntimeState}
              />
            </div>
          ))}

          {/* Renderizar items dinámicos enlazados al UiState */}
          {boundItems.map((item, idx) => (
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
                      const nextList = [...boundItems];
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
          ))}
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
