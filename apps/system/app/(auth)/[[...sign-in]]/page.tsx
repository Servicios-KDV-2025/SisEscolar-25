'use client'
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { api } from "@repo/convex/index";
import CustomSignIn from "components/CustomSignIn";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";

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