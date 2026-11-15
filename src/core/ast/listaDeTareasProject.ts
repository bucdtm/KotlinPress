import { AppAST } from './schema.ts';

export const listaDeTareasAST: AppAST = {
  schemaVersion: '1.0.0',
  appInfo: {
    appName: 'ListaDeTareas',
    packageName: 'com.example.listadetareas',
    versionCode: 1,
    versionName: '1.0',
  },
  theme: {
    primaryColor: '#6200EE',
    secondaryColor: '#03DAC5',
    tertiaryColor: '#BB86FC',
    surfaceColor: '#1A1721',
    backgroundColor: '#121016',
    textColor: '#F4F4F5',
    isDark: true,
    backgroundType: 'solid',
    buttonShape: 'rounded',
    buttonVariant: 'filled',
    fontFamily: 'sans',
  },
  globalState: [],
  startScreenId: 'tarea_screen',
  screens: [
    {
      id: 'tarea_screen',
      name: 'TareaScreen',
      route: 'tareas',
      title: 'Gestión de Tareas',
      stateVariables: [
        { id: 'v_titulo', name: 'tituloInput', type: 'String', initialValue: '' },
        { id: 'v_desc', name: 'descripcionInput', type: 'String', initialValue: '' },
        { id: 'v_modulo', name: 'moduloInput', type: 'String', initialValue: 'AD' },
        { id: 'v_urgente', name: 'esUrgenteInput', type: 'Boolean', initialValue: false },
        {
          id: 'v_lista',
          name: 'listaTareas',
          type: 'List<String>',
          initialValue: [
            'Entrega Práctica 4 Compose',
            'Examen de Acceso a Datos (AD)',
            'Diseño de Interfaces Móviles (DI)',
          ],
        },
      ],
      rootComponent: {
        id: 'col-main',
        type: 'Column',
        name: 'Contenedor Principal',
        modifier: {
          fillMaxSize: true,
          paddingAll: 16,
        },
        props: {
          verticalArrangement: 'Top',
          horizontalAlignment: 'Start',
        },
        children: [
          {
            id: 'txt-heading',
            type: 'Text',
            name: 'Título Principal',
            modifier: { paddingBottom: 6 },
            props: {
              text: 'Gestión de Tareas de Alumnos',
              fontSize: 22,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'txt-subheading',
            type: 'Text',
            name: 'Subtítulo',
            modifier: { paddingBottom: 14 },
            props: {
              text: 'Organiza las entregas y prácticas de tus módulos',
              fontSize: 13,
            },
          },
          {
            id: 'input-titulo',
            type: 'OutlinedTextField',
            name: 'Input Título',
            modifier: { fillMaxWidth: true, paddingBottom: 10 },
            props: {
              label: 'Título de la tarea',
              placeholder: 'Ej: Práctica Unidad 4 Jetpack Compose',
              valueBinding: 'tituloInput',
            },
          },
          {
            id: 'input-desc',
            type: 'OutlinedTextField',
            name: 'Input Descripción',
            modifier: { fillMaxWidth: true, paddingBottom: 12 },
            props: {
              label: 'Descripción de la tarea',
              placeholder: 'Ej: Implementar MVVM, StateFlow y LazyColumn',
              valueBinding: 'descripcionInput',
            },
          },
          {
            id: 'txt-mod-label',
            type: 'Text',
            name: 'Etiqueta Módulo',
            modifier: { paddingBottom: 6 },
            props: {
              text: 'Módulo formativo:',
              fontSize: 13,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'row-modulos',
            type: 'Row',
            name: 'Selector de Módulo',
            modifier: { fillMaxWidth: true, paddingBottom: 12 },
            props: {
              horizontalArrangement: 'SpaceBetween',
              verticalAlignment: 'CenterVertically',
            },
            children: [
              {
                id: 'rb-ad',
                type: 'RadioButton',
                name: 'Módulo AD',
                modifier: {},
                props: {
                  label: 'AD (Acceso a Datos)',
                  radioValue: 'AD',
                  selectedBinding: 'moduloInput',
                },
              },
              {
                id: 'rb-di',
                type: 'RadioButton',
                name: 'Módulo DI',
                modifier: {},
                props: {
                  label: 'DI (Diseño)',
                  radioValue: 'DI',
                  selectedBinding: 'moduloInput',
                },
              },
              {
                id: 'rb-pmdm',
                type: 'RadioButton',
                name: 'Módulo PMDM',
                modifier: {},
                props: {
                  label: 'PMDM (Móviles)',
                  radioValue: 'PMDM',
                  selectedBinding: 'moduloInput',
                },
              },
            ],
          },
          {
            id: 'txt-urg-label',
            type: 'Text',
            name: 'Etiqueta Urgencia',
            modifier: { paddingBottom: 6 },
            props: {
              text: 'Prioridad / Urgencia:',
              fontSize: 13,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'row-urgencia',
            type: 'Row',
            name: 'Selector de Urgencia',
            modifier: { fillMaxWidth: true, paddingBottom: 14 },
            props: {
              horizontalArrangement: 'Start',
              verticalAlignment: 'CenterVertically',
            },
            children: [
              {
                id: 'rb-normal',
                type: 'RadioButton',
                name: 'Prioridad Normal',
                modifier: { paddingEnd: 16 },
                props: {
                  label: 'Normal',
                  radioValue: 'false',
                  selectedBinding: 'esUrgenteInput',
                },
              },
              {
                id: 'rb-urgente',
                type: 'RadioButton',
                name: 'Prioridad Urgente',
                modifier: {},
                props: {
                  label: 'Urgente',
                  radioValue: 'true',
                  selectedBinding: 'esUrgenteInput',
                },
              },
            ],
          },
          {
            id: 'btn-anadir',
            type: 'Button',
            name: 'Botón Añadir Tarea',
            modifier: {
              fillMaxWidth: true,
              cornerRadius: 10,
              paddingBottom: 12,
            },
            props: {
              label: 'Añadir Tarea a la Lista',
            },
            events: {
              onClick: [
                {
                  type: 'APPEND_LIST',
                  targetListVar: 'listaTareas',
                  valueBinding: 'tituloInput',
                },
                {
                  type: 'CLEAR_STRING',
                  targetVar: 'tituloInput',
                },
                {
                  type: 'CLEAR_STRING',
                  targetVar: 'descripcionInput',
                },
              ],
            },
          },
          {
            id: 'div-sep',
            type: 'Divider',
            name: 'Separador Visual',
            modifier: { paddingBottom: 12 },
            props: {},
          },
          {
            id: 'txt-list-header',
            type: 'Text',
            name: 'Cabecera Lista',
            modifier: { paddingBottom: 8 },
            props: {
              text: 'Tareas Pendientes de Entrega',
              fontSize: 16,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'lazy-tareas',
            type: 'LazyColumn',
            name: 'Lista LazyColumn Tareas',
            modifier: {
              fillMaxWidth: true,
            },
            props: {
              itemsBinding: 'listaTareas',
              verticalArrangement: 'Top',
            },
            children: [
              {
                id: 'card-tarea',
                type: 'Card',
                name: 'Tarjeta de Tarea',
                modifier: {
                  fillMaxWidth: true,
                  cornerRadius: 12,
                  paddingBottom: 8,
                },
                props: {},
                children: [
                  {
                    id: 'col-card-body',
                    type: 'Column',
                    name: 'Cuerpo Tarjeta',
                    modifier: { paddingAll: 14 },
                    props: { verticalArrangement: 'Top', horizontalAlignment: 'Start' },
                    children: [
                      {
                        id: 'row-card-top',
                        type: 'Row',
                        name: 'Fila Título Tarjeta',
                        modifier: { fillMaxWidth: true },
                        props: {
                          horizontalArrangement: 'SpaceBetween',
                          verticalAlignment: 'CenterVertically',
                        },
                        children: [
                          {
                            id: 'txt-card-title',
                            type: 'Text',
                            name: 'Título Tarea Card',
                            modifier: {},
                            props: {
                              text: 'Entrega de Tarea Compose',
                              fontSize: 15,
                              fontWeight: 'Bold',
                            },
                          },
                          {
                            id: 'txt-card-mod',
                            type: 'Text',
                            name: 'Insignia Módulo',
                            modifier: {},
                            props: {
                              text: 'PMDM',
                              fontSize: 12,
                              fontWeight: 'Bold',
                            },
                          },
                        ],
                      },
                      {
                        id: 'txt-card-desc',
                        type: 'Text',
                        name: 'Descripción Tarea Card',
                        modifier: { paddingTop: 4 },
                        props: {
                          text: 'Completar ejercicios con ViewModel, StateFlow y Scaffold',
                          fontSize: 13,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: 'detalle_screen',
      name: 'DetalleTareaScreen',
      route: 'detalle',
      title: 'Detalle de Tarea',
      stateVariables: [
        { id: 'v_sel', name: 'tareaSeleccionada', type: 'String', initialValue: 'Entrega Práctica 4 Compose' },
        { id: 'v_comp', name: 'completada', type: 'Boolean', initialValue: false },
      ],
      rootComponent: {
        id: 'col-detail',
        type: 'Column',
        name: 'Contenedor Detalle',
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
            id: 'txt-det-title',
            type: 'Text',
            name: 'Título Detalle',
            modifier: { paddingBottom: 10 },
            props: {
              text: 'Detalles de la Tarea de Alumnos',
              fontSize: 22,
              fontWeight: 'Bold',
            },
          },
          {
            id: 'txt-det-info',
            type: 'Text',
            name: 'Información Detalle',
            modifier: { paddingBottom: 16 },
            props: {
              text: 'Módulo: Programación Multimedia y Dispositivos Móviles (PMDM)',
              fontSize: 14,
            },
          },
          {
            id: 'sw-completada',
            type: 'Switch',
            name: 'Switch Completada',
            modifier: { paddingBottom: 20 },
            props: {
              label: 'Marcar tarea como completada',
              checkedBinding: 'completada',
            },
          },
          {
            id: 'btn-volver',
            type: 'Button',
            name: 'Botón Volver',
            modifier: { fillMaxWidth: true, cornerRadius: 10 },
            props: {
              label: 'Volver a la Lista de Tareas',
            },
            events: {
              onClick: [
                {
                  type: 'NAVIGATE',
                  destinationRoute: 'tareas',
                },
              ],
            },
          },
        ],
      },
    },
  ],
  customFiles: [
    {
      id: 'cf-tarea',
      name: 'Tarea.kt',
      packageSuffix: 'modelo',
      kind: 'data_class',
      content: `package com.example.listadetareas.modelo

data class Tarea(
    val titulo: String,
    val descripcion: String,
    val modulo: String,
    val esUrgente: Boolean
)
`,
    },
    {
      id: 'cf-tarea-uistate',
      name: 'TareaUIState.kt',
      packageSuffix: 'modelo',
      kind: 'data_class',
      content: `package com.example.listadetareas.modelo

data class TareaUIState(
    val tituloInput: String = "",
    val descripcionInput: String = "",
    val moduloInput: String = "AD",
    val esUrgenteInput: Boolean = false,
    val listaTareas: List<Tarea> = emptyList()
)
`,
    },
    {
      id: 'cf-tarea-viewmodel',
      name: 'TareaViewModel.kt',
      packageSuffix: 'ui',
      kind: 'class',
      content: `package com.example.listadetareas.ui

import androidx.lifecycle.ViewModel
import com.example.listadetareas.modelo.Tarea
import com.example.listadetareas.modelo.TareaUIState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class TareaViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(TareaUIState())
    val uiState: StateFlow<TareaUIState> = _uiState.asStateFlow()

    fun onTituloCambiado(nuevoTitulo: String) {
        _uiState.update { estadoActual ->
            estadoActual.copy(tituloInput = nuevoTitulo)
        }
    }

    fun onDescripcionCambiado(nuevaDescripcion: String) {
        _uiState.update { estadoActual ->
            estadoActual.copy(descripcionInput = nuevaDescripcion)
        }
    }

    fun onModuloCambiado(nuevoModulo: String) {
        _uiState.update { estadoActual ->
            estadoActual.copy(moduloInput = nuevoModulo)
        }
    }

    fun onUrgenteCambiado(esUrgente: Boolean) {
        _uiState.update { estadoActual ->
            estadoActual.copy(esUrgenteInput = esUrgente)
        }
    }

    fun anadirTarea() {
        val estadoActual = _uiState.value
        if (estadoActual.tituloInput.isNotBlank()) {
            val nuevaTarea = Tarea(
                titulo = estadoActual.tituloInput.trim(),
                descripcion = estadoActual.descripcionInput.trim(),
                modulo = estadoActual.moduloInput,
                esUrgente = estadoActual.esUrgenteInput
            )

            _uiState.update { estado ->
                estado.copy(
                    listaTareas = estado.listaTareas + nuevaTarea,
                    tituloInput = "",
                    descripcionInput = "",
                    esUrgenteInput = false
                )
            }
        }
    }
}
`,
    },
  ],
};

/**
 * Plantilla de proyecto en blanco (desde cero)
 */
export const blankProjectAST: AppAST = {
  schemaVersion: '1.0.0',
  appInfo: {
    appName: 'MiAplicacionCompose',
    packageName: 'com.example.miaplicacion',
    versionCode: 1,
    versionName: '1.0.0',
  },
  theme: {
    primaryColor: '#7F52FF',
    secondaryColor: '#9F7DFF',
    tertiaryColor: '#EFB8C8',
    surfaceColor: '#121215',
    backgroundColor: '#09090B',
    textColor: '#F4F4F5',
    isDark: true,
    backgroundType: 'solid',
    buttonShape: 'rounded',
    buttonVariant: 'filled',
    fontFamily: 'sans',
  },
  globalState: [],
  startScreenId: 'pantalla_principal',
  screens: [
    {
      id: 'pantalla_principal',
      name: 'MainScreen',
      route: 'main',
      title: 'Pantalla Principal',
      stateVariables: [],
      rootComponent: {
        id: 'col-root',
        type: 'Column',
        name: 'Contenedor Principal',
        modifier: {
          fillMaxSize: true,
          paddingAll: 16,
        },
        props: {
          verticalArrangement: 'Center',
          horizontalAlignment: 'CenterHorizontally',
        },
        children: [
          {
            id: 'txt-vacio',
            type: 'Text',
            name: 'Texto Inicial',
            modifier: {},
            props: {
              text: 'Arrastra componentes desde la paleta izquierda',
              fontSize: 14,
            },
          },
        ],
      },
    },
  ],
  customFiles: [],
};
