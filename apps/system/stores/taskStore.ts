// apps/system/stores/taskStore.ts
import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";

// Tipos para las tareas
export type Task = {
  _id: string;
  name: string;
  description?: string;
  dueDate: number;
  maxScore: number;
  classCatalogId: string;
  termId: string;
  gradeRubricId: string;
  createdBy: string;
  gradeRubric?: {
    _id: string;
    name: string;
  } | null;
  group?: {
    _id: string;
    name: string;
    grade: number;
    section: string;
  } | null;
};

// Tipo para el progreso de entregas
export type TaskProgress = {
  assignmentId: string;
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  progressPercentage: number;
};

// Formulario de datos para crear/editar tarea
export type TaskFormData = {
  name: string;
  description: string;
  dueDate: string;
  dueTime: string;
  maxScore: string;
  classCatalogId: string;
  termId: string;
  gradeRubricId: string;
};

export type CreateTaskData = {
  classCatalogId: string;
  termId: string;
  gradeRubricId: string;
  name: string;
  description?: string;
  dueDate: number;
  maxScore: number;
};

export type UpdateTaskData = {
  id: string;
  patch: {
    classCatalogId: string;
    termId: string;
    gradeRubricId: string;
    name: string;
    description?: string;
    dueDate: number;
    maxScore: number;
  };
};

// Estado del store
type TaskStoreState = {
  tasks: Task[];
  selectedTask: Task | null;
  formData: TaskFormData;
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  // Estados para el modal
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  // Progreso de entregas
  tasksProgress: TaskProgress[];
};

// Acciones del store
type TaskStoreActions = {
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setFormData: (formData: Partial<TaskFormData>) => void;
  resetFormData: () => void;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  clearFieldError: (fieldName: string) => void;
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  setCreateDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  openEditModal: (task: Task) => void;
  closeEditModal: () => void;
  clearErrors: () => void;
  reset: () => void;
  // Acciones para el progreso
  setTasksProgress: (progress: TaskProgress[]) => void;
  getTaskProgress: (taskId: string) => TaskProgress | undefined;
  getTaskProgressFromQuery: (taskId: string, progressData: TaskProgress[] | undefined) => TaskProgress | undefined;
};

const initialFormData: TaskFormData = {
  name: "",
  description: "",
  dueDate: "",
  dueTime: "23:59",
  maxScore: "",
  classCatalogId: "",
  termId: "",
  gradeRubricId: "",
};

const initialState: TaskStoreState = {
  tasks: [],
  selectedTask: null,
  formData: initialFormData,
  validationErrors: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  tasksProgress: [],
};

export const useTaskStore = create<TaskStoreState & TaskStoreActions>((set, get) => ({
  ...initialState,
  
  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (selectedTask) => set({ selectedTask }),
  
  setFormData: (newFormData) => 
    set((state) => ({ 
      formData: { ...state.formData, ...newFormData } 
    })),
  
  resetFormData: () => set({ formData: initialFormData }),
  
  setValidationErrors: (validationErrors) => set({ validationErrors }),
  
  clearFieldError: (fieldName) => 
    set((state) => {
      if (state.validationErrors[fieldName]) {
        const newErrors = { ...state.validationErrors };
        delete newErrors[fieldName];
        return { validationErrors: newErrors };
      }
      return state;
    }),
  
  setLoading: (isLoading) => set({ isLoading }),
  setCreating: (isCreating) => set({ isCreating }),
  setUpdating: (isUpdating) => set({ isUpdating }),
  setDeleting: (isDeleting) => set({ isDeleting }),
  setError: (error) => set({ error }),
  
  setCreateDialogOpen: (isCreateDialogOpen) => {
    set({ isCreateDialogOpen });
    if (isCreateDialogOpen) {
      // Limpiar formulario al abrir modal de crear
      get().resetFormData();
      get().setValidationErrors({});
    }
  },
  
  setEditDialogOpen: (isEditDialogOpen) => {
    set({ isEditDialogOpen });
    if (!isEditDialogOpen) {
      // Limpiar estado al cerrar modal de editar
      set({ selectedTask: null });
      get().setValidationErrors({});
    }
  },
  
  openEditModal: (task) => {
    // Crear fecha local para evitar problemas de zona horaria
    const taskDate = new Date(task.dueDate);
    const localDate = new Date(taskDate.getTime() - (taskDate.getTimezoneOffset() * 60000));
    const originalTime = taskDate.toTimeString().slice(0, 5);
    
    // Establecer datos del formulario
    set({
      selectedTask: task,
      formData: {
        name: task.name,
        description: task.description || "",
        dueDate: localDate.toISOString().split("T")[0] || "",
        dueTime: originalTime,
        maxScore: task.maxScore.toString(),
        classCatalogId: task.classCatalogId,
        termId: task.termId,
        gradeRubricId: task.gradeRubricId,
      },
      validationErrors: {},
      isEditDialogOpen: true,
    });
  },
  
  closeEditModal: () => {
    set({
      isEditDialogOpen: false,
      selectedTask: null,
      validationErrors: {},
    });
  },
  
  clearErrors: () => set({ error: null, validationErrors: {} }),
  reset: () => set(initialState),
  
  // Acciones para el progreso
  setTasksProgress: (tasksProgress) => set({ tasksProgress }),
  
  getTaskProgress: (taskId) => {
    const state = get();
    return state.tasksProgress.find(progress => progress.assignmentId === taskId);
  },
  
  // Función para obtener progreso desde la query directamente
  getTaskProgressFromQuery: (taskId: string, progressData: TaskProgress[] | undefined) => {
    return progressData?.find((progress: TaskProgress) => progress.assignmentId === taskId);
  },
}));

