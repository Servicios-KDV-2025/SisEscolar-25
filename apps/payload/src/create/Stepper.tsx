'use client'
import React from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

import { SignUp } from './Auth/SignUp'
import { SignIn } from './Auth/SignIn'
import SchoolForm from './SchoolForm'
import { CheckoutButtonBlock } from '@/blocks/CheckoutButton/Component'

type CheckoutFromCMS = {
  priceId?: string
  buttonText?: string
  schoolName?: string
}

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

type StepperProps = { checkoutFromCMS?: CheckoutFromCMS | null }

// cambio: aceptar la prop con el bloque del CMS
export const Stepper: React.FC<StepperProps> = ({ checkoutFromCMS }) => {
  const { isSignedIn, isLoaded } = useAuth()
  const [ready, setReady] = React.useState(false)

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
              //   pasar checkoutFromCMS al contenido del paso 3
              'step-3': (step) => <Content id={step.id} checkoutFromCMS={checkoutFromCMS} />,
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

// recibir la prop y usar priceId del CMS
const Content = ({
  id,
  checkoutFromCMS,
}: {
  id: string
  checkoutFromCMS?: CheckoutFromCMS | null
}) => {
  return (
    <StepperUi.Panel className="h-[200px] content-center rounded border bg-secondary text-secondary-foreground p-8">
      <p className="text-xl font-normal mb-4">
        Estás a punto de salir a una página externa para pagar. No cierres esta ventana.
      </p>

      {!checkoutFromCMS?.priceId ? (
        <p className="text-sm text-muted-foreground">
          Configura el <b>priceId</b> en el CMS (bloque “Botón de Checkout”).
        </p>
      ) : (
        <CheckoutButtonBlock
          priceId={checkoutFromCMS.priceId}
          // endpoint="/api/checkout"  // usa esto si tu backend es /api/checkout
        />
      )}
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
