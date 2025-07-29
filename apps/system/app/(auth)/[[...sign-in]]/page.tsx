'use client'
import { SignIn, SignOutButton } from "@clerk/nextjs";
import CustomSignIn from "components/CustomSignIn";
import { Authenticated, Unauthenticated } from "convex/react";

export default function authPage() {
  return (
    <div>
        <Authenticated>
            <p>Bienvenido</p>
            <SignOutButton />
        </Authenticated>
        <Unauthenticated>
            <CustomSignIn />
            <SignIn />
        </Unauthenticated>
    </div>
  );
}