import { describe, it, expect } from 'vitest';
import { lintAppAST } from './linter.ts';
import { sampleAppAST } from './sampleApp.ts';
import { AppAST } from './schema.ts';

describe('Compose Studio AST Linter', () => {
  it('no arroja errores en la plantilla demo válida (sampleAppAST)', () => {
    const issues = lintAppAST(sampleAppAST);
    const errors = issues.filter(i => i.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('detecta variables inexistentes en textBinding', () => {
    const brokenAST: AppAST = JSON.parse(JSON.stringify(sampleAppAST));
    const textNode = brokenAST.screens[0].rootComponent.children!.find(c => c.type === 'Text')!;
    textNode.props.textBinding = 'variable_fantasma';

    const issues = lintAppAST(brokenAST);
    const error = issues.find(i => i.id.startsWith('unbound-text-'));
    expect(error).toBeDefined();
    expect(error?.severity).toBe('error');
    expect(error?.message).toContain('variable_fantasma');
  });

  it('detecta rutas duplicadas en pantallas', () => {
    const brokenAST: AppAST = JSON.parse(JSON.stringify(sampleAppAST));
    brokenAST.screens[1].route = brokenAST.screens[0].route;

    const issues = lintAppAST(brokenAST);
    const error = issues.find(i => i.id.startsWith('dup-route-'));
    expect(error).toBeDefined();
    expect(error?.severity).toBe('error');
  });

  it('detecta navegación a rutas inexistentes', () => {
    const brokenAST: AppAST = JSON.parse(JSON.stringify(sampleAppAST));
    const button = brokenAST.screens[0].rootComponent.children!.find(c => c.type === 'Button')!;
    button.events = {
      onClick: [{ type: 'NAVIGATE', destinationRoute: 'ruta_no_existente' }],
    };

    const issues = lintAppAST(brokenAST);
    const error = issues.find(i => i.id.startsWith('invalid-nav-'));
    expect(error).toBeDefined();
    expect(error?.severity).toBe('error');
    expect(error?.message).toContain('ruta_no_existente');
  });
});
