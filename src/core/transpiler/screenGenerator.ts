import { ScreenDefinition, UIComponentNode } from '../ast/schema.ts';
import { buildModifierCode } from './modifierBuilder.ts';
import { transpileActions } from './actionTranspiler.ts';
import { StringResourceManager } from './stringResourceManager.ts';

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateScreenKotlin(
  screen: ScreenDefinition,
  packageName: string,
  stringManager?: StringResourceManager
): string {
  const rootComponentCode = generateComponent(screen.rootComponent, 1, stringManager);
  const vmName = `${screen.name}ViewModel`;
  const stateName = `${screen.name}UiState`;

  return `package ${packageName}.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import ${packageName}.R

/**
 * Pantalla contenedora de estado (Stateful Screen) que conecta el ViewModel y la Navegación.
 */
@Composable
fun ${screen.name}(
    navController: NavController,
    viewModel: ${vmName} = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    ${screen.name}Content(
        uiState = uiState,
        viewModel = viewModel,
        navController = navController
    )
}

/**
 * Componente visual desacoplado y sin estado (Stateless Screen Content),
 * ideal para testing unitario y previsualizaciones de Jetpack Compose.
 */
@Composable
fun ${screen.name}Content(
    uiState: ${stateName},
    viewModel: ${vmName},
    navController: NavController,
    modifier: Modifier = Modifier
) {
${rootComponentCode}
}
`;
}

