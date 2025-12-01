import { Card } from "@repo/ui/components/shadcn/card"
import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toast } from "@repo/ui/sonner";

interface Schedule {
  day: string
  startTime: string
  endTime: string
}

interface Class {
  id: string
  name: string
  subject: string
  teacher: string
  grade: string
  group: string
  classroom: {
    name: string
  } | null
  schedules: Schedule[]
  status: "active" | "inactive"
}

interface WeeklyScheduleProps {
  classes: Class[]
  studentName?: string
}

// Función para normalizar tiempo (HH:MM:SS -> HH:MM)
const normalizeTime = (time: string) => {
  return time.split(":").slice(0, 2).join(":");
};

// Función para convertir tiempo a minutos para ordenar
const timeToMinutes = (time: string) => {
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Función para generar TIME_SLOTS y DAYS dinámicamente
function generateTimeSlotsAndDays(classes: Class[]) {
  const timeSlotsSet = new Set<string>();
  const daysSet = new Set<string>();

  // Extraer todos los horarios y días únicos de las clases
  classes.forEach((cls) => {
    cls.schedules.forEach((schedule) => {
      // Agregar el slot de tiempo (startTime - endTime)
      const timeSlot = `${normalizeTime(schedule.startTime)} - ${normalizeTime(schedule.endTime)}`;
      timeSlotsSet.add(timeSlot);
      
      // Agregar el día
      daysSet.add(schedule.day);
    });
  });

  // Convertir a arrays y ordenar
  const timeSlots = Array.from(timeSlotsSet).sort((a, b) => {
    const [startA] = a.split(" - ");
    const [startB] = b.split(" - ");
    return timeToMinutes(startA ?? "") - timeToMinutes(startB ?? "");
  });

  // Ordenar días en el orden correcto
  const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const days = Array.from(daysSet).sort((a, b) => {
    const indexA = dayOrder.indexOf(a);
    const indexB = dayOrder.indexOf(b);
    // Si no está en el orden, mantener el orden original
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Si no hay días, usar el orden por defecto
  const finalDays = days.length > 0 ? days : dayOrder;

  return { timeSlots, days: finalDays };
}

function getClassForSlot(classes: Class[], day: string, timeSlot: string) {
  const [slotStartTime] = timeSlot.split(" - ");
  const normalizedSlotTime = normalizeTime(slotStartTime ?? "");

  for (const cls of classes) {
    const schedule = cls.schedules.find((s) => {
      if (s.day !== day) return false;
      const normalizedScheduleTime = normalizeTime(s.startTime);
      return normalizedScheduleTime === normalizedSlotTime;
    });
    
    if (schedule) {
      return cls;
    }
  }
  return null;
}

export function WeeklySchedule({ classes, studentName }: WeeklyScheduleProps) {
  // Generar TIME_SLOTS y DAYS dinámicamente
  const { timeSlots, days } = generateTimeSlotsAndDays(classes);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const handlePrevDay = () => {
    setSelectedDayIndex((prev) => (prev > 0 ? prev -1 : days.length - 1));
  }
  const handleNextDay = () => {
    setSelectedDayIndex((prev) => (prev < days.length - 1 ? prev + 1 : 0));
  }

  const handleDownloadPDF = async () => {
    try {
      // Importación dinámica de las librerías
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Obtener autoTable - puede ser named export o default export según la versión
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const autoTableModuleAny = autoTableModule as any;
      const autoTable = autoTableModuleAny.autoTable || autoTableModuleAny.default || autoTableModuleAny;
      
      if (typeof autoTable !== 'function') {
        throw new Error("No se pudo encontrar la función autoTable. Asegúrate de que jspdf-autotable esté instalado correctamente.");
      }

      // Título
      doc.setFontSize(18);
      const title = studentName ? `Horario de Clases - ${studentName}` : "Horario de Clases";
      doc.text(title, 14, 15);
      doc.setFontSize(12);
      const subtitle = studentName 
        ? `Horario semanal de clases del estudiante`
        : "Vista semanal de horarios de clases";
      doc.text(subtitle, 14, 22);

      // Preparar datos para la tabla
      const tableData: (string | string[])[][] = [];

      // Crear filas para cada timeSlot
      timeSlots.forEach((timeSlot) => {
        const row: string[] = [timeSlot]; // Primera columna es el horario
        
        days.forEach((day) => {
          const cls = getClassForSlot(classes, day, timeSlot);
          if (cls) {
            // Combinar información de la clase en una celda
            const parts: string[] = [cls.subject];
            
            // Agregar salón si existe
            if (cls.classroom?.name) {
              parts.push(cls.classroom.name);
            }
            
            // Agregar grupo y grado
            if (cls.group && cls.grade) {
              parts.push(`${cls.grade}${cls.group}`);
            }
            
            // Agregar profesor
            parts.push(cls.teacher);
            
            const cellContent = parts.join('\n');
            row.push(cellContent);
          } else {
            row.push("-");
          }
        });
        
        tableData.push(row);
      });

      // Encabezados de la tabla
      const headers = ["Horas", ...days.map((day) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase())];

      // Generar la tabla usando autoTable
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 28,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [128, 128, 128],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: "bold" }, // Columna de horas
        },
        margin: { top: 28, left: 14, right: 14 },
        didParseCell: (data: { cell: { text?: string | string[]; styles: { minCellHeight?: number } } }) => {
          // Ajustar altura de celda si tiene múltiples líneas
          if (data.cell.text && Array.isArray(data.cell.text)) {
            const lines = data.cell.text.length;
            if (lines > 1) {
              data.cell.styles.minCellHeight = lines * 5;
            }
          }
        },
      });

      // Guardar el PDF
      const studentNameForFile = studentName ? `_${studentName.replace(/\s+/g, "_")}` : "";
      const fileName = `Horario_Clases${studentNameForFile}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error(
        <span style={{ color: '#dc2626' }}>
          Error al generar el PDF
        </span>,
        {
          className: 'bg-white border border-red-200',
          unstyled: false,
          description: <span style={{ color: '#374151' }}>Por favor, contacta a soporte. {errorMessage !== "Error desconocido" ? errorMessage : ""}</span>,
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold">{studentName ? `Horario de Clases - ${studentName}` : "Horario de Clases"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vista semanal de horarios de clases</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent cursor-pointer md:mt-0 w-full md:w-auto"
            onClick={handleDownloadPDF}
          > 
            <Download className="h-4 w-4" /> Descargar Horario
          </Button>
        </div>
      </div>

      <Card className="hidden  overflow-hidden md:block py-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border-r border-border p-4 text-center text-sm font-medium text-muted-foreground">Horas</th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border-r border-border p-4 text-center text-sm font-medium last:border-r-0"
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.length > 0 ? (
                timeSlots.map((timeSlot,idx) => (
                  <tr key={timeSlot} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="border-r border-t border-border bg-muted/50 p-3 text-center text-sm font-medium text-muted-foreground">
                      {timeSlot}
                    </td>
                    {days.map((day) => {
                      const cls = getClassForSlot(classes, day, timeSlot);
                      return (
                        <td key={`${day}-${timeSlot}`} className="border-r border-t border-border p-2 text-center last:border-r-0">
                          {cls ? (
                            <div className="flex h-full min-h-[85px] flex-col items-center justify-center gap-1 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
                              <div className="font-semibold text-sm">{cls.subject}</div>
                              {cls.classroom?.name && (
                                <div className="text-xs text-muted-foreground">{cls.classroom.name}</div>
                              )}
                              {cls.group && cls.grade && (
                                <div className="text-xs text-muted-foreground">{cls.grade}{cls.group}</div>
                              )}
                              <div className="text-xs text-muted-foreground">{cls.teacher}</div>
                             
                            </div>
                          ) : (
                            <div className="h-full min-h-[85px]" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={days.length + 1} className="border-t border-border p-8 text-center text-muted-foreground">
                    No hay horarios asignados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="md:hidden">
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {days[selectedDayIndex ?? 0]?.charAt(0).toUpperCase() + (days[selectedDayIndex ?? 0]?.slice(1).toLowerCase() ?? "")}
            </h3>
            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {timeSlots.map((timeSlot) => {
            const cls = getClassForSlot(classes, days[selectedDayIndex ?? 0] ?? "", timeSlot);
            return (
              <Card key={timeSlot} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{timeSlot}</span>
                </div>
                {cls ? (
                  <div className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold">{cls.subject}</div>
                        {cls.classroom?.name && (
                          <div className="text-xs text-muted-foreground">{cls.classroom.name}</div>
                        )}
                        {cls.group && cls.grade && (
                          <div className="text-xs text-muted-foreground">{cls.grade}{cls.group}</div>
                        )}
                        <div className="text-xs text-muted-foreground">{cls.teacher}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sin clase
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
