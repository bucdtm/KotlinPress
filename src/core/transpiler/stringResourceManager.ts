import { AppAST, UIComponentNode } from '../ast/schema.ts';

export interface StringEntry {
  key: string;
  value: string;
}

/**
 * Convierte un texto en un identificador válido para resources de Android (R.string.<id>)
 */
export function sanitizeResourceKey(prefix: string, rawText: string): string {
  const clean = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9]+/g, '_')     // Solo letras, números y guiones bajos
    .replace(/^_+|_+$/g, '')         // Quitar guiones al inicio o final
    .slice(0, 30);                   // Longitud razonable

  const base = clean || 'item';
  return `${prefix}_${base}`;
}

export class StringResourceManager {
  private entries: Map<string, string> = new Map();
  private valueToKey: Map<string, string> = new Map();
  private keyCounts: Map<string, number> = new Map();

  constructor(appName: string = 'KotlinPress') {
    this.addString('app_name', appName);
  }

  /**
   * Registra una cadena de texto y devuelve la clave R.string correspondiente.
   * Si el texto ya existe, reutiliza la clave existente para optimizar recursos.
   */
  public registerString(prefix: string, text: string): string {
    if (!text || text.trim() === '') {
      return '';
    }

    const trimmed = text.trim();
    if (this.valueToKey.has(trimmed)) {
      return this.valueToKey.get(trimmed)!;
    }

    let key = sanitizeResourceKey(prefix, trimmed);
    if (this.entries.has(key)) {
      const count = (this.keyCounts.get(key) || 1) + 1;
      this.keyCounts.set(key, count);
      key = `${key}_${count}`;
    } else {
      this.keyCounts.set(key, 1);
    }

    this.addString(key, trimmed);
    this.valueToKey.set(trimmed, key);
    return key;
  }

  public addString(key: string, value: string): void {
    this.entries.set(key, value);
    this.valueToKey.set(value, key);
  }

  public getKey(value: string): string | undefined {
    return this.valueToKey.get(value);
  }

  public getAllEntries(): StringEntry[] {
    return Array.from(this.entries.entries()).map(([key, value]) => ({ key, value }));
  }

  /**
   * Genera el archivo XML res/values/strings.xml estándar de Android
   */
  public toXml(): string {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<resources>',
    ];

    for (const [key, value] of this.entries.entries()) {
      // Escapar caracteres XML y apóstrofes de Android (\' y \")
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

      lines.push(`    <string name="${key}">${escaped}</string>`);
    }

    lines.push('</resources>\n');
    return lines.join('\n');
  }
}

/**
 * Escanea un AST completo y extrae todas las cadenas de texto hacia un StringResourceManager
 */
export function extractStringsFromAST(ast: AppAST): StringResourceManager {
  const manager = new StringResourceManager(ast.appInfo.appName);

  for (const screen of ast.screens) {
    if (screen.title) {
      manager.registerString(`screen_${screen.route}`, screen.title);
    }
    extractNodeStrings(screen.rootComponent, manager);
  }

  return manager;
}

function extractNodeStrings(node: UIComponentNode, manager: StringResourceManager): void {
  const p = node.props || {};

  if (node.type === 'Text' && p.text && !p.textBinding) {
    manager.registerString('txt', p.text);
  }

  if ((node.type === 'Button' || node.type === 'OutlinedButton') && p.label) {
    manager.registerString('btn', p.label);
  }

  if (node.type === 'OutlinedTextField') {
    if (p.label) manager.registerString('lbl', p.label);
    if (p.placeholder) manager.registerString('hint', p.placeholder);
  }

  if (node.type === 'RadioButton' && p.label) {
    manager.registerString('radio', p.label);
  }

  if (node.type === 'Image' && p.contentDescription) {
    manager.registerString('desc', p.contentDescription);
  }

  if (node.events?.onClick) {
    for (const action of node.events.onClick) {
      if (action.type === 'SHOW_SNACKBAR' && action.message) {
        manager.registerString('msg', action.message);
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractNodeStrings(child, manager);
    }
  }
}