export function generateComponent(
  node: UIComponentNode,
  indentLevel: number,
  stringManager?: StringResourceManager
): string {
  const indent = '    '.repeat(indentLevel);
  const modCode = buildModifierCode(node.modifier, indentLevel + 1);

  switch (node.type) {
    case 'Column': {
      const args: string[] = [`modifier = ${modCode}`];
      if (node.props.verticalArrangement) {
        args.push(`verticalArrangement = Arrangement.${node.props.verticalArrangement}`);
      }
      if (node.props.horizontalAlignment) {
        args.push(`horizontalAlignment = Alignment.${node.props.horizontalAlignment}`);
      }

      const childrenCode = (node.children || [])
        .map(c => generateComponent(c, indentLevel + 1, stringManager))
        .join('\n');

      return `${indent}Column(\n${args.map(a => `${indent}    ${a}`).join(',\n')}\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    case 'Row': {
      const args: string[] = [`modifier = ${modCode}`];
      if (node.props.horizontalArrangement) {
        args.push(`horizontalArrangement = Arrangement.${node.props.horizontalArrangement}`);
      }
      if (node.props.verticalAlignment) {
        args.push(`verticalAlignment = Alignment.${node.props.verticalAlignment}`);
      }

      const childrenCode = (node.children || [])
        .map(c => generateComponent(c, indentLevel + 1, stringManager))
        .join('\n');

      return `${indent}Row(\n${args.map(a => `${indent}    ${a}`).join(',\n')}\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    case 'Box': {
      const align = node.props.contentAlignment || 'Center';
      const childrenCode = (node.children || [])
        .map(c => generateComponent(c, indentLevel + 1, stringManager))
        .join('\n');

      return `${indent}Box(\n${indent}    modifier = ${modCode},\n${indent}    contentAlignment = Alignment.${align}\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    case 'Card': {
      const childrenCode = (node.children || [])
        .map(c => generateComponent(c, indentLevel + 1, stringManager))
        .join('\n');

      return `${indent}Card(\n${indent}    modifier = ${modCode}\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    case 'Text': {
      let textVal: string;
      if (node.props.textBinding) {
        textVal = `uiState.${node.props.textBinding}.toString()`;
      } else if (stringManager) {
        const key = stringManager.registerString('txt', node.props.text || 'Texto');
        textVal = key ? `stringResource(R.string.${key})` : '""';
      } else {
        textVal = `"${node.props.text ?? ''}"`;
      }

      const params = [`text = ${textVal}`];
      params.push(`modifier = ${modCode}`);
      if (node.props.fontSize) params.push(`fontSize = ${node.props.fontSize}.sp`);
      if (node.props.fontWeight) params.push(`fontWeight = FontWeight.${node.props.fontWeight}`);
      if (node.props.fontStyle === 'Italic') params.push('fontStyle = FontStyle.Italic');
      if (node.props.textAlign) params.push(`textAlign = TextAlign.${node.props.textAlign}`);
      if (node.props.textDecoration === 'Underline') params.push('textDecoration = TextDecoration.Underline');
      if (node.props.textDecoration === 'LineThrough') params.push('textDecoration = TextDecoration.LineThrough');
      if (node.props.textColor) {
        const hex = node.props.textColor.replace('#', '').toUpperCase();
        params.push(`color = Color(0xFF${hex})`);
      }
      if (node.props.letterSpacing) params.push(`letterSpacing = ${node.props.letterSpacing}.sp`);
      if (node.props.lineHeight) params.push(`lineHeight = ${node.props.lineHeight}.sp`);
      if (node.props.maxLines) {
        params.push(`maxLines = ${node.props.maxLines}`);
        params.push('overflow = TextOverflow.Ellipsis');
      }

      return `${indent}Text(\n${params.map(p => `${indent}    ${p}`).join(',\n')}\n${indent})`;
    }

    case 'Button': {
      const actions = transpileActions(node.events?.onClick, indentLevel + 2);
      const labelText = node.props.label || 'Botón';
      const labelCode = stringManager
        ? `stringResource(R.string.${stringManager.registerString('btn', labelText)})`
        : `"${labelText}"`;

      return `${indent}Button(\n${indent}    onClick = {\n${actions}\n${indent}    },\n${indent}    modifier = ${modCode}\n${indent}) {\n${indent}    Text(${labelCode})\n${indent}}`;
    }

    case 'OutlinedButton': {
      const actions = transpileActions(node.events?.onClick, indentLevel + 2);
      const labelText = node.props.label || 'Botón';
      const labelCode = stringManager
        ? `stringResource(R.string.${stringManager.registerString('btn', labelText)})`
        : `"${labelText}"`;

      return `${indent}OutlinedButton(\n${indent}    onClick = {\n${actions}\n${indent}    },\n${indent}    modifier = ${modCode}\n${indent}) {\n${indent}    Text(${labelCode})\n${indent}}`;
    }

    case 'OutlinedTextField': {
      const binding = node.props.valueBinding || 'tempText';
      const cap = capitalize(binding);
      
      let labelParam = '';
      if (node.props.label) {
        const labelVal = stringManager
          ? `stringResource(R.string.${stringManager.registerString('lbl', node.props.label)})`
          : `"${node.props.label}"`;
        labelParam = `label = { Text(${labelVal}) },\n`;
      }

      let placeholderParam = '';
      if (node.props.placeholder) {
        const hintVal = stringManager
          ? `stringResource(R.string.${stringManager.registerString('hint', node.props.placeholder)})`
          : `"${node.props.placeholder}"`;
        placeholderParam = `placeholder = { Text(${hintVal}) },\n`;
      }

      return `${indent}OutlinedTextField(\n${indent}    value = uiState.${binding},\n${indent}    onValueChange = { viewModel.update${cap}(it) },\n${labelParam ? `${indent}    ${labelParam}` : ''}${placeholderParam ? `${indent}    ${placeholderParam}` : ''}${indent}    modifier = ${modCode}\n${indent})`;
    }

    case 'Switch': {
      const binding = node.props.checkedBinding || 'tempCheck';
      const cap = capitalize(binding);

      return `${indent}Switch(\n${indent}    checked = uiState.${binding},\n${indent}    onCheckedChange = { viewModel.set${cap}(it) },\n${indent}    modifier = ${modCode}\n${indent})`;
    }

    case 'Checkbox': {
      const binding = node.props.checkedBinding || 'tempCheck';
      const cap = capitalize(binding);

      return `${indent}Checkbox(\n${indent}    checked = uiState.${binding},\n${indent}    onCheckedChange = { viewModel.set${cap}(it) },\n${indent}    modifier = ${modCode}\n${indent})`;
    }

    case 'RadioButton': {
      const binding = node.props.selectedBinding || 'selectedOption';
      const radioVal = node.props.radioValue || 'Opción';
      const cap = capitalize(binding);
      const label = node.props.label;

      if (label) {
        const labelCode = stringManager
          ? `stringResource(R.string.${stringManager.registerString('radio', label)})`
          : `"${label}"`;

        return `${indent}Row(\n${indent}    verticalAlignment = Alignment.CenterVertically,\n${indent}    modifier = ${modCode}.clickable { viewModel.update${cap}("${radioVal}") }\n${indent}) {\n${indent}    RadioButton(\n${indent}        selected = (uiState.${binding} == "${radioVal}"),\n${indent}        onClick = { viewModel.update${cap}("${radioVal}") }\n${indent}    )\n${indent}    Text(\n${indent}        text = ${labelCode},\n${indent}        modifier = Modifier.padding(start = 8.dp)\n${indent}    )\n${indent}}`;
      } else {
        return `${indent}RadioButton(\n${indent}    selected = (uiState.${binding} == "${radioVal}"),\n${indent}    onClick = { viewModel.update${cap}("${radioVal}") },\n${indent}    modifier = ${modCode}\n${indent})`;
      }
    }

    case 'Image': {
      const res = node.props.imageResource || 'sample_image';
      const desc = node.props.contentDescription || 'Imagen';
      const descCode = stringManager
        ? `stringResource(R.string.${stringManager.registerString('desc', desc)})`
        : `"${desc}"`;

      return `${indent}// TIP: Coloca tu archivo en res/drawable/${res}.png o .xml para personalizar esta imagen\n${indent}Image(\n${indent}    painter = painterResource(id = R.drawable.${res}),\n${indent}    contentDescription = ${descCode},\n${indent}    modifier = ${modCode}\n${indent})`;
    }

    case 'LazyColumn': {
      const itemsBinding = node.props.itemsBinding;
      const children = node.children || [];

      const parts: string[] = [];

      if (children.length > 0) {
        for (const child of children) {
          parts.push(`${indent}    item {\n${generateComponent(child, indentLevel + 2, stringManager)}\n${indent}    }`);
        }
      }

      if (itemsBinding) {
        parts.push(`${indent}    items(uiState.${itemsBinding}) { item ->\n${indent}        Card(\n${indent}            modifier = Modifier\n${indent}                .fillMaxWidth()\n${indent}                .padding(vertical = 4.dp)\n${indent}        ) {\n${indent}            Text(\n${indent}                text = item,\n${indent}                modifier = Modifier.padding(16.dp),\n${indent}                fontSize = 16.sp\n${indent}            )\n${indent}        }\n${indent}    }`);
      }

      const body = parts.length > 0
        ? parts.join('\n')
        : `${indent}    // LazyColumn sin elementos definidos`;

      return `${indent}LazyColumn(\n${indent}    modifier = ${modCode}\n${indent}) {\n${body}\n${indent}}`;
    }

    case 'Spacer': {
      const size = node.props.size || 16;
      return `${indent}Spacer(modifier = Modifier.height(${size}.dp))`;
    }

    case 'Divider': {
      return `${indent}HorizontalDivider(modifier = ${modCode})`;
    }

    default:
      return `${indent}// Componente ${(node as any).type} en desarrollo`;
  }
}
