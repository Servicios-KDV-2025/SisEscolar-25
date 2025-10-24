"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";

interface FormattedEvent {
  _id: string;
  day: string;
  month: string;
  name: string;
  description: string;
  daysUntil: number;
  daysUntilText: string;
}

interface UpcomingEventsCardProps {
  events: FormattedEvent[];
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Eventos</CardTitle>
        <CardDescription>Calendario escolar</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay eventos próximos programados
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isToday = event.daysUntil === 0;
              
              return (
                <div 
                  key={event._id} 
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    isToday 
                      ? 'bg-blue-500/60 border border-blue-500/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold ${isToday ? 'text-white ' : ''}`}>
                      {event.day}
                    </span>
                    <span className={`text-xs ${isToday ? 'text-white' : 'text-muted-foreground'}`}>
                      {event.month}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isToday ? 'text-white' : ''}`}>
                      {event.name}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-white' : 'text-muted-foreground'}`}>
                      {event.description}
                    </p>
                  </div>
                  <Badge 
                    variant={isToday ? "default" : "outline"}
                    className={isToday ? "bg-white hover:bg-white/90 text-blue-500" : ""}
                  >
                    {event.daysUntilText}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

