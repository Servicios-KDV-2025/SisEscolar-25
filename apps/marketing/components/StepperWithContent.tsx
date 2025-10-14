'use client'

import React, { useState, ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

export interface StepperStepWithContent {
  id: string
  title: string
  description?: string
  content: ReactNode  // Aquí va el componente
  completed?: boolean
  disabled?: boolean
  validation?: () => boolean | Promise<boolean>  // Validación opcional
}

export interface StepperWithContentProps {
  steps: StepperStepWithContent[]
  currentStep?: number
  onStepChange?: (stepIndex: number) => void
  onComplete?: () => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'numbered' | 'dots'
  className?: string
  allowClickableSteps?: boolean
  showNavigation?: boolean
  showProgress?: boolean
}

const StepperWithContent: React.FC<StepperWithContentProps> = ({
  steps,
  currentStep = 0,
  onStepChange,
  onComplete,
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  allowClickableSteps = false,
  showNavigation = true,
  showProgress = true
}) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState(currentStep)
  const [isValidating, setIsValidating] = useState(false)

  const activeStep = onStepChange ? currentStep : internalCurrentStep

  const handleStepClick = async (stepIndex: number) => {
    if (!allowClickableSteps || steps[stepIndex].disabled) return
    
    // Validar el paso actual antes de cambiar
    if (stepIndex > activeStep) {
      const isValid = await validateCurrentStep()
      if (!isValid) return
    }
    
    if (onStepChange) {
      onStepChange(stepIndex)
    } else {
      setInternalCurrentStep(stepIndex)
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentStepData = steps[activeStep]
    if (!currentStepData.validation) return true

    setIsValidating(true)
    try {
      const isValid = await currentStepData.validation()
      return isValid
    } catch (error) {
      console.error('Error en validación:', error)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      const isValid = await validateCurrentStep()
      if (isValid) {
        const nextStep = activeStep + 1
        if (onStepChange) {
          onStepChange(nextStep)
        } else {
          setInternalCurrentStep(nextStep)
        }
      }
    } else if (activeStep === steps.length - 1) {
      // Último paso - llamar onComplete si existe
      const isValid = await validateCurrentStep()
      if (isValid && onComplete) {
        onComplete()
      }
    }
  }

  const handlePrevious = () => {
    if (activeStep > 0) {
      const prevStep = activeStep - 1
      if (onStepChange) {
        onStepChange(prevStep)
      } else {
        setInternalCurrentStep(prevStep)
      }
    }
  }

  const getStepIcon = (step: StepperStepWithContent, index: number) => {
    if (step.completed || index < activeStep) {
      return <Check className="w-4 h-4 text-white" />
    }
    
    if (variant === 'numbered') {
      return <span className="text-sm font-medium">{index + 1}</span>
    }
    
    return null
  }

  const getStepClasses = (step: StepperStepWithContent, index: number) => {
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200"
    
    if (step.disabled) {
      return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`
    }
    
    if (step.completed || index < activeStep) {
      return `${baseClasses} bg-green-600 border-green-600 text-white`
    }
    
    if (index === activeStep) {
      return `${baseClasses} bg-blue-600 border-blue-600 text-white`
    }
    
    return `${baseClasses} bg-white border-gray-300 text-gray-500 ${allowClickableSteps ? 'hover:border-blue-400 cursor-pointer' : ''}`
  }

  const getConnectorClasses = (index: number) => {
    const baseClasses = orientation === 'horizontal' 
      ? "flex-1 h-0.5 mx-2" 
      : "w-0.5 h-8 mx-auto my-2"
    
    const isCompleted = index < activeStep || steps[index].completed
    const colorClasses = isCompleted ? "bg-green-600" : "bg-gray-300"
    
    return `${baseClasses} ${colorClasses} transition-colors duration-200`
  }

  const progressPercentage = ((activeStep + 1) / steps.length) * 100

  const containerClasses = orientation === 'horizontal' 
    ? `flex items-center ${className}`
    : `flex flex-col ${className}`

  return (
    <div className="w-full space-y-6">
      {/* Barra de Progreso */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Stepper Header */}
      <div className={containerClasses}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flex ${orientation === 'horizontal' ? 'flex-col items-center' : 'flex-row items-start'} ${
                allowClickableSteps && !step.disabled ? 'cursor-pointer' : ''
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div className={getStepClasses(step, index)}>
                {getStepIcon(step, index)}
              </div>
              
              <div className={`${orientation === 'horizontal' ? 'mt-2 text-center' : 'ml-3'}`}>
                <div className={`text-sm font-medium ${
                  index === activeStep 
                    ? 'text-blue-600' 
                    : index < activeStep || step.completed
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            
            {index < steps.length - 1 && orientation === 'horizontal' && (
              <div className={getConnectorClasses(index)} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {steps[activeStep]?.title}
            </h3>
            {steps[activeStep]?.description && (
              <p className="text-sm text-gray-600 mt-1">
                {steps[activeStep].description}
              </p>
            )}
          </div>
          
          {/* Contenido del paso actual */}
          <div className="min-h-[200px]">
            {steps[activeStep]?.content}
          </div>
        </div>

        {/* Navigation */}
        {showNavigation && (
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={handlePrevious}
              disabled={activeStep === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </button>

            <div className="text-sm text-gray-500">
              Paso {activeStep + 1} de {steps.length}
            </div>

            <button
              onClick={handleNext}
              disabled={isValidating}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                'Validando...'
              ) : activeStep === steps.length - 1 ? (
                'Finalizar'
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepperWithContent