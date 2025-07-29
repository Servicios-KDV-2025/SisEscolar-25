'use client'
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/shadcn/button";
import CustomSignIn from "components/CustomSignIn";
import { Authenticated, Unauthenticated } from "convex/react";

export default function authPage() {
  return (
    <div>
        <Authenticated>
          <div className="flex flex-col items-center justify-center h-screen">
            <p>Bienvenido</p>
            <p>Aui se mostrara el listado de las escuelas, si no tienes uno no mostrara nada</p>
            <Button asChild className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer">
              <SignOutButton />
            </Button>
          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center h-screen">
              <SignIn />
          </div>
        </Unauthenticated>
    </div>
  );
}