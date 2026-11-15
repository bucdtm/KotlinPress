import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../editor/state/editorStore.ts';
import { ComponentRenderer } from './ComponentRenderer.tsx';
import { RuntimeState } from './actionExecutor.ts';
import { Play, MousePointer, RotateCcw, Wifi, BatteryCharging } from 'lucide-react';

export const PhoneSimulator: React.FC = () => {
  const { ast, selectedScreenId, selectScreen, interactiveMode, setInteractiveMode } = useEditorStore();

  const currentScreen = ast.screens.find(s => s.id === selectedScreenId) || ast.screens[0];

  // Inicializar estado local del simulador con los valores iniciales de la pantalla
  const getInitialStateValues = () => {
    const values: Record<string, any> = {};
    if (currentScreen) {
      for (const v of currentScreen.stateVariables) {
        values[v.name] = Array.isArray(v.initialValue) ? [...v.initialValue] : v.initialValue;
      }
    }
    return values;
  };

  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    values: getInitialStateValues(),
    navigationHistory: [],
    currentRoute: currentScreen?.route || 'home',
  });

  // Si la pantalla seleccionada en el editor cambia o se navega en el simulador
  useEffect(() => {
    setRuntimeState(prev => ({
      ...prev,
      values: { ...prev.values, ...getInitialStateValues() },
      currentRoute: currentScreen?.route || 'home',
    }));
  }, [selectedScreenId]);

  // Si el simulador navega a otra ruta vía action
  useEffect(() => {
    if (runtimeState.currentRoute && currentScreen && runtimeState.currentRoute !== currentScreen.route) {
      const targetScreen = ast.screens.find(s => s.route === runtimeState.currentRoute);
      if (targetScreen) {
        selectScreen(targetScreen.id);
      }
    }
  }, [runtimeState.currentRoute]);

  const handleReset = () => {
    setRuntimeState({
      values: getInitialStateValues(),
      navigationHistory: [],
      currentRoute: currentScreen?.route || 'home',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 select-none">
      {/* Barra superior de control del simulador */}
      <div className="flex items-center gap-3 mb-4 bg-slate-800/90 border border-slate-700/80 rounded-full px-4 py-1.5 shadow-lg">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-slate-700">
          <button
            onClick={() => setInteractiveMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              !interactiveMode
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Seleccionar y editar componentes"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => setInteractiveMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              interactiveMode
                ? 'bg-emerald-600 text-white shadow animate-pulse'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Probar botones y eventos en vivo"
          >
            <Play className="w-3.5 h-3.5" />
            Play
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition"
          title="Reiniciar estado de la pantalla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </button>
      </div>

      {/* Chasis del Smartphone Android */}
      <div className="relative w-[370px] h-[720px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700 flex flex-col overflow-hidden">
        {/* Cámara frontal punch-hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-30 border border-slate-800 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>

        {/* Pantalla del dispositivo */}
        <div className="relative flex-1 bg-slate-900 rounded-[34px] overflow-hidden flex flex-col">
          {/* Barra de Estado Android */}
          <div className="h-8 flex items-center justify-between px-6 pt-1 text-[11px] font-medium text-slate-400 select-none z-20">
            <span>12:30</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <span>5G</span>
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Área de renderizado Composable */}
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {currentScreen ? (
              <ComponentRenderer
                node={currentScreen.rootComponent}
                runtimeState={runtimeState}
                setRuntimeState={setRuntimeState}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Sin pantalla activa
              </div>
            )}
          </div>

          {/* Barra de navegación gestual de Android */}
          <div className="h-5 flex items-center justify-center pb-1">
            <div className="w-28 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
