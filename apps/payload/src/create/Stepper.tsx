'use client'
import React, { useState } from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { SignUp } from './Auth/SignUp'
import { SignIn } from './Auth/SignIn'
import SchoolForm from './SchoolForm'
import { Prices } from './Prices/Prices'
// usa el componente genérico (no el de blocks)
import PayNowButton from '@/components/PayNowButton'

const { Stepper: StepperUi, useStepper } = defineStepper(
  { id: 'step-1', title: 'Paso 1', description: 'Iniciar sesión para continuar', icon: <User /> },
  { id: 'step-2', title: 'Paso 2', description: 'Ingresar datos de la escuela', icon: <School /> },
  { id: 'step-3', title: 'Paso 3', description: 'Selecciona el Precio', icon: <School /> },
  { id: 'step-4', title: 'Paso 4', description: 'Realizar pagos', icon: <CopySlash /> },
)

export const Stepper: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth()
  const [ready, setReady] = useState(false)
  const [isSelect, setSelected] = useState<string>()

  const onSelect = (idStripe: string) => {
    setSelected(idStripe)
  }

  return (
    <StepperUi.Provider className="space-y-4" labelOrientation="vertical">
      {({ methods }) => {
        React.useEffect(() => {
          if (isLoaded) {
            if (isSignedIn && methods.current.id === 'step-1') methods.next()
            setReady(true)
          }
        }, [isSignedIn, isLoaded, methods])

        if (!ready) return null

        return (
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
              'step-1': () => <ClerkComponent />,
              'step-2': () => <SchoolForm />,
              'step-3': () => <Prices onSelect={onSelect} />,
              'step-4': (step) => <Content priceId={isSelect!} />,
            })}

            <StepperUi.Controls>
              {!methods.isFirst && (
                <Button onClick={methods.isLast ? () => {} : methods.next}>
                  {methods.isLast ? 'Finalizar' : 'Siguiente'}
                </Button>
              )}
            </StepperUi.Controls>
          </>
        )
      }}
    </StepperUi.Provider>
  )
}

interface ContentProps {
  priceId: string
}
const Content: React.FC<ContentProps> = (props) => {
  return (
    <StepperUi.Panel className="h-[200px] content-center rounded border bg-secondary text-secondary-foreground p-8">
      <p className="text-xl font-normal mb-4">
        Estás a punto de salir a una página externa para pagar. No cierres esta ventana.
      </p>

      <PayNowButton priceId={props.priceId} />
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
