import { AppAST } from './schema.ts';

export const sampleAppAST: AppAST = {
  schemaVersion: '1.0.0',
  appInfo: {
    appName: 'MegaDemoApp',
    packageName: 'com.example.megademo',
    versionCode: 1,
    versionName: '1.0.0',
  },
  theme: {
    primaryColor: '#6750A4',
    secondaryColor: '#625B71',
    tertiaryColor: '#7D5260',
    surfaceColor: '#1D1B20',
    backgroundColor: '#141218',
    textColor: '#E6E1E5',
    isDark: true,
    backgroundType: 'solid',
    buttonShape: 'pill',
    buttonVariant: 'filled',
    fontFamily: 'sans',
  },
  globalState: [],
  startScreenId: 'home',
  screens: [
    {
      id: 'home',
      name: 'HomeScreen',
      route: 'home',
      title: 'Pantalla de Inicio',
      stateVariables: [
        { id: 'v1', name: 'contador', type: 'Int', initialValue: 0 },
        { id: 'v2', name: 'nombre', type: 'String', initialValue: 'Mundo' },
        { id: 'v3', name: 'activo', type: 'Boolean', initialValue: true },
        { id: 'v4', name: 'categoria', type: 'String', initialValue: 'General' },
      ],
      rootComponent: {
        id: 'root-1',
        type: 'Column',
        name: 'Contenedor Principal',
        modifier: {
          fillMaxSize: true,
          paddingAll: 20,
        },
        props: {
          verticalArrangement: 'Center',
          horizontalAlignment: 'CenterHorizontally',
        },
        children: [
          {
            id: 'img-logo',
            type: 'Image',
            name: 'Logo App',
            modifier: { width: 80, height: 80, paddingBottom: 12 },
            props: {
              imageResource: 'sample_image',
              contentDescription: 'Logotipo de la aplicación',
            },
          },
          {
            id: 'txt-title',
            type: 'Text',
            name: 'Título Saludo',
            modifier: { paddingBottom: 12 },
            props: {
              text: '¡Bienvenido a KotlinPress!',
              fontSize: 20,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'row-radios',
            type: 'Row',
            name: 'Opciones de Categoría',
            modifier: { paddingBottom: 16 },
            props: {
              horizontalArrangement: 'Center',
              verticalAlignment: 'CenterVertically',
            },
            children: [
              {
                id: 'rb-cat-1',
                type: 'RadioButton',
                name: 'Radio General',
                modifier: { paddingEnd: 12 },
                props: {
                  label: 'General',
                  radioValue: 'General',
                  selectedBinding: 'categoria',
                },
              },
              {
                id: 'rb-cat-2',
                type: 'RadioButton',
                name: 'Radio Pro',
                modifier: {},
                props: {
                  label: 'Pro',
                  radioValue: 'Pro',
                  selectedBinding: 'categoria',
                },
              },
            ],
          },
          {
            id: 'txt-count-label',
            type: 'Text',
            name: 'Label Contador',
            modifier: {},
            props: {
              text: 'Valor actual del contador:',
              fontSize: 14,
            },
          },
          {
            id: 'txt-count-val',
            type: 'Text',
            name: 'Valor Contador',
            modifier: { paddingBottom: 16 },
            props: {
              textBinding: 'contador',
              fontSize: 32,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'row-buttons',
            type: 'Row',
            name: 'Fila de Botones',
            modifier: { fillMaxWidth: true, paddingBottom: 16 },
            props: {
              horizontalArrangement: 'Center',
            },
            children: [
              {
                id: 'btn-dec',
                type: 'OutlinedButton',
                name: 'Botón Restar',
                modifier: { paddingEnd: 8 },
                props: { label: '- 1' },
                events: {
                  onClick: [
                    { type: 'DECREMENT_STATE', targetVar: 'contador', amount: 1 },
                  ],
                },
              },
              {
                id: 'btn-inc',
                type: 'Button',
                name: 'Botón Sumar',
                modifier: { paddingStart: 8 },
                props: { label: '+ 1' },
                events: {
                  onClick: [
                    { type: 'INCREMENT_STATE', targetVar: 'contador', amount: 1 },
                  ],
                },
              },
            ],
          },
          {
            id: 'input-name',
            type: 'OutlinedTextField',
            name: 'Input Nombre',
            modifier: { fillMaxWidth: true, paddingBottom: 16 },
            props: {
              label: 'Ingresa tu nombre',
              valueBinding: 'nombre',
            },
          },
          {
            id: 'btn-nav-tasks',
            type: 'Button',
            name: 'Botón Ir a Tareas',
            modifier: { fillMaxWidth: true },
            props: { label: 'Ir a Lista de Tareas →' },
            events: {
              onClick: [
                { type: 'NAVIGATE', destinationRoute: 'tasks' },
              ],
            },
          },
        ],
      },
    },
    {
      id: 'tasks',
      name: 'TasksScreen',
      route: 'tasks',
      title: 'Lista de Tareas',
      stateVariables: [
        { id: 't1', name: 'nuevaTarea', type: 'String', initialValue: '' },
        { id: 't2', name: 'tareas', type: 'List<String>', initialValue: ['Aprender Kotlin', 'Dominar Compose'] },
      ],
      rootComponent: {
        id: 'tasks-root',
        type: 'Column',
        name: 'Contenedor Tareas',
        modifier: {
          fillMaxSize: true,
          paddingAll: 20,
        },
        props: {
          verticalArrangement: 'Top',
          horizontalAlignment: 'Start',
        },
        children: [
          {
            id: 'btn-back',
            type: 'OutlinedButton',
            name: 'Botón Volver',
            modifier: { paddingBottom: 16 },
            props: { label: '← Volver a Inicio' },
            events: {
              onClick: [
                { type: 'NAVIGATE_BACK' },
              ],
            },
          },
          {
            id: 'tasks-title',
            type: 'Text',
            name: 'Título Tareas',
            modifier: { paddingBottom: 16 },
            props: {
              text: 'Mis Tareas Pendientes',
              fontSize: 22,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'input-task',
            type: 'OutlinedTextField',
            name: 'Input Tarea',
            modifier: { fillMaxWidth: true, paddingBottom: 8 },
            props: {
              label: 'Nueva tarea...',
              valueBinding: 'nuevaTarea',
            },
          },
          {
            id: 'btn-add-task',
            type: 'Button',
            name: 'Botón Agregar',
            modifier: { fillMaxWidth: true, paddingBottom: 16 },
            props: { label: 'Agregar Tarea' },
            events: {
              onClick: [
                { type: 'APPEND_LIST', targetListVar: 'tareas', valueBinding: 'nuevaTarea' },
                { type: 'SET_STATE', targetVar: 'nuevaTarea', value: '' },
              ],
            },
          },
          {
            id: 'tasks-list',
            type: 'LazyColumn',
            name: 'Lista de Tareas',
            modifier: { fillMaxSize: true },
            props: {
              itemsBinding: 'tareas',
            },
          },
        ],
      },
    },
  ],
};
