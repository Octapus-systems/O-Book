import { create } from 'zustand'

interface SidebarStore {
  isOpen: boolean
  isMobile: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
  setMobile: (isMobile: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  isMobile: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  closeSidebar: () => set({ isOpen: false }),
  openSidebar: () => set({ isOpen: true }),
  setMobile: (isMobile) => set({ isMobile, isOpen: !isMobile }),
}))
