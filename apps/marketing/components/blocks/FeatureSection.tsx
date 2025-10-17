import { FeatureItem } from "@/sanity.types";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";


interface FeatureProps { 
    title: string;
    description: string;
    features: FeatureItem[];
}

export const FeatureSection = ({title, description, features}: FeatureProps) => {
    return <section id="features" className="py-20 sm:py-32 bg-muted/30 bg-red-100">
      <div className="container max-w-screen-xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {description}
          </p>
        </div>

         <div  className={`mx-auto mt-16 grid max-w-screen-lg gap-6 
        ${features.length === 1 ? "grid-cols-1 lg:grid-cols-1" : (features.length === 2 ? "grid-cols-1 sm:grid-cols-2 justify-center" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}`}
      >
          {features.map((feature, index) => (
            <Card
              key={index}
              className="rounded-[24px] border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {/* <ArrowBigDown className="h-6 w-6 text-primary" /> */}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}    
        </div>
        
      </div>
    </section>
};
