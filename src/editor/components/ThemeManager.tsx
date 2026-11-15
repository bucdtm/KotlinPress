import React from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { THEME_PRESETS } from '../../core/ast/themePresets.ts';
import {
  ButtonShapeType,
  FontFamilyType,
  BackgroundType,
} from '../../core/ast/schema.ts';
import { Palette, Sun, Moon, Sparkles, Check } from 'lucide-react';

export const ThemeManager: React.FC = () => {
  const { ast, updateTheme, applyThemePreset } = useEditorStore();
  const theme = ast.theme;

  return (
    <div className="flex flex-col gap-4 p-3 text-xs overflow-y-auto">
      {/* 1. Presets de Temas */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 px-1 text-zinc-400 font-medium text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-[#7f52ff]" />
          <span>Preajustes de Tema</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {THEME_PRESETS.map(preset => {
            const isCurrent =
              theme.primaryColor.toLowerCase() === preset.config.primaryColor.toLowerCase() &&
              theme.backgroundColor.toLowerCase() === preset.config.backgroundColor.toLowerCase();

            return (
              <button
                key={preset.id}
                onClick={() => applyThemePreset(preset.id)}
                className={`flex flex-col gap-1.5 p-2 rounded-md border text-left transition-colors ${
                  isCurrent
                    ? 'bg-zinc-800 border-[#7f52ff] text-zinc-100 shadow-sm'
                    : 'bg-[#18181c] hover:bg-[#202025] border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-[11px] truncate">{preset.name}</span>
                  {isCurrent && <Check className="w-3 h-3 text-[#7f52ff] shrink-0" />}
                </div>

                {/* Muestras de color en miniatura */}
                <div className="flex items-center gap-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.config.primaryColor }}
                    title="Primario"
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.config.surfaceColor }}
                    title="Superficie"
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.config.backgroundColor }}
                    title="Fondo"
                  />
                  <span className="text-[9px] text-zinc-500 font-mono ml-auto">
                    {preset.config.isDark ? 'Dark' : 'Light'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* 2. Modo Claro / Oscuro */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-400 px-1">Modo de Apariencia</span>
        <div className="grid grid-cols-2 gap-1.5 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
          <button
            onClick={() => updateTheme({ isDark: false })}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors ${
              !theme.isDark
                ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Claro</span>
          </button>
          <button
            onClick={() => updateTheme({ isDark: true })}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors ${
              theme.isDark
                ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-[#7f52ff]" />
            <span>Oscuro</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* 3. Paleta de Colores de la App */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 px-1 text-zinc-400 font-medium text-[11px]">
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          <span>Colores Material 3</span>
        </div>

        <div className="flex flex-col gap-2 bg-[#18181c] border border-zinc-800 p-2.5 rounded-md">
          {/* Color Primario */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Primario</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-16 bg-[#0f0f12] border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* Color Secundario */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Secundario</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                className="w-16 bg-[#0f0f12] border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* Color de Fondo */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Fondo</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                className="w-16 bg-[#0f0f12] border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* Color de Superficie */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Superficie (Cards)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.surfaceColor}
                onChange={(e) => updateTheme({ surfaceColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={theme.surfaceColor}
                onChange={(e) => updateTheme({ surfaceColor: e.target.value })}
                className="w-16 bg-[#0f0f12] border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 uppercase"
              />
            </div>
          </div>

          {/* Color de Texto */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Texto Principal</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.textColor || (theme.isDark ? '#E6E1E5' : '#1D1B20')}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={theme.textColor || (theme.isDark ? '#E6E1E5' : '#1D1B20')}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-16 bg-[#0f0f12] border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* 4. Tipo de Fondo */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-400 px-1">Efecto del Fondo</span>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'solid', label: 'Sólido' },
            { id: 'gradient', label: 'Degradado' },
            { id: 'surface', label: 'Superficie' },
          ].map(bg => (
            <button
              key={bg.id}
              onClick={() => updateTheme({ backgroundType: bg.id as BackgroundType })}
              className={`py-1.5 px-2 rounded text-[11px] border transition-colors ${
                (theme.backgroundType || 'solid') === bg.id
                  ? 'bg-zinc-800 border-[#7f52ff] text-zinc-100 font-medium'
                  : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {bg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* 5. Estilo y Esquinas de Botones */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-400 px-1">Forma de Botones (Esquinas)</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'pill', label: 'Píldora (M3)', desc: 'Redondo completo' },
            { id: 'rounded', label: 'Redondeado', desc: '14dp estándar' },
            { id: 'semi-rounded', label: 'Semi-redondo', desc: '8dp suave' },
            { id: 'sharp', label: 'Recto / Afilado', desc: '4dp técnico' },
          ].map(shape => (
            <button
              key={shape.id}
              onClick={() => updateTheme({ buttonShape: shape.id as ButtonShapeType })}
              className={`p-2 rounded border text-left transition-colors ${
                (theme.buttonShape || 'pill') === shape.id
                  ? 'bg-zinc-800 border-[#7f52ff] text-zinc-100 font-medium'
                  : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-medium text-[11px]">{shape.label}</div>
              <div className="text-[9px] text-zinc-500">{shape.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* 6. Tipografía de la App */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-400 px-1">Familia Tipográfica</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'sans', label: 'Sans-Serif', sample: 'Roboto / Inter' },
            { id: 'rounded', label: 'Redondeada', sample: 'Suave & Amigable' },
            { id: 'serif', label: 'Serif', sample: 'Editorial' },
            { id: 'mono', label: 'Monospace', sample: 'Técnica' },
          ].map(font => (
            <button
              key={font.id}
              onClick={() => updateTheme({ fontFamily: font.id as FontFamilyType })}
              className={`p-2 rounded border text-left transition-colors ${
                (theme.fontFamily || 'sans') === font.id
                  ? 'bg-zinc-800 border-[#7f52ff] text-zinc-100 font-medium'
                  : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-medium text-[11px]">{font.label}</div>
              <div className="text-[9px] text-zinc-500">{font.sample}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
