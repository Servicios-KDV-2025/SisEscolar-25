import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import React from 'react';

// Función auxiliar para limpiar mensajes de error de Convex
const cleanConvexError = (error: unknown): string => {
  if (error instanceof Error) {
    // Limpiar el mensaje de error de Convex para mostrar solo el mensaje relevante
    // Patrón: [CONVEX M(functions/student:createStudent)] [Request ID: xxxx] Server Error Uncaught Error: MENSAJE Called by client
    return error.message
      .replace(/^\[CONVEX.*?\]\s*/, '') // Remover [CONVEX M(functions/...)]
      .replace(/\[Request ID:.*?\]\s*/, '') // Remover [Request ID: ...]
      .replace(/Server Error\s*/, '') // Remover "Server Error"
      .replace(/Uncaught Error:\s*/, '') // Remover "Uncaught Error:"
      .replace(/\s*Called by client$/, '') // Remover "Called by client" al final
      .trim();
  }
  return 'Error desconocido';
};

// Tipos para el estudiante basados en el schema
export interface Student {
  studentClassId?: Id<'studentClass'>;
  _id: Id<"student">;
  schoolId: Id<"school">;
  groupId: Id<"group">;
  tutorId: Id<"user">;
  schoolCycleId?: Id<"schoolCycle">;
  enrollment: string;
  name: string;
  lastName?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  status: 'active' | 'inactive';
  scholarshipType: 'active' | 'inactive';
  scholarshipPercentage?: number;
  createdAt: number;
  updatedAt: number;
}

// Tipos para crear estudiante
export interface CreateStudentData {
  schoolId: Id<"school">;
  groupId: Id<"group">;
  tutorId: Id<"user">;
  schoolCycleId: Id<"schoolCycle">;
  enrollment: string;
  name: string;
  lastName?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  status?: 'active' | 'inactive';
  scholarshipType?: 'active' | 'inactive';
  scholarshipPercentage?: number;
}

// Tipos para actualizar estudiante
export interface UpdateStudentData {
  name?: string;
  lastName?: string;
  enrollment?: string;
  groupId?: Id<"group">;
  tutorId?: Id<"user">;
  schoolCycleId?: Id<"schoolCycle">;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  status?: 'active' | 'inactive';
  scholarshipType?: 'active' | 'inactive';
  scholarshipPercentage?: number;
}

// Filtros para búsqueda de estudiantes
export interface StudentFilters {
  schoolId?: Id<"school">;
  groupId?: Id<"group">;
  tutorId?: Id<"user">;
  status?: 'active' | 'inactive';
  searchTerm?: string; // Para buscar por nombre o matrícula
}

// Estado del store
interface StudentState {
  // Listas de estudiantes
  students: Student[];
  currentStudent: Student | null;
  filteredStudents: Student[];
  
  // Estados de carga
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Manejo de errores
  error: string | null;
  
  // Filtros actuales
  currentFilters: StudentFilters;
  
  // Acciones básicas del estado
  setStudents: (students: Student[]) => void;
  setCurrentStudent: (student: Student | null) => void;
  setFilteredStudents: (students: Student[]) => void;
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: StudentFilters) => void;
  clearError: () => void;
  
  // Acciones CRUD
  createStudent: (data: CreateStudentData) => Promise<Student | null>;
  updateStudent: (studentId: Id<"student">, data: UpdateStudentData) => Promise<Student | null>;
  updateStudentStatus: (studentId: Id<"student">, status: 'active' | 'inactive') => Promise<boolean>;
  deleteStudent: (studentId: Id<"student">) => Promise<boolean>;
  
  // Funciones de filtrado y búsqueda
  filterStudents: (filters: StudentFilters) => void;
  searchStudents: (searchTerm: string) => void;
  clearFilters: () => void;
  
  // Funciones utilitarias
  getStudentById: (studentId: Id<"student">) => Student | null;
  getStudentsByGroup: (groupId: Id<"group">) => Student[];
  getStudentsByTutor: (tutorId: Id<"user">) => Student[];
  
  // Reset del store
  reset: () => void;
}

