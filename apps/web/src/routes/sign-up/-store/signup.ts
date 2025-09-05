import { create } from "zustand"
import { persist } from "zustand/middleware"

import { type UserRole } from "@/types/userRole"

interface SignupStore {
  selectedRole: UserRole | null
  setSelectedRole: (role?: UserRole | null) => void
}

export const signupStore = create<SignupStore>()(
  persist(
    (set) => ({
      selectedRole: null,
      setSelectedRole: (role?: UserRole | null) => set({ selectedRole: role }),
    }),
    {
      name: "signup-store",
      partialize: (state) => ({
        selectedRole: state.selectedRole,
      }),
    },
  ),
)
