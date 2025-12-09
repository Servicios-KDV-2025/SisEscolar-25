"use client";

import { useEffect, useState, Suspense } from "react";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function InviteContent() {
    const { signIn, isLoaded, setActive } = useSignIn();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    const { signOut, session } = useClerk();

    useEffect(() => {
        if (!isLoaded) return;
        if (!token) {
            setStatus("error");
            setErrorMessage("Token de invitación no encontrado.");
            return;
        }

        const acceptInvite = async () => {
            try {
                // If user is already signed in, sign them out first
                if (session) {
                    await signOut();
                    // Wait a bit for the session to be cleared
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const result = await signIn.create({
                    strategy: "ticket",
                    ticket: token,
                });

                if (result.status === "complete") {
                    await setActive({ session: result.createdSessionId });
                    setStatus("success");
                    router.push("/onboarding/set-password");
                } else {
                    console.error("Sign in incomplete", result);
                    setStatus("error");
                    setErrorMessage("No se pudo completar el inicio de sesión. Por favor contacta a soporte.");
                }
            } catch (err: unknown) {
                console.error("Error accepting invite:", err);

                const clerkError = err as { errors?: { code?: string; message?: string }[] };

                // If token is already used, it might be because of a double-fire or previous attempt
                if (clerkError.errors?.[0]?.code === "verification_expired") {
                    setErrorMessage("El enlace de invitación ya ha sido utilizado o ha expirado.");
                } else {
                    setErrorMessage(clerkError.errors?.[0]?.message || "El enlace de invitación es inválido o ha expirado.");
                }
                setStatus("error");
            }
        };

        // Only run if we haven't started yet
        if (status === "loading") {
            acceptInvite();
        }
    }, [isLoaded, token, signIn, setActive, router, signOut, session, status]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verificando invitación...</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-red-600">Error</h1>
                <p className="mt-2 text-muted-foreground">{errorMessage}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                    Si crees que esto es un error, contacta al administrador.
                </p>
            </div>
        );
    }

    return null; // Redirecting...
}

export default function AcceptInvitePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Cargando...</p>
                </div>
            }
        >
            <InviteContent />
        </Suspense>
    );
}
