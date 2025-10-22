"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import Link from "next/link";
import { Eye, EyeOff } from "@repo/ui/icons";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();

  // Función para manejar inicio de sesión con OAuth (Google, Microsoft, etc.)
  const signInWith = (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signIn) return;

    return signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err: unknown) => {
        console.error(err);
        const errorMessage = isClerkAPIResponseError(err)
          ? err.errors[0]?.longMessage || `Error al iniciar sesión con ${strategy === "oauth_google" ? "Google" : "Microsoft"}`
          : `Error al iniciar sesión con ${strategy === "oauth_google" ? "Google" : "Microsoft"}`;
        setError(errorMessage);
      });
  };

  // Manejar el envío del formulario de inicio de sesión
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isLoaded) return;

    // Iniciar el proceso de inicio de sesión usando el email y contraseña proporcionados
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      // Si el proceso de inicio de sesión está completo, establecer la sesión creada como activa
      // y redirigir al usuario
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/");
        // toast.success('Inicio de sesión exitoso')
      } else {
        // Si el estado no está completo, verificar por qué. El usuario puede necesitar
        // completar pasos adicionales.
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Error en el proceso de inicio de sesión");
      }
    } catch (err) {
      // Ver https://clerk.com/docs/custom-flows/error-handling
      // para más información sobre el manejo de errores
      console.error(JSON.stringify(err, null, 2));
      setError("Credenciales inválidas. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar un formulario para capturar el email y contraseña del usuario
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Iniciar sesión
          </CardTitle>
          <CardDescription className="text-gray-600">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Botones de OAuth */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-medium cursor-pointer"
                onClick={() => signInWith("oauth_google")}
                disabled={!isLoaded}
              >
                <svg
                  width="64px"
                  height="64px"
                  viewBox="0 0 262.00 262.00"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                      fill="#EB4335"
                    ></path>
                  </g>
                </svg>
                Continuar con Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-medium cursor-pointer"
                onClick={() => signInWith("oauth_microsoft")}
                disabled={!isLoaded}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Continuar con Microsoft
              </Button>
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            {/* Formulario de email y contraseña */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Correo Electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="link"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Enlace para registro */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿No tienes una cuenta? </span>
            <Link
              href="/registro"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
