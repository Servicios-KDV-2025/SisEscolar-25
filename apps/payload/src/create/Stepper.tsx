'use client'
import React from 'react'
import { defineStepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

const { Stepper: StepperUi } = defineStepper(
  {
    id: 'step-1',
    title: 'Step 1',
  },
  {
    id: 'step-2',
    title: 'Step 2',
  },
  {
    id: 'step-3',
    title: 'Step 3',
  },
)

export const Stepper: React.FC = () => {
  return (
    <StepperUi.Provider className="space-y-4" labelOrientation="vertical">
      {({ methods }) => (
        <>
          <StepperUi.Navigation>
            {methods.all.map((step, index) => (
              <StepperUi.Step of={step.id} key={index} icon={<Home />}>
                <StepperUi.Title>{step.title}</StepperUi.Title>
              </StepperUi.Step>
            ))}
          </StepperUi.Navigation>
          {methods.switch({
            'step-1': (step) => <Content id={step.id} />,
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
