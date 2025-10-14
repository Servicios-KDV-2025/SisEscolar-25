import React from "react";
import { Card, CardContent } from "../ui/card";
import { StatsItems } from "@/types";

interface StatsProps {
    title: string;
    subtitle: string;
    stats: StatsItems[];
}

export const StatsSection = ({ title, subtitle, stats }: StatsProps) => {
    return <section className="py-20 bg-primary text-primary-foreground">
        <div className="container max-w-screen-xl px-4">
            {
                (title || subtitle) && (
                    <div className="mx-auto max-w-2xl text-center mb-16">
                    {
                        title && <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
                    }
                    {
                        subtitle &&  <p className="mt-4 text-lg text-primary-foreground/80 text-pretty">{subtitle}</p>
                    }
                    </div>
                )
            }
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="rounded-[24px] border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm py-6">
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-primary-foreground lg:text-4xl">{stat.number}</div>
                            <div className="mt-2 text-sm text-primary-foreground/80">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </section>;
};
