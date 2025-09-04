'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/shadcn/table";
import { Checkbox } from '@repo/ui/components/shadcn/checkbox'
import { Input } from "@repo/ui/components/shadcn/input";
import { Badge } from "@repo/ui/components/shadcn/badge";

interface AttendanceRecord {
  studentstudentClassId: string;
  studentId: string;
  enrollment: string;
  name: string;
  lastName?: string;
  present: boolean | null;
  justified: boolean | null;
  comments: string;
  alreadyRegistered: boolean;
}

interface AttendanceTableProps {
  data: AttendanceRecord[];
  selectedDate: Date;
  onAttendanceChange: (studentClassId: string, field: string, value: any) => void;
}

export default function AttendanceTable({data, selectedDate, onAttendanceChange}: AttendanceTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="text-muted-foreground">
          No hay estudiantes inscritos en esta clase o no se encontraron datos.
        </div>
      </div>
    );
  }

  const handlePresentChange = (studentClassId: string, present: boolean) => {
    onAttendanceChange(studentClassId, 'present', present);
    if (present) {
      onAttendanceChange(studentClassId, 'justified', false);
    }
  }

  const handleJustifiedChange = (studentClassId: string, justified: boolean) => {
    onAttendanceChange(studentClassId, 'justified', justified);
    if (justified) {
      onAttendanceChange(studentClassId, 'present', false);
    }
  }

  const handleCommentsChange = (studentClassId: string, comments: string) => {
    onAttendanceChange(studentClassId, 'comments', comments);
  }

  return (
    <div className="rounded-md border">
      <div className="bg-muted p-4">
        <h3 className="font-semibold">Lista de Estudiantes</h3>
        <p className="text-sm text-muted-foreground">
          Total: {data.length} estudiantes
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matrícula</TableHead>
            <TableHead>Nombre del Estudiante</TableHead>
            <TableHead className="text-center">Presente</TableHead>
            <TableHead className="text-center">Justificado</TableHead>
            <TableHead>Comentarios</TableHead>
            <TableHead className="text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableCell className="font-mono text-sm">{student.enrollment}</TableCell>
          <TableCell>
            <div>
              <div className="font-medium">{student.name} {student.lastName || ''}</div>
              <div className="text-xs text-muted-foreground">ID: {student.studentId}</div>
            </div>
          </TableCell>

          <TableCell className="text-center">
            <Checkbox
              checked={student.present ?? false}
              onCheckedChange={(checked) => 
                handlePresentChange(student.studentClassId, checked as boolean)
              }
            />
          </TableCell>
          
          <TableCell className="text-center">
            <Checkbox
              checked={student.justified ?? false}
              onCheckedChange={(checked) => 
                handleJustifiedChange(student.studentClassId, checked as boolean)
              }
              disabled={student.present ?? false}
            />
          </TableCell>

          <TableCell>
            <Input
              placeholder="Observaciones..."
              value={student.comments}
              onChange={(e) => 
                handleCommentsChange(student.studentClassId, e.target.value)
              }
              className="w-full"
            />
          </TableCell>
          
          <TableCell className="text-center">
            <Badge
              variant={student.alreadyRegistered ? "outline" : "secondary"}
              className={
                student.alreadyRegistered 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-800"
              }
            >
              {student.alreadyRegistered ? 'Registrado' : 'Pendiente'}
            </Badge>
          </TableCell>
        </TableBody>
      </Table>
    </div>
  )
}