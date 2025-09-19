import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Id } from '@repo/convex/convex/_generated/dataModel';

export interface Rubric {
  _id: Id<"gradeRubric">;
  _creationTime: number;
  classCatalogId: Id<"classCatalog">;
  termId: Id<"term">;
  name: string;
  weight: number;
  maxScore: number;
  createdBy: Id<"user">;
  status: boolean;
  classCatalogName?: string;
  termName?: string;
  schoolCycleName?: string;
  schoolCycleStatus?: string;
}

export interface RubricPercentage {
  totalPercentage: number;
  availablePercentage: number;
  rubricsCount: number;
}

export interface RubricFormData {
  name: string;
  weight: number[];
  maxScore: number;
  schoolCycle: string;
  class: string;
  term: string;
}

interface GradeRubricStore {
  // Estado de filtros
  selectedSchoolCycle: string;
  selectedClass: string;
  selectedTerm: string;
  selectedClassSchoolCycleName: string;

  // Estado de datos
  rubrics: Rubric[];
  allRubrics: Rubric[];
  filteredRubrics: Rubric[];
  rubricPercentage: RubricPercentage | null;
  isLoading: boolean;

  // Estado del modal
  isModalOpen: boolean;
  editingRubric: Rubric | null;
  formData: RubricFormData;

  // Acciones de filtros
  setSelectedSchoolCycle: (cycleId: string) => void;
  setSelectedClass: (classId: string) => void;
  setSelectedTerm: (termId: string) => void;
  setSelectedClassSchoolCycleName: (name: string) => void;
  clearFilters: () => void;

  // Acciones de datos
  setRubrics: (rubrics: Rubric[]) => void;
  setAllRubrics: (rubrics: Rubric[]) => void;
  setFilteredRubrics: (rubrics: Rubric[]) => void;
  setRubricPercentage: (percentage: RubricPercentage | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Acciones del modal
  setModalOpen: (open: boolean) => void;
  setEditingRubric: (rubric: Rubric | null) => void;
  setFormData: (data: Partial<RubricFormData>) => void;
  resetForm: () => void;

  // Acciones de rúbricas
  addRubric: (rubric: Rubric) => void;
  updateRubric: (rubricId: Id<"gradeRubric">, updates: Partial<Rubric>) => void;
  removeRubric: (rubricId: Id<"gradeRubric">) => void;

  // Cálculos
  getTotalWeight: () => number;
  getAvailableWeight: () => number;
  canActivateRubric: (rubricId: Id<"gradeRubric">) => boolean;
  canCreateRubric: () => boolean;
  getValidationMessage: () => string | null;
  isNameDuplicate: (name: string, excludeId?: Id<"gradeRubric">) => boolean;
  getDuplicateInfo: (name: string, excludeId?: Id<"gradeRubric">) => { isDuplicate: boolean; duplicateRubric?: Rubric };
}

const initialFormData: RubricFormData = {
  name: "",
  weight: [50],
  maxScore: 100,
  schoolCycle: "",
  class: "",
  term: "",
};

export const useGradeRubricStore = create<GradeRubricStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      selectedSchoolCycle: "",
      selectedClass: "",
      selectedTerm: "",
      selectedClassSchoolCycleName: "",
      rubrics: [],
      allRubrics: [],
      filteredRubrics: [],
      rubricPercentage: null,
      isLoading: false,
      isModalOpen: false,
      editingRubric: null,
      formData: initialFormData,

      // Acciones de filtros
      setSelectedSchoolCycle: (cycleId: string) => {
        set({ selectedSchoolCycle: cycleId });
        // Limpiar filtros dependientes
        set({ selectedClass: "", selectedTerm: "", selectedClassSchoolCycleName: "" });
      },

      setSelectedClass: (classId: string) => {
        set({ selectedClass: classId });
        // Limpiar término cuando cambia la clase
        set({ selectedTerm: "" });
      },

      setSelectedTerm: (termId: string) => {
        set({ selectedTerm: termId });
      },

      setSelectedClassSchoolCycleName: (name: string) => {
        set({ selectedClassSchoolCycleName: name });
      },

      clearFilters: () => {
        set({
          selectedClass: "",
          selectedTerm: "",
          selectedClassSchoolCycleName: "",
        });
      },

      // Acciones de datos
      setRubrics: (rubrics: Rubric[]) => {
        set({ rubrics });
      },