// Hook personalizado para usar el store con Convex
export const useTask = (schoolId?: string) => {
  const store = useTaskStore();
  
  // Obtener el ciclo escolar activo
  const activeCycle = useQuery(
    api.functions.schoolCycles.ObtenerCicloActivo,
    schoolId ? { escuelaID: schoolId as Id<"school"> } : "skip"
  );

  // Queries
  const teacherAssignments = useQuery(
    api.functions.assignment.getTeacherAssignments,
    schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
  );
  // Obtener todas las clases del maestro y luego filtrar por ciclo activo
  const allTeacherClasses = useQuery(
    api.functions.classCatalog.getTeacherClasses,
    schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
  );

  // Filtrar las clases del maestro por el ciclo escolar activo
  const teacherClasses = allTeacherClasses?.filter(
    (classCatalog) => {
      // Forzar el tipo para acceder a schoolCycleId
      const classWithCycle = classCatalog as typeof classCatalog & { schoolCycleId: string };
      return classWithCycle.schoolCycleId === activeCycle?._id;
    }
  );
  const allTerms = useQuery(
    api.functions.terms.getTermsByCycleId,
    activeCycle ? { schoolCycleId: activeCycle._id } : "skip"
  );
  const assignmentsProgress = useQuery(
    api.functions.assignment.getTeacherAssignmentsProgress,
    schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
  );
  
  // Obtener las rúbricas de calificación para la clase y término seleccionados
  const gradeRubrics = useQuery(
    api.functions.gradeRubrics.getGradeRubricsByClass,
    (store.formData.classCatalogId && store.formData.termId) ||
      (store.selectedTask && store.selectedTask.classCatalogId && store.selectedTask.termId)
      ? {
          classCatalogId: (store.formData.classCatalogId ||
            store.selectedTask?.classCatalogId) as Id<"classCatalog"> ,
          termId: (store.formData.termId || store.selectedTask?.termId) as Id<"term"> ,
        }
      : "skip"
  );
  
  // Mutations
  const createAssignmentMutation = useMutation(api.functions.assignment.createAssignment);
  const updateAssignmentMutation = useMutation(api.functions.assignment.updateAssignment);
  const deleteAssignmentMutation = useMutation(api.functions.assignment.deleteAssignment);
  
  // CREATE
  const createTask = async (data: CreateTaskData) => {
    store.setCreating(true);
    store.setError(null);
    try {
      await createAssignmentMutation({
        classCatalogId: data.classCatalogId as Id<"classCatalog">,
        termId: data.termId as Id<"term">,
        gradeRubricId: data.gradeRubricId as Id<"gradeRubric">,
        name: data.name,
        description: data.description,
        dueDate: data.dueDate,
        maxScore: data.maxScore,
      });
      store.setCreateDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setCreating(false);
    }
  };
  
  // UPDATE
  const updateTask = async (data: UpdateTaskData) => {
    store.setUpdating(true);
    store.setError(null);
    try {
      await updateAssignmentMutation({
        id: data.id as Id<"assignment">,
        patch: {
          classCatalogId: data.patch.classCatalogId as Id<"classCatalog">,
          termId: data.patch.termId as Id<"term">,
          gradeRubricId: data.patch.gradeRubricId as Id<"gradeRubric">,
          name: data.patch.name,
          description: data.patch.description,
          dueDate: data.patch.dueDate,
          maxScore: data.patch.maxScore,
        },
      });
      store.closeEditModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setUpdating(false);
    }
  };
  
  // DELETE
  const deleteTask = async (id: string) => {
    store.setDeleting(true);
    store.setError(null);
    try {
      await deleteAssignmentMutation({ id: id as Id<"assignment"> });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setDeleting(false);
    }
  };
  
  // No sincronizamos automáticamente para evitar setState durante render
  // El progreso se obtiene directamente de la query
  
  return {
    // Estado
    ...store,
    
    // Datos de las queries
    teacherAssignments,
    teacherClasses,
    allTerms,
    gradeRubrics,
    assignmentsProgress,
    
    // Acciones
    createTask,
    updateTask,
    deleteTask,
    getTaskProgressFromQuery: store.getTaskProgressFromQuery,
  };
};