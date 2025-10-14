'use client'

import React, { useState } from 'react'
import StepperWithContent from '@/components/StepperWithContent'
import PersonalInfoStep from '@/components/steps/PersonalInfoStep'
import DocumentUploadStep from '@/components/steps/DocumentUploadStep'
import ReviewConfirmStep from '@/components/steps/ReviewConfirmStep'

export default function RegisterPage() {
  const [registrationData, setRegistrationData] = useState({
    personalInfo: {},
    documents: {},
    confirmation: {}
  })
  const [currentStep, setCurrentStep] = useState(0)

  const handleStepDataChange = (stepKey: string, data: any) => {
    setRegistrationData(prev => ({
      ...prev,
      [stepKey]: data
    }))
  }

  const validatePersonalInfo = () => {
    const { firstName, lastName, email, phone } = registrationData.personalInfo as any
    return firstName && lastName && email && phone
  }

  const validateDocuments = () => {
    const { documents } = registrationData.documents as any
    return documents && documents.length >= 3 // Al menos 3 documentos obligatorios
  }

  const validateConfirmation = () => {
    const { confirmed } = registrationData.confirmation as any
    return confirmed === true
  }

  const handleComplete = async () => {
    try {
      // Aquí enviarías los datos al servidor
      console.log('Datos de registro:', registrationData)
      alert('¡Registro completado exitosamente!')
    } catch (error) {
      console.error('Error al completar registro:', error)
      alert('Error al procesar el registro. Inténtalo de nuevo.')
    }
  }

  const steps = [
    {
      id: 'personal-info',
      title: 'Información Personal',
      description: 'Completa tus datos básicos',
      content: (
        <PersonalInfoStep
          data={registrationData.personalInfo}
          onDataChange={(data) => handleStepDataChange('personalInfo', data)}
        />
      ),
      validation: validatePersonalInfo
    },
    {
      id: 'documents',
      title: 'Documentación',
      description: 'Sube los documentos requeridos',
      content: (
        <DocumentUploadStep
          data={registrationData.documents}
          onDataChange={(data) => handleStepDataChange('documents', data)}
        />
      ),
      validation: validateDocuments
    },
    {
      id: 'review',
      title: 'Revisión y Confirmación',
      description: 'Revisa y confirma tu información',
      content: (
        <ReviewConfirmStep
          data={registrationData}
          onDataChange={(data) => handleStepDataChange('confirmation', data)}
        />
      ),
      validation: validateConfirmation
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Estudiante</h1>
          <p className="mt-2 text-lg text-gray-600">
            Completa tu información para iniciar el proceso de inscripción
          </p>
        </div>

        <StepperWithContent
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={handleComplete}
          allowClickableSteps={true}
          showNavigation={true}
          showProgress={true}
          variant="numbered"
        />
      </div>
    </div>
  )
}