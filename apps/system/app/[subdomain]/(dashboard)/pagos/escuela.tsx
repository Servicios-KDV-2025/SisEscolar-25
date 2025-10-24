"use client"

import { StripeConnectOnboarding } from "../../../../components/stripe/StripeConnectOnboarding"
import { useCurrentSchool } from "../../../../stores/userSchoolsStore"
import { useUserWithConvex } from "../../../../stores/userStore"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function StripeConfigPage() {
  const { user: clerkUser } = useUser()
  const { currentUser } = useUserWithConvex(clerkUser?.id)
  const { currentSchool } = useCurrentSchool(currentUser?._id)
  
  // Loading state
  if (!currentUser || !currentSchool) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Pagos</h1>
      <StripeConnectOnboarding
        schoolId={currentSchool.school._id}
        schoolEmail={currentSchool.school.email}
      />
    </div>
  )
}