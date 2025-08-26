'use client'
import React from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { School, User, CopySlash } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { SignUp } from './Auth/SignUp'
import { SignIn } from './Auth/SignIn'
import SchoolForm from './SchoolForm'
// usa el componente genérico (no el de blocks)
import PayNowButton from '@/components/PayNowButton'

type CheckoutFromCMS = {
  priceId?: string
  
  buttonText?: string
  schoolName?: string
}
const { Stepper: StepperUi, useStepper } = defineStepper(
  { id: 'step-1', title: 'Paso 1', description: 'Iniciar sesión para continuar', icon: <User /> },
  { id: 'step-2', title: 'Paso 2', description: 'Ingresar datos de la escuela', icon: <School /> },
  { id: 'step-3', title: 'Paso 3', description: 'Realizar pagos', icon: <CopySlash /> },
)
type StepperProps = { checkoutFromCMS?: CheckoutFromCMS | null }

export const Stepper: React.FC<StepperProps> = ({ checkoutFromCMS }) => {
  const { isSignedIn, isLoaded } = useAuth()
  const [ready, setReady] = React.useState(false)
  const [schoolId, setSchoolId] = React.useState<string>();
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
              'step-2': () => (
    <SchoolForm
      onSchoolSelected={(id: string) => {     
        setSchoolId(id);
      
      }}
    />
  ),
             'step-3': (step) => (
    <Content
      id={step.id}
      checkoutFromCMS={checkoutFromCMS}
      schoolId={schoolId}                    //se manda al boton el id
    />
  ),
            })}
            <StepperUi.Controls>
              {!methods.isFirst && (
                 <Button
      onClick={methods.isLast ? () => {} : methods.next}
      disabled={methods.current.id === 'step-2' && !schoolId}   // ← clave
    >
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

const Content = ({
  id,
  checkoutFromCMS,
  schoolId,
}: {
  id: string
  checkoutFromCMS?: CheckoutFromCMS | null
  schoolId?: string
}) => {
  const priceId = checkoutFromCMS?.priceId

  return (
    <StepperUi.Panel className="h-[200px] content-center rounded border bg-secondary text-secondary-foreground p-8">
      <p className="text-xl font-normal mb-4">
       Casi estas por terminar,da clic en pagar ahora y te redirigira a una pagina segura para el pago...
      </p>

      {!priceId ? (
  <p> no hay un precio seleciconado...</p>
) : (
  <PayNowButton priceId={priceId} schoolId={schoolId}  />
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
