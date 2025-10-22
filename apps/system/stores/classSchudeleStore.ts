import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Schedule {
  _id: string;
  schoolId: string;
  name: string;
  day: "lun." | "mar." | "mié." | "jue." | "vie.";
  startTime: string;
  endTime: string;
  status: "active" | "inactive";
  updatedAt: number;
}

export interface ClassItem {
  _id: string;
  classCatalogId: string;
  name: string;
  status: "active" | "inactive";
  schoolCycleId?: string; // Hacer opcional
  schoolCycle?: {         // Hacer opcional
    _id: string;
    name: string;
    startDate?: number;
    endDate?: number;
  };
  subject?: {
    _id: string;
    name: string;
    credits?: number;
  } | null;
  classroom?: {
    _id: string;
    name: string;
    location?: string;
    capacity: number;
  } | null;
  teacher?: {
    _id: string;
    name: string;
    lastName?: string;
    email: string;
  } | null;
  group?: {
    _id: string;
    name: string;
    grade: string;
  } | null;
  selectedScheduleIds: string[];
  schedules: (Schedule & { relationId: string } | null)[];
  relationIds: string[];
  [key: string]: unknown; // Para compatibilidad con CrudDialog
}

interface ClassScheduleState {
  // Estado de datos
  classes: ClassItem[];
  loading: boolean;
  error: string | null;

  // Estado de filtros y búsqueda
  filter: "all" | "active" | "inactive";
  searchTerm: string;

  // Estado de formularios
  isCreateFormOpen: boolean;
  isEditFormOpen: boolean;
  isViewFormOpen: boolean;
  selectedClass: ClassItem | null;

  // Estado de operaciones
  creating: boolean;
  updating: boolean;

  // Acciones de datos
  setClasses: (classes: ClassItem[]) => void;
  addClass: (classItem: ClassItem) => void;
  updateClass: (id: string, classItem: ClassItem) => void;
  updateClassCatalogId: (oldClassId: string, newClassId: string, classItem: ClassItem) => void;
  updateClassStatus: (id: string, status: "active" | "inactive") => void;
  deleteClass: (id: string) => void;
  removeDuplicates: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones de filtros
  setFilter: (filter: "all" | "active" | "inactive") => void;
  setSearchTerm: (term: string) => void;

  // Acciones de formularios
  openCreateForm: () => void;
  closeCreateForm: () => void;
  openEditForm: (classItem: ClassItem) => void;
  closeEditForm: () => void;
  openViewForm: (classItem: ClassItem) => void;
  closeViewForm: () => void;

  // Acciones de operaciones
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
}

export const useClassScheduleStore = create<ClassScheduleState>()(
  devtools(
    (set) => ({
      // Estado inicial
      classes: [],
      loading: false,
      error: null,
      filter: "all",
      searchTerm: "",
      isCreateFormOpen: false,
      isEditFormOpen: false,
      isViewFormOpen: false,
      selectedClass: null,
      creating: false,
      updating: false,

      // Acciones de datos
      setClasses: (classes) => set({ classes }),
      addClass: (classItem) =>
        set((state) => ({
          classes: [...state.classes, classItem],
        })),
      updateClass: (id, classItem) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c._id === id ? classItem : c
          ),
        })),
      updateClassCatalogId: (oldClassId, newClassId, classItem) =>
        set((state) => {
          // Si el nuevo ID ya existe, reemplazarlo; si no, actualizar el existente
          const existingIndex = state.classes.findIndex(c => c._id === newClassId);
          const oldIndex = state.classes.findIndex(c => c._id === oldClassId);
          
          if (existingIndex !== -1) {
            // Si el nuevo ID ya existe, reemplazarlo y eliminar el viejo
            const newClasses = [...state.classes];
            newClasses[existingIndex] = { ...classItem, _id: newClassId, classCatalogId: newClassId };
            if (oldIndex !== -1 && oldIndex !== existingIndex) {
              newClasses.splice(oldIndex, 1);
            }
            return { classes: newClasses };
          } else {
            // Si el nuevo ID no existe, actualizar el existente
            return {
              classes: state.classes.map((c) =>
                c._id === oldClassId ? { ...classItem, _id: newClassId, classCatalogId: newClassId } : c
              ),
            };
          }
        }),
      updateClassStatus: (id, status) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c._id === id ? { ...c, status } : c
          ),
        })),
      deleteClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c._id !== id),
        })),
      removeDuplicates: () =>
        set((state) => {
          const uniqueClasses = state.classes.filter((classItem, index, self) =>
            index === self.findIndex(c => c._id === classItem._id)
          );
          return { classes: uniqueClasses };
        }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Acciones de filtros
      setFilter: (filter) => set({ filter }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),

      // Acciones de formularios
      openCreateForm: () => set({ isCreateFormOpen: true }),
      closeCreateForm: () => set({ isCreateFormOpen: false }),
      openEditForm: (selectedClass) =>
        set({ isEditFormOpen: true, selectedClass }),
      closeEditForm: () =>
        set({ isEditFormOpen: false, selectedClass: null }),
      openViewForm: (selectedClass) =>
        set({ isViewFormOpen: true, selectedClass }),
      closeViewForm: () =>
        set({ isViewFormOpen: false, selectedClass: null }),

      // Acciones de operaciones
      setCreating: (creating) => set({ creating }),
      setUpdating: (updating) => set({ updating }),
    }),
    {
      name: "class-schedule-store",
    }
  )
);

// Selectores derivados
export const useFilteredClasses = (classS: ClassItem[] | null | undefined) => {
  const { filter, searchTerm } = useClassScheduleStore();
  
  return (classS?.filter(Boolean) || []).filter((classItem) => {
    const matchesFilter =
      filter === "all" || classItem.status === filter;
    
    const matchesSearch = searchTerm === "" ||
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.teacher?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
};

export const useClassStats = () => {
  const { classes } = useClassScheduleStore();
  
  return {
    total: classes.length,
    active: classes.filter((c) => c.status === "active").length,
    inactive: classes.filter((c) => c.status === "inactive").length,
  };
};