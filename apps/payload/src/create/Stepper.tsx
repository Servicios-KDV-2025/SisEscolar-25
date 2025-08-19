'use client'
import React, { useEffect } from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { SignOutButton, useAuth } from '@clerk/nextjs'
import { SignUp } from './SignUp'
import { SignIn } from './SignIn'
import { z } from '@repo/zod-config/index'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { Stepper: StepperUi, useStepper } = defineStepper(
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
  const { isSignedIn } = useAuth()

  return (
    <StepperUi.Provider
      className="space-y-4"
      labelOrientation="vertical"
      initialStep={isSignedIn ? 'step-2' : 'step-1'}
    >
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
            {!methods.isLast && !methods.isFirst && (
              <Button variant="secondary" onClick={methods.prev} disabled={methods.isFirst}>
                Previous
              </Button>
            )}

            {!methods.isFirst && (
              <Button onClick={methods.isLast ? () => {} : methods.next}>
                {methods.isLast ? 'Finalizar' : 'Siguiente'}
              </Button>
            )}
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
  const [showSignIn, setShowSignIn] = React.useState(false)
  const methods = useStepper()

  return showSignIn ? (
    <SignIn onBackToSignUp={() => setShowSignIn(false)} onClick={() => methods.next()} />
  ) : (
    <SignUp onSwitchToSignIn={() => setShowSignIn(true)} onClick={() => methods.next()} />
  )
}
