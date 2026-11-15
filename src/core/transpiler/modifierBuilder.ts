import { ModifierConfig } from '../ast/schema.ts';

/**
 * Convierte un ModifierConfig a una cadena fluida de Modifier de Jetpack Compose.
 */
export function buildModifierCode(mod?: ModifierConfig, indentLevel: number = 2): string {
  if (!mod) return 'Modifier';

  const indent = '    '.repeat(indentLevel);
  const calls: string[] = [];

  if (mod.fillMaxSize) {
    calls.push('fillMaxSize()');
  } else {
    if (mod.fillMaxWidth) calls.push('fillMaxWidth()');
    if (mod.fillMaxHeight) calls.push('fillMaxHeight()');
  }

  if (mod.width) calls.push(`width(${mod.width}.dp)`);
  if (mod.height) calls.push(`height(${mod.height}.dp)`);

  // Padding
  if (mod.paddingAll !== undefined && mod.paddingAll > 0) {
    calls.push(`padding(${mod.paddingAll}.dp)`);
  } else {
    const pParts: string[] = [];
    if (mod.paddingStart) pParts.push(`start = ${mod.paddingStart}.dp`);
    if (mod.paddingTop) pParts.push(`top = ${mod.paddingTop}.dp`);
    if (mod.paddingEnd) pParts.push(`end = ${mod.paddingEnd}.dp`);
    if (mod.paddingBottom) pParts.push(`bottom = ${mod.paddingBottom}.dp`);
    if (mod.paddingHorizontal) {
      pParts.push(`horizontal = ${mod.paddingHorizontal}.dp`);
    }
    if (mod.paddingVertical) {
      pParts.push(`vertical = ${mod.paddingVertical}.dp`);
    }

    if (pParts.length > 0) {
      calls.push(`padding(${pParts.join(', ')})`);
    }
  }

  // Border & Shape
  if (mod.cornerRadius !== undefined && mod.cornerRadius > 0) {
    calls.push(`clip(RoundedCornerShape(${mod.cornerRadius}.dp))`);
  }

  if (mod.backgroundColor) {
    const hex = mod.backgroundColor.replace('#', '');
    calls.push(`background(Color(0xFF${hex.toUpperCase()}))`);
  }

  if (calls.length === 0) {
    return 'Modifier';
  }

  return `Modifier\n${calls.map(c => `${indent}.${c}`).join('\n')}`;
}
