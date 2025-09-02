import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SignupStore {
  selectedRole: "hr_manager" | "candidate" | null
  setSelectedRole: (role?: "hr_manager" | "candidate" | null) => void
}

export const signupStore = create<SignupStore>()(
  persist(
    (set) => ({
      selectedRole: null,
      setSelectedRole: (role?: "hr_manager" | "candidate" | null) =>
        set({ selectedRole: role }),
    }),
    {
      name: "signup-store",
      partialize: (state) => ({
        selectedRole: state.selectedRole,
      }),
    },
  ),
)
