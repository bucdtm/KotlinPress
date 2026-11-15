// ==========================================
// Especificación Formal del AST de Compose Studio
// ==========================================

export type PrimitiveType = 'String' | 'Int' | 'Float' | 'Boolean';
export type ComplexType = 'List<String>' | 'List<Int>';

export interface StateVariable {
  id: string;
  name: string;
  type: PrimitiveType | ComplexType;
  initialValue: string | number | boolean | any[];
  isGlobal?: boolean;
  persistLocal?: boolean;
}

export interface ModifierConfig {
  fillMaxSize?: boolean;
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
  width?: number;              // dp
  height?: number;             // dp
  paddingAll?: number;         // dp
  paddingHorizontal?: number;  // dp
  paddingVertical?: number;    // dp
  paddingTop?: number;
  paddingBottom?: number;
  paddingStart?: number;
  paddingEnd?: number;
  backgroundColor?: string;    // Hex (#FFFFFF) o token
  cornerRadius?: number;       // dp
  elevation?: number;          // dp
  borderWidth?: number;        // dp
  borderColor?: string;
  clickable?: boolean;
}

export type LogicAction =
  | { type: 'SET_STATE'; targetVar: string; value: string | number | boolean; isBinding?: boolean }
  | { type: 'INCREMENT_STATE'; targetVar: string; amount: number }
  | { type: 'DECREMENT_STATE'; targetVar: string; amount: number }
  | { type: 'TOGGLE_BOOLEAN'; targetVar: string }
  | { type: 'NAVIGATE'; destinationRoute: string }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'APPEND_LIST'; targetListVar: string; valueBinding?: string; staticValue?: string }
  | { type: 'REMOVE_FROM_LIST'; targetListVar: string; indexBinding: string }
  | { type: 'SHOW_SNACKBAR'; message: string };

export interface EventHandlers {
  onClick?: LogicAction[];
  onValueChange?: LogicAction[];
  onCheckedChange?: LogicAction[];
}

export type LayoutContainerType = 'Column' | 'Row' | 'Box' | 'Card' | 'LazyColumn';
export type LeafComponentType =
  | 'Text'
  | 'Button'
  | 'OutlinedButton'
  | 'OutlinedTextField'
  | 'Switch'
  | 'Checkbox'
  | 'Spacer'
  | 'Divider';

export type ComponentType = LayoutContainerType | LeafComponentType;

export interface ComponentProps {
  // Textos y tipografía
  text?: string;
  textBinding?: string;
  fontSize?: number;           // sp
  fontWeight?: 'Normal' | 'Medium' | 'SemiBold' | 'Bold' | 'ExtraBold';
  fontStyle?: 'Normal' | 'Italic';
  textAlign?: 'Start' | 'Center' | 'End' | 'Justify';
  textDecoration?: 'None' | 'Underline' | 'LineThrough';
  textColor?: string;
  letterSpacing?: number;      // sp
  lineHeight?: number;         // sp
  maxLines?: number;
  
  // Botones e inputs
  label?: string;
  placeholder?: string;
  valueBinding?: string;       // Variable enlazada para TextField
  checkedBinding?: string;     // Variable enlazada para Switch/Checkbox
  
  // Layout
  verticalArrangement?: 'Top' | 'Center' | 'Bottom' | 'SpaceBetween' | 'SpaceAround' | 'SpaceEvenly';
  horizontalAlignment?: 'Start' | 'CenterHorizontally' | 'End';
  horizontalArrangement?: 'Start' | 'Center' | 'End' | 'SpaceBetween' | 'SpaceAround' | 'SpaceEvenly';
  verticalAlignment?: 'Top' | 'CenterVertically' | 'Bottom';
  
  // Spacers
  size?: number;               // dp
  
  // LazyColumn
  itemsBinding?: string;       // Nombre de la variable de lista (List<String>)
}

export interface UIComponentNode {
  id: string;
  type: ComponentType;
  name?: string;
  modifier: ModifierConfig;
  props: ComponentProps;
  events?: EventHandlers;
  children?: UIComponentNode[];
}

export interface ScreenDefinition {
  id: string;
  name: string;                // ej: "HomeScreen", "DetailScreen"
  route: string;               // ej: "home", "detail"
  title: string;
  stateVariables: StateVariable[];
  rootComponent: UIComponentNode;
}

export type ButtonShapeType = 'pill' | 'rounded' | 'semi-rounded' | 'sharp';
export type ButtonVariantType = 'filled' | 'tonal' | 'outlined';
export type FontFamilyType = 'sans' | 'rounded' | 'serif' | 'mono';
export type BackgroundType = 'solid' | 'gradient' | 'surface';

export interface AppThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  surfaceColor: string;
  backgroundColor: string;
  textColor?: string;
  isDark?: boolean;
  backgroundType?: BackgroundType;
  buttonShape?: ButtonShapeType;
  buttonVariant?: ButtonVariantType;
  fontFamily?: FontFamilyType;
}

export interface AppAST {
  schemaVersion: '1.0.0';
  appInfo: {
    appName: string;
    packageName: string;       // ej: "com.example.miapp"
    versionCode: number;
    versionName: string;
  };
  theme: AppThemeConfig;
  globalState: StateVariable[];
  startScreenId: string;
  screens: ScreenDefinition[];
}