      setAllRubrics: (rubrics: Rubric[]) => {
        set({ allRubrics: rubrics });
      },

      setFilteredRubrics: (rubrics: Rubric[]) => {
        set({ filteredRubrics: rubrics });
      },

      setRubricPercentage: (percentage: RubricPercentage | null) => {
        set({ rubricPercentage: percentage });
      },

      setIsLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Acciones del modal
      setModalOpen: (open: boolean) => {
        set({ isModalOpen: open });
        if (!open) {
          set({ editingRubric: null, formData: initialFormData });
        }
      },

      setEditingRubric: (rubric: Rubric | null) => {
        set({ editingRubric: rubric });
        if (rubric) {
          set({
            formData: {
              name: rubric.name,
              weight: [Math.round(rubric.weight * 100)],
              maxScore: rubric.maxScore,
              schoolCycle: rubric.schoolCycleName || "",
              class: rubric.classCatalogId as string,
              term: rubric.termId as string,
            },
          });
        }
      },

      setFormData: (data: Partial<RubricFormData>) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      resetForm: () => {
        set({ formData: initialFormData, editingRubric: null });
      },

      // Acciones de rúbricas
      addRubric: (rubric: Rubric) => {
        set((state) => ({
          allRubrics: [...state.allRubrics, rubric],
          rubrics: state.selectedClass && state.selectedTerm 
            ? state.rubrics 
            : [...state.rubrics, rubric],
        }));
      },

      updateRubric: (rubricId: Id<"gradeRubric">, updates: Partial<Rubric>) => {
        set((state) => {
          const updateRubricInArray = (rubrics: Rubric[]) =>
            rubrics.map((rubric) =>
              rubric._id === rubricId ? { ...rubric, ...updates } : rubric
            );

          return {
            allRubrics: updateRubricInArray(state.allRubrics),
            rubrics: updateRubricInArray(state.rubrics),
            filteredRubrics: updateRubricInArray(state.filteredRubrics),
          };
        });
      },

      removeRubric: (rubricId: Id<"gradeRubric">) => {
        set((state) => ({
          allRubrics: state.allRubrics.filter((r) => r._id !== rubricId),
          rubrics: state.rubrics.filter((r) => r._id !== rubricId),
          filteredRubrics: state.filteredRubrics.filter((r) => r._id !== rubricId),
        }));
      },

      // Cálculos
      getTotalWeight: () => {
        const state = get();
        // Solo calcular cuando hay filtros específicos de materia y período
        if (state.selectedClass && state.selectedTerm && state.rubricPercentage) {
          return state.rubricPercentage.totalPercentage;
        }
        // Si no hay filtros específicos, no mostrar porcentaje (vista general)
        return null;
      },

      getAvailableWeight: () => {
        const state = get();
        
        // Si hay datos de formulario, calcular manualmente (esto incluye cuando se está editando)
        if (state.formData.class && state.formData.term) {
          // Filtrar rúbricas de la misma clase y período del formulario
          const sameClassAndTermRubrics = state.rubrics.filter(rubric => 
            rubric.classCatalogId === state.formData.class && 
            rubric.termId === state.formData.term &&
            rubric.status &&
            rubric._id !== state.editingRubric?._id
          );
          
          const usedWeight = sameClassAndTermRubrics.reduce((sum, rubric) => 
            sum + Math.round(rubric.weight * 100), 0
          );
          
          return Math.max(0, 100 - usedWeight);
        }
        
        // Si hay filtros específicos pero no hay datos de formulario, usar el cálculo de la consulta
        if (state.selectedClass && state.selectedTerm && state.rubricPercentage) {
          return Math.max(0, state.rubricPercentage.availablePercentage);
        }
        
        // Si no hay datos suficientes, no hay restricciones
        return null;
      },

      canActivateRubric: (rubricId: Id<"gradeRubric">) => {
        const state = get();
        const rubricToCheck = state.rubrics.find((r) => r._id === rubricId);
        if (!rubricToCheck || rubricToCheck.status) return true;

        // Si hay filtros específicos, usar el cálculo de la consulta
        if (state.selectedClass && state.selectedTerm && state.rubricPercentage) {
          const newWeight = Math.round(rubricToCheck.weight * 100);
          return state.rubricPercentage.availablePercentage >= newWeight;
        }

        // Si no hay filtros específicos, calcular manualmente para la clase y período de la rúbrica
        const sameClassAndTermRubrics = state.rubrics.filter(rubric => 
          rubric.classCatalogId === rubricToCheck.classCatalogId && 
          rubric.termId === rubricToCheck.termId &&
          rubric.status &&
          rubric._id !== rubricId
        );
        
        const usedWeight = sameClassAndTermRubrics.reduce((sum, rubric) => 
          sum + Math.round(rubric.weight * 100), 0
        );
        
        const newWeight = Math.round(rubricToCheck.weight * 100);
        return usedWeight + newWeight <= 100;
      },

