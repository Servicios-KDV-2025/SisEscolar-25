import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarStore {
    expandedSections: Record<string, boolean>
    toggleSection: (key: string) => void
}

export const useSidebarStore = create(
    persist<SidebarStore>(
        (set) => ({
            expandedSections: {},
            toggleSection: (key) =>
                set((state) => ({
                    expandedSections: {
                        ...state.expandedSections,
                        [key]: !state.expandedSections[key],
                    },
                }))

        }),
        {
            name: "sidebar-store",
        }
    )
)