'use client'
import React, { useState } from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { SignUp } from './Auth/SignUp'
import { SignIn } from './Auth/SignIn'
import { Prices } from './Prices/Prices'
// usa el componente genérico (no el de blocks)
import PayNowButton from '@/components/PayNowButton'
import SchoolForm from './School/SchoolForm'

const { Stepper: StepperUi, useStepper } = defineStepper(
  { id: 'step-1', title: 'Paso 1', description: 'Iniciar sesión para continuar', icon: <User /> },
  { id: 'step-2', title: 'Paso 2', description: 'Ingresar datos de la escuela', icon: <School /> },
  { id: 'step-3', title: 'Paso 3', description: 'Selecciona el Precio', icon: <School /> },
  { id: 'step-4', title: 'Paso 4', description: 'Realizar pagos', icon: <CopySlash /> },
)

export const Stepper: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth()
  const [ready, setReady] = useState(false)
  const [isSelect, setSelected] = useState<string>('')
  const [schooldId, setSchoolId] = useState<string>('')

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

        const onFihishStepSchool = (idSchool: string) => {
          alert(idSchool)
          setSchoolId(idSchool)
          methods.next()
        }

        const onSelectPrice = (idStripe: string) => {
          setSelected(idStripe)
          methods.next()
        }

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
              'step-2': () => <SchoolForm onNext={onFihishStepSchool} />,
              'step-3': () => <Prices onSelect={onSelectPrice} />,
              'step-4': () => <Content priceId={isSelect} schoolId={schooldId} />,
            })}
          </>
        )
      }}
    </StepperUi.Provider>
  )
}

interface ContentProps {
  priceId: string
  schoolId: string
}

const Content: React.FC<ContentProps> = (props) => {
  return (
    <StepperUi.Panel className="h-[200px] content-center rounded border bg-secondary text-secondary-foreground p-8">
      <p className="text-xl font-normal mb-4">
        Casi estás por terminar. Da clic en “Pagar ahora” para ir a Stripe.
      </p>

      <PayNowButton priceId={props.priceId} schoolName={props.schoolId} />
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