      canCreateRubric: () => {
        const state = get();
        if (!state.formData.class || !state.formData.term) return false;
        
        // Siempre verificar restricciones basado en la clase y período del formulario
        const availableWeight = get().getAvailableWeight();
        if (availableWeight === null) return true; // Si no se puede calcular, permitir
        
        const newWeight = state.formData.weight[0] || 0;
        return availableWeight >= newWeight;
      },

      getValidationMessage: () => {
        const state = get();
        
        // Solo mostrar validaciones cuando hay datos de formulario
        if (!state.formData.class || !state.formData.term) {
          return null;
        }
        
        const availableWeight = get().getAvailableWeight();
        if (availableWeight === null) return null; // Si no se puede calcular, no mostrar mensaje
        
        const newWeight = state.formData.weight[0] || 0;
        
        if (availableWeight === 0) {
          return "No hay porcentaje disponible. Desactiva alguna rúbrica para liberar porcentaje.";
        }
        
        if (newWeight > availableWeight) {
          return `No se puede crear esta rúbrica. Solo hay ${availableWeight}% disponible, pero intentas usar ${newWeight}%.`;
        }
        
        if (availableWeight <= 10 && availableWeight > 0) {
          return `⚠️ Solo queda ${availableWeight}% disponible.`;
        }
        
        return null;
      },

      isNameDuplicate: (name: string, excludeId?: Id<"gradeRubric">) => {
        const state = get();
        const trimmedName = name.trim().toLowerCase();
        
        // Si no hay nombre, no es duplicado
        if (!trimmedName) {
          return false;
        }
        
        // Si estamos en modo de edición y tenemos datos del formulario
        if (state.editingRubric && state.formData.class && state.formData.term) {
          return state.allRubrics.some(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r.classCatalogId === state.formData.class &&
              r.termId === state.formData.term &&
              r._id !== excludeId
          );
        }
        
        // Si estamos creando una nueva rúbrica y tenemos datos del formulario
        if (state.formData.class && state.formData.term) {
          return state.allRubrics.some(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r.classCatalogId === state.formData.class &&
              r.termId === state.formData.term &&
              r._id !== excludeId
          );
        }
        
        // Si hay filtros específicos seleccionados (vista filtrada)
        if (state.selectedClass && state.selectedTerm) {
          return state.rubrics.some(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r._id !== excludeId
          );
        }
        
        // Si no hay contexto suficiente, no verificar duplicados
        return false;
      },

      getDuplicateInfo: (name: string, excludeId?: Id<"gradeRubric">) => {
        const state = get();
        const trimmedName = name.trim().toLowerCase();
        
        // Si no hay nombre, no es duplicado
        if (!trimmedName) {
          return { isDuplicate: false };
        }
        
        let duplicateRubric: Rubric | undefined;
        
        // Si estamos en modo de edición y tenemos datos del formulario
        if (state.editingRubric && state.formData.class && state.formData.term) {
          duplicateRubric = state.allRubrics.find(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r.classCatalogId === state.formData.class &&
              r.termId === state.formData.term &&
              r._id !== excludeId
          );
        }
        // Si estamos creando una nueva rúbrica y tenemos datos del formulario
        else if (state.formData.class && state.formData.term) {
          duplicateRubric = state.allRubrics.find(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r.classCatalogId === state.formData.class &&
              r.termId === state.formData.term &&
              r._id !== excludeId
          );
        }
        // Si hay filtros específicos seleccionados (vista filtrada)
        else if (state.selectedClass && state.selectedTerm) {
          duplicateRubric = state.rubrics.find(
            (r) =>
              r.name.toLowerCase() === trimmedName &&
              r._id !== excludeId
          );
        }
        
        return {
          isDuplicate: !!duplicateRubric,
          duplicateRubric
        };
      },
    }),
    {
      name: 'grade-rubric-store',
    }
  )
);
