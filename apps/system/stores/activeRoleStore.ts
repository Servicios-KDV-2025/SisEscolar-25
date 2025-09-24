import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor';

interface ActiveRoleState {
  // Mapa de schoolId -> rol activo
  activeRoles: Record<string, UserRole | null>;
  
  // Acciones
  setActiveRole: (schoolId: string, role: UserRole | null) => void;
  getActiveRole: (schoolId: string) => UserRole | null;
  clearActiveRole: (schoolId: string) => void;
  clearAllActiveRoles: () => void;
}

export const useActiveRoleStore = create<ActiveRoleState>()(
  persist(
    (set, get) => ({
      activeRoles: {},
      
      setActiveRole: (schoolId: string, role: UserRole | null) => {
        console.log('ActiveRoleStore - setting active role:', { schoolId, role });
        set((state) => {
          const newState = {
            activeRoles: {
              ...state.activeRoles,
              [schoolId]: role,
            },
          };
          console.log('ActiveRoleStore - new state:', newState);
          return newState;
        });
      },
      
      getActiveRole: (schoolId: string) => {
        const state = get();
        const role = state.activeRoles[schoolId] || null;
        console.log('ActiveRoleStore - getting active role:', { schoolId, role });
        console.log('ActiveRoleStore - full state:', state.activeRoles);
        return role;
      },
      
      clearActiveRole: (schoolId: string) => {
        console.log('ActiveRoleStore - clearing active role for school:', schoolId);
        set((state) => {
          const newActiveRoles = { ...state.activeRoles };
          delete newActiveRoles[schoolId];
          return { activeRoles: newActiveRoles };
        });
      },
      
      clearAllActiveRoles: () => {
        console.log('ActiveRoleStore - clearing all active roles');
        set({ activeRoles: {} });
      },
    }),
    {
      name: 'active-roles-storage', // nombre único para el localStorage
      // Solo persistir el estado, no las funciones
      partialize: (state) => ({ activeRoles: state.activeRoles }),
    }
  )
);
