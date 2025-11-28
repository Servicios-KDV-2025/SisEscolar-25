/**
 * Uso:
 * const toastMessages = useCrudToastMessages('Ciclo Escolar')
 * // Retorna: { createSuccess: 'Ciclo Escolar creado exitosamente', ... }
 */
export function useCrudToastMessages(entityName: string) {
  return {
    createSuccess: `${entityName} creado exitosamente`,
    editSuccess: `${entityName} editado correctamente`,
    deleteSuccess: `${entityName} eliminado correctamente`,
    createError: `Error al crear el ${entityName.toLowerCase()}`,
    editError: `Error al editar el ${entityName.toLowerCase()}`,
    deleteError: `Error al eliminar el ${entityName.toLowerCase()}`,
  }
}

/**
 * Función helper para mensajes de toast más específicos
 */
export function createCrudToastMessages(config: {
  entityName: string
  createSuccess?: string
  editSuccess?: string
  deleteSuccess?: string
  createError?: string
  editError?: string
  deleteError?: string
}) {
  const { entityName, ...customMessages } = config
  
  return {
    createSuccess: customMessages.createSuccess || `${entityName} creado exitosamente`,
    editSuccess: customMessages.editSuccess || `${entityName} editado correctamente`,
    deleteSuccess: customMessages.deleteSuccess || `${entityName} eliminado correctamente`,
    createError: customMessages.createError || `Error al crear el ${entityName.toLowerCase()}`,
    editError: customMessages.editError || `Error al editar el ${entityName.toLowerCase()}`,
    deleteError: customMessages.deleteError || `Error al eliminar el ${entityName.toLowerCase()}`,
  }
}

