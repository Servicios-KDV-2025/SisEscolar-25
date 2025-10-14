import React from "react"
import { useStepper } from "../Stepper"
import { SignIn } from "@/components/create/Auth/SignIn"
import { SignUp } from "@/components/create/Auth/SignUp"

export const Auth: React.FC = () => {
  const [showSignIn, setShowSignIn] = React.useState(false)
  const methods = useStepper()

  return showSignIn ? (
    <SignIn onBackToSignUp={() => setShowSignIn(false)} onClick={() => methods.next()} />
  ) : (
    <SignUp onSwitchToSignIn={() => setShowSignIn(true)} onClick={() => methods.next()} />
  )
}