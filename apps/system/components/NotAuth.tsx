"use client";

import { Button } from '@repo/ui/components/shadcn/button';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/shadcn/card';
import { LucideProps } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

type NotAuthProps = {
    pageName: string;
    pageDetails: string;
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
}

export default function NotAuth({ pageName, pageDetails, icon: Icon }: NotAuthProps) {
    const router = useRouter();
    
    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Icon className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">{pageName}</h1>
                                    <p className="text-lg text-muted-foreground">
                                        {pageDetails}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-col items-center">
                        No tienes permisos para estar en esta página.
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='text-center'>
                        <p className='pb-8'>Da clíck en el siguiente botón para regresar al incio.</p>
                        <Button
                            size="lg"
                            className="hover:cursor-pointer"
                            onClick={() => router.push('/inicio')}
                        >
                            Inicio
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
