'use client'
import React from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { SignUp } from './SignUp'

const { Stepper: StepperUi } = defineStepper(
  {
    id: 'step-1',
    title: 'Paso 1',
    description: 'Iniciar sesión para continuar',
    icon: <User />,
  },
  {
    id: 'step-2',
    title: 'Paso 2',
    description: 'Ingresar datos de la escuela',
    icon: <School />,
  },
  {
    id: 'step-3',
    title: 'Paso 3',
    description: 'Realizar pagos',
    icon: <CopySlash />,
  },
)

export const Stepper: React.FC = () => {
  return (
    <StepperUi.Provider className="space-y-4" labelOrientation="vertical">
      {({ methods }) => (
        <>
          <StepperUi.Navigation>
            {methods.all.map((step, index) => (
              <StepperUi.Step of={step.id} key={index} icon={step.icon}>
                <StepperUi.Title>{step.title}</StepperUi.Title>
                <StepperUi.Description>{step.description}</StepperUi.Description>
              </StepperUi.Step>
            ))}
          </StepperUi.Navigation>
          {methods.switch({
            'step-1': (step) => <ClerkComponent />,
            'step-2': (step) => <Content id={step.id} />,
            'step-3': (step) => <Content id={step.id} />,
          })}
          <StepperUi.Controls>
            {!methods.isLast && (
              <Button variant="secondary" onClick={methods.prev} disabled={methods.isFirst}>
                Previous
              </Button>
            )}
            <Button onClick={methods.isLast ? methods.reset : methods.next}>
              {methods.isLast ? 'Reset' : 'Next'}
            </Button>
          </StepperUi.Controls>
        </>
      )}
    </StepperUi.Provider>
  )
}

const Content = ({ id }: { id: string }) => {
  return (
    <StepperUi.Panel className="h-[200px] content-center rounded border bg-secondary text-secondary-foreground p-8">
      <p className="text-xl font-normal">Content for {id}</p>
    </StepperUi.Panel>
  )
}

const ClerkComponent: React.FC = () => {
  const { isSignedIn } = useAuth()

  return <div className="container full-width">{!isSignedIn && <SignUp />}</div>
}
