'use client'
import React, { Fragment, useState } from 'react'
import { School, User, CopySlash, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { defineStepper } from '../ui/stepper'
import { Auth } from './Auth/Auth'
import SchoolForm from './School/SchoolForm'
import { Button } from '../ui/button'
import { Prices } from './Price/Prices'

export const { Stepper: StepperUi, useStepper } = defineStepper(
  { id: 'step-1', title: 'Paso 1', description: 'Iniciar sesión para continuar', icon: <User /> },
  { id: 'step-2', title: 'Paso 2', description: 'Ingresar datos de la escuela', icon: <School /> },
  { id: 'step-3', title: 'Paso 3', description: 'Selecciona el Precio', icon: <School /> },
  { id: 'step-4', title: 'Paso 4', description: 'Realizar pagos', icon: <CopySlash /> },
)

export const Stepper: React.FC = () => {
 
  return (
    <StepperUi.Provider className="space-y-4" labelOrientation="vertical">
      {() => {
        return <StepperContent />
      }}
    </StepperUi.Provider>
  )
}

const StepperContent = () => {
  const { isSignedIn, isLoaded, signOut } = useAuth()
  const [ready, setReady] = useState(false)
  const [isSelect, setSelected] = useState<string>('')
  const [_, setSchoolId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  //const { signOut } = useClerk()
  const methods = useStepper()
  React.useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && methods.current.id === 'step-1') {
        methods.goTo('step-3')
      }
      setReady(true)
    }
  }, [isSignedIn, isLoaded, methods])
  

  if (!ready) return null

  const onFihishStepSchool = (idSchool: string) => {
    setSchoolId(idSchool)
    methods.next()
  }

  const onSelectPrice = (idStripe: string) => {
    setSelected(idStripe)
    methods.next()
  }

  return (
          <Fragment>
            <StepperUi.Navigation>
              {methods.all.map((step, index) => (
                <StepperUi.Step of={step.id} key={index} icon={step.icon}>
                  <StepperUi.Title>{step.title}</StepperUi.Title>
                  <StepperUi.Description>{step.description}</StepperUi.Description>
                </StepperUi.Step>
              ))}
            </StepperUi.Navigation>

            {methods.switch({
              'step-1': () => <Auth />,
              'step-2': () => (
                <div>
                  <SchoolForm onNext={onFihishStepSchool} />
                  {isSignedIn && (
                    <Button
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true)
                        signOut({ redirectUrl: '#' })
                        methods.goTo('step-1')
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cerrando Sesion.
                        </>
                      ) : (
                        'Cerrar Sesion'
                      )}
                    </Button>
                  )}
                </div>
              ),
              'step-3': () => <Prices onSelect={onSelectPrice} />,
              'step-4': () => <Content />,
            })}
          </Fragment>
        )
}


// interface ContentProps {
//   priceId: string
//   schoolId: string
// }


const Content = () => {

  return <div></div>;

  // const { user, isLoaded } = useUser() // respaldo solo para DEV

  // if (!isLoaded) return null

  // return (
  //   <StepperUi.Panel className="h-[200px] rounded-2xl border border-gray-200 bg-white text-gray-800 p-8 shadow-lg flex flex-col justify-between">
  //     {/* Mensaje */}
  //     <p className="text-lg sm:text-xl font-medium mb-6 leading-relaxed">
  //       ¡Casi estás por terminar! Da clic en{' '}
  //       <span className="font-semibold text-red-500">“Pagar ahora”</span> para ir a Stripe.
  //     </p>

  //     {/* Botón */}
  //     <PayNowButton priceId={props.priceId} schoolId={props.schoolId} userId={user?.id!} />
  //   </StepperUi.Panel>
  // )
}
