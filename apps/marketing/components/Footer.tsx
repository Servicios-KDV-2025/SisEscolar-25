import { GraduationCap } from "lucide-react";
import React from "react";
import type { SettingsQueryResult } from "@/sanity.types";
import Link from "next/link";
import { resolveHref } from "@/sanity/lib/utils";

interface Props {
    columns?: NonNullable<NonNullable<SettingsQueryResult>['footer']>['columns'];
}

export const Footer = ({ columns }: Props) => {
    return <footer className="border-t w-full flex justify-center border-border bg-muted/30">
        <div className="container max-w-screen-xl px-4 py-12">
            <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <span className="text-lg font-bold text-foreground">EduAdmin</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        La plataforma líder en administración educativa para instituciones modernas.
                    </p>
                </div>
                <div className="flex flex-row justify-between lg:col-span-3 sm:justify-around sm:gap-8 md:gap-16 lg:gap-32 lg:justify-start lg:flex">
                    {
                        columns?.map((column, index) => {
                        return (
                            <div key={index} className="flex-1">
                                <h3 className="font-semibold text-foreground mb-4">{column.titulo}</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {column.links?.map((link, linkIdx) => {
                                        const url = link._type === 'linkExternal' ? link.url : resolveHref(link.type_reference!, link.url);
                                        return (
                                            <li key={linkIdx}>
                                                <Link href={url || '#'} className="hover:text-foreground transition-colors">
                                                    {link.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                        })
                    }
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-muted-foreground">© 2025 EduAdmin. Todos los derechos reservados.</p>
                <div className="flex gap-6 text-xs text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors">
                        Privacidad
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                        Términos
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                        Cookies
                    </a>
                </div>
            </div>
        </div>
    </footer>;
}
