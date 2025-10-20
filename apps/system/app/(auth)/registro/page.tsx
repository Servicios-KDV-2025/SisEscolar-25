'use client'
import { Authenticated, Unauthenticated } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignUpForm from "components/CustomSignUp";

export default function SignUpPage() {
  const { user } = useUser();
  const router = useRouter();

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center h-screen">
          <SignUpForm />
        </div>
      </Unauthenticated>
      <Authenticated>
        {/* Esto no debería mostrarse, pero por seguridad */}
        <div className="flex items-center justify-center h-screen">
          <p>Redirigiendo..</p>
        </div>
      </Authenticated>
    </div>
  );
}
