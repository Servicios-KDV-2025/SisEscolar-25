"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toast } from "sonner";

/**
 * Página para establecer la contraseña del usuario.
 *
 * Este componente se utiliza en el flujo de onboarding (por ejemplo, después de aceptar una invitación)
 * para permitir al usuario definir su contraseña permanente.
 *
 * Utiliza el hook `useUser` de Clerk para acceder a la instancia del usuario actual y
 * el método `user.updatePassword` para guardar la nueva contraseña.
 *
 * @example
 * // El usuario ingresa su contraseña y confirmación.
 * // Al enviar, se llama a user.updatePassword({ newPassword: "..." }).
 */
export default function SetPasswordPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        router.push("/sign-in");
        return null;
    }

    /**
     * Maneja el envío del formulario para establecer la contraseña.
     *
     * Valida que las contraseñas coincidan y tengan la longitud requerida,
     * y luego actualiza la contraseña del usuario en Clerk.
     *
     * @param e - El evento de envío del formulario.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setLoading(true);
        try {
            await user.updatePassword({
                newPassword: password,
            });
            toast.success("Contraseña establecida correctamente");
            router.push("/");
        } catch (error: unknown) {
            console.error("Error setting password:", error);
            const clerkError = error as { errors?: { code?: string; message?: string }[] };
            const errorMessage = clerkError.errors?.[0]?.message || "Error al establecer la contraseña";

            if (errorMessage.includes("data breach") || errorMessage.includes("pwned")) {
                setError("Esta contraseña ha sido expuesta en una filtración de datos. Por seguridad, elige una diferente.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Establecer Contraseña</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Para finalizar la configuración de tu cuenta, por favor establece una contraseña segura.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Establecer Contraseña e Ingresar
                    </Button>
                </form>
            </div>
        </div>
    );
}