// Store de Zustand
export const useStudentStore = create<StudentState>((set, get) => ({
  // Estado inicial
  students: [],
  currentStudent: null,
  filteredStudents: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  currentFilters: {},

  // Setters básicos
  setStudents: (students) => {
    set({ students });
    // Aplicar filtros actuales a la nueva lista
    const { currentFilters } = get();
    get().filterStudents(currentFilters);
  },
  setCurrentStudent: (student) => set({ currentStudent: student }),
  setFilteredStudents: (students) => set({ filteredStudents: students }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCreating: (creating) => set({ isCreating: creating }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setDeleting: (deleting) => set({ isDeleting: deleting }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ currentFilters: filters }),
  clearError: () => set({ error: null }),

  // Crear estudiante
  createStudent: async (data: CreateStudentData) => {
    console.log(data)
    set({ isCreating: true, error: null });
    
    try {
      // Esta función se implementará en el hook que usa Convex
      console.log('Creating student:', data);
      set({ isCreating: false });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear estudiante';
      set({ error: errorMessage, isCreating: false });
      return null;
    }
  },

  // Actualizar estudiante
  updateStudent: async (studentId: Id<"student">, data: UpdateStudentData) => {
    console.log(data)
    set({ isUpdating: true, error: null });
    
    try {
      // Esta función se implementará en el hook que usa Convex
      console.log('Updating student:', studentId, data);
      set({ isUpdating: false });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar estudiante';
      set({ error: errorMessage, isUpdating: false });
      return null;
    }
  },

  // Actualizar estado del estudiante
  updateStudentStatus: async (studentId: Id<"student">, status: 'active' | 'inactive') => {
    console.log(studentId)
    console.log(status)
    set({ isUpdating: true, error: null });
    
    try {
      // Esta función se implementará en el hook que usa Convex
      console.log('Updating student status:', studentId, status);
      set({ isUpdating: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar estado del estudiante';
      set({ error: errorMessage, isUpdating: false });
      return false;
    }
  },

  // Eliminar estudiante
  deleteStudent: async (studentId: Id<"student">) => {
    console.log(studentId)
    set({ isDeleting: true, error: null });
    
    try {
      // Esta función se implementará en el hook que usa Convex
      console.log('Deleting student:', studentId);
      set({ isDeleting: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar estudiante';
      set({ error: errorMessage, isDeleting: false });
      return false;
    }
  },

  // Filtrar estudiantes
  filterStudents: (filters: StudentFilters) => {
    const { students } = get();
    let filtered = [...students];

    // Filtrar por grupo
    if (filters.groupId) {
      filtered = filtered.filter(student => student.groupId === filters.groupId);
    }

    // Filtrar por tutor
    if (filters.tutorId) {
      filtered = filtered.filter(student => student.tutorId === filters.tutorId);
    }

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(student => student.status === filters.status);
    }

    // Filtrar por término de búsqueda (nombre o matrícula)
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        (student.lastName && student.lastName.toLowerCase().includes(searchTerm)) ||
        student.enrollment.toLowerCase().includes(searchTerm)
      );
    }

    set({ filteredStudents: filtered, currentFilters: filters });
  },

  // Buscar estudiantes por término
  searchStudents: (searchTerm: string) => {
    const { currentFilters } = get();
    get().filterStudents({ ...currentFilters, searchTerm });
  },

  // Limpiar filtros
  clearFilters: () => {
    const { students } = get();
    set({ 
      filteredStudents: students, 
      currentFilters: {} 
    });
  },

  // Obtener estudiante por ID
  getStudentById: (studentId: Id<"student">) => {
    const { students } = get();
    return students.find(student => student._id === studentId) || null;
  },

  // Obtener estudiantes por grupo
  getStudentsByGroup: (groupId: Id<"group">) => {
    const { students } = get();
    return students.filter(student => student.groupId === groupId);
  },

  // Obtener estudiantes por tutor
  getStudentsByTutor: (tutorId: Id<"user">) => {
    const { students } = get();
    return students.filter(student => student.tutorId === tutorId);
  },

  // Reset del store
  reset: () => set({
    students: [],
    currentStudent: null,
    filteredStudents: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    currentFilters: {},
  }),
}));

// Hook que combina Zustand con Convex para operaciones CRUD
export const useStudentWithConvex = (
  schoolId?: Id<"school">, 
  groupId?: Id<"group">,
  roleFilters?: { canViewAll: boolean; tutorId?: Id<"user">; teacherId?: Id<"user"> }
) => {
  const store = useStudentStore();
  
  // Queries de Convex con filtros por rol
  const studentsWithRoleFilter = useQuery(
    api.functions.student.getStudentsWithRoleFilter,
    schoolId && roleFilters ? { 
      schoolId, 
      canViewAll: roleFilters.canViewAll,
      tutorId: roleFilters.tutorId,
      teacherId: roleFilters.teacherId
    } : 'skip'
  );
  
  // Query por grupo (solo si se especifica)
  const studentsByGroup = useQuery(
    api.functions.student.getStudentsByGroup,
    groupId ? { groupId } : 'skip'
  );
  
  // Mutations de Convex
  const createStudentMutation = useMutation(api.functions.student.createStudent);
  const updateStudentMutation = useMutation(api.functions.student.updateStudent);
  const updateStudentStatusMutation = useMutation(api.functions.student.updateStudentStatus);
  const deleteStudentMutation = useMutation(api.functions.student.deleteStudent);

  // Actualizar el store cuando cambien los datos
  React.useEffect(() => {
    if (studentsWithRoleFilter) {
      store.setStudents(studentsWithRoleFilter);
    }
  }, [studentsWithRoleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (studentsByGroup) {
      store.setStudents(studentsByGroup);
    }
  }, [studentsByGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para crear estudiante
  const createStudent = React.useCallback(async (data: CreateStudentData) => {
    try {
      store.setCreating(true);
      store.clearError();
      
      const result = await createStudentMutation(data);
      
      if (result && result.studentId) {
        // La mutación devuelve un objeto complejo, extraemos el studentId
        const newStudent: Student = {
          _id: result.studentId,
          schoolId: data.schoolId,
          groupId: data.groupId,
          tutorId: data.tutorId,
          schoolCycleId: data.schoolCycleId,
          enrollment: data.enrollment,
          name: data.name,
          lastName: data.lastName,
          birthDate: data.birthDate,
          admissionDate: data.admissionDate,
          imgUrl: data.imgUrl,
          status: data.status || 'active',
          scholarshipType: data.scholarshipType || 'inactive',
          scholarshipPercentage: data.scholarshipPercentage,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        // Actualizar la lista local
        const currentStudents = useStudentStore.getState().students;
        store.setStudents([...currentStudents, newStudent]);
        
        store.setCreating(false);
        return newStudent;
      }
      
      store.setCreating(false);
      return null;
    } catch (error) {
      const errorMessage = cleanConvexError(error) || 'Error al crear estudiante';
      store.setError(errorMessage);
      store.setCreating(false);
      return null;
    }
  }, [createStudentMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para actualizar estudiante
  const updateStudent = React.useCallback(async (studentId: Id<"student">, data: UpdateStudentData) => {
    try {
      store.setUpdating(true);
      store.clearError();
      
      await updateStudentMutation({
        studentId,
        patch: data
      });
      
      // Actualizar la lista local
      const currentStudents = useStudentStore.getState().students;
      const updatedStudents = currentStudents.map(student => 
        student._id === studentId 
          ? { ...student, ...data, updatedAt: Date.now() }
          : student
      );
      store.setStudents(updatedStudents);
      
      // Actualizar estudiante actual si es el mismo
      const currentStudent = useStudentStore.getState().currentStudent;
      if (currentStudent && currentStudent._id === studentId) {
        store.setCurrentStudent({ ...currentStudent, ...data, updatedAt: Date.now() });
      }
      
      store.setUpdating(false);
      return updatedStudents.find(s => s._id === studentId) || null;
    } catch (error) {
      const errorMessage = cleanConvexError(error) || 'Error al actualizar estudiante';
      store.setError(errorMessage);
      store.setUpdating(false);
      return null;
    }
  }, [updateStudentMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para actualizar estado del estudiante
  const updateStudentStatus = React.useCallback(async (studentId: Id<"student">, status: 'active' | 'inactive') => {
    try {
      store.setUpdating(true);
      store.clearError();
      
      await updateStudentStatusMutation({
        studentId,
        status
      });
      
      // Actualizar la lista local
      const currentStudents = useStudentStore.getState().students;
      const updatedStudents = currentStudents.map(student => 
        student._id === studentId 
          ? { ...student, status, updatedAt: Date.now() }
          : student
      );
      store.setStudents(updatedStudents);
      
      // Actualizar estudiante actual si es el mismo
      const currentStudent = useStudentStore.getState().currentStudent;
      if (currentStudent && currentStudent._id === studentId) {
        store.setCurrentStudent({ ...currentStudent, status, updatedAt: Date.now() });
      }
      
      store.setUpdating(false);
      return true;
    } catch (error) {
      const errorMessage = cleanConvexError(error) || 'Error al actualizar estado del estudiante';
      store.setError(errorMessage);
      store.setUpdating(false);
      return false;
    }
  }, [updateStudentStatusMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para eliminar estudiante
  const deleteStudent = React.useCallback(async (studentId: Id<"student">) => {
    try {
      store.setDeleting(true);
      store.clearError();
      
      await deleteStudentMutation({ id: studentId });
      
      // Remover de la lista local
      const currentStudents = useStudentStore.getState().students;
      const updatedStudents = currentStudents.filter(student => student._id !== studentId);
      store.setStudents(updatedStudents);
      
      // Limpiar estudiante actual si es el mismo
      const currentStudent = useStudentStore.getState().currentStudent;
      if (currentStudent && currentStudent._id === studentId) {
        store.setCurrentStudent(null);
      }
      
      store.setDeleting(false);
      return true;
    } catch (error) {
      const errorMessage = cleanConvexError(error) || 'Error al eliminar estudiante';
      store.setError(errorMessage);
      store.setDeleting(false);
      return false;
    }
  }, [deleteStudentMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  return React.useMemo(() => ({
    // Estado del store
    students: store.students,
    filteredStudents: store.filteredStudents,
    currentStudent: store.currentStudent,
    isLoading: store.isLoading || (schoolId && roleFilters ? !studentsWithRoleFilter : false) || (groupId ? !studentsByGroup : false),
    isCreating: store.isCreating,
    isUpdating: store.isUpdating,
    isDeleting: store.isDeleting,
    error: store.error,
    currentFilters: store.currentFilters,
    
    // Acciones CRUD
    createStudent,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    
    // Acciones de filtrado
    filterStudents: store.filterStudents,
    searchStudents: store.searchStudents,
    clearFilters: store.clearFilters,
    
    // Funciones utilitarias
    getStudentById: store.getStudentById,
    getStudentsByGroup: store.getStudentsByGroup,
    getStudentsByTutor: store.getStudentsByTutor,
    
    // Acciones del estado
    setCurrentStudent: store.setCurrentStudent,
    clearError: store.clearError,
    reset: store.reset,
  }), [ // eslint-disable-line react-hooks/exhaustive-deps
    store.students,
    store.filteredStudents,
    store.currentStudent,
    store.isLoading,
    store.isCreating,
    store.isUpdating,
    store.isDeleting,
    store.error,
    store.currentFilters,
    studentsWithRoleFilter,
    studentsByGroup,
    createStudent,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    store.filterStudents,
    store.searchStudents,
    store.clearFilters,
    store.getStudentById,
    store.getStudentsByGroup,
    store.getStudentsByTutor,
    store.setCurrentStudent,
    store.clearError,
    store.reset,
  ]);
};

// Hook para usar solo el store sin Convex (para casos donde no se necesitan queries automáticas)
export const useStudentStoreOnly = () => {
  return useStudentStore();
};

// Hook especializado para obtener un estudiante específico
export const useStudentById = (studentId?: Id<"student">) => {
  const student = useQuery(
    api.functions.student.getStudentById,
    studentId ? { id: studentId } : 'skip'
  );
  
  const store = useStudentStore();
  
  React.useEffect(() => {
    if (student) {
      store.setCurrentStudent(student);
    }
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    student,
    isLoading: !student && studentId,
    setCurrentStudent: store.setCurrentStudent,
  };
};

// Hook que combina permisos y estudiantes para facilitar el uso en componentes
export const useStudentsWithPermissions = (
  schoolId?: Id<"school">, 
  getStudentFilters?: () => { canViewAll: boolean; tutorId?: Id<"user">; teacherId?: Id<"user"> }
) => {
  const studentFilters = React.useMemo(() => {
    return getStudentFilters?.() || { canViewAll: false };
  }, [getStudentFilters]);

  return useStudentWithConvex(schoolId, undefined, studentFilters);
};
