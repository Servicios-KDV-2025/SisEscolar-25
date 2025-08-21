"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Clock } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Button } from "@repo/ui/components/shadcn/button"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Textarea } from "@repo/ui/components/shadcn/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog"
import { Label } from "@repo/ui/components/shadcn/label"
import type { AttendanceRecord, StudentClass } from "@/types/attendance"

interface AbsenceJustificationProps {
  studentClasses: StudentClass[]
  attendanceRecords: AttendanceRecord[]
  setAttendanceRecords: (records: AttendanceRecord[]) => void
}

export default function AbsenceJustification({
  studentClasses,
  attendanceRecords,
  setAttendanceRecords,
}: AbsenceJustificationProps) {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [reviewComment, setReviewComment] = useState("")

  // Get absence records that need justification or have been justified
  const absenceRecords = attendanceRecords
    .filter((record) => !record.present)
    .map((record) => {
      const studentClass = studentClasses.find((sc) => sc.id === record.studentClassId)
      return {
        ...record,
        student: studentClass?.student,
        className: studentClass?.className,
      }
    })
    .filter((record) => record.student) // Only include records with valid student data

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.justified === true) {
      return (
        <Badge className="bg-green-500 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Justificado</span>
        </Badge>
      )
    } else if (record.justified === false) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>No Justificado</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Pendiente de revisión</span>
        </Badge>
      )
    }
  }

  const handleJustification = (record: AttendanceRecord, justified: boolean) => {
    const now = Date.now()

    setAttendanceRecords(
      attendanceRecords.map((r) =>
        r.studentClassId === record.studentClassId && r.date === record.date
          ? {
              ...r,
              justified,
              comments: reviewComment
                ? r.comments
                  ? `${r.comments}\n\nReview: ${reviewComment}`
                  : `Review: ${reviewComment}`
                : r.comments,
              updatedBy: "current_user", // Replace with actual user ID
              updatedAt: now,
            }
          : r,
      ),
    )

    setSelectedRecord(null)
    setReviewComment("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Justificaciones de ausencia</CardTitle>
          <CardDescription>Revisar y gestionar las solicitudes de justificación de ausencias de los estudiantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {absenceRecords.map((record) => (
              <div key={`${record.studentClassId}-${record.date}`} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={record.student?.avatar || "/placeholder.svg"} alt={record.student?.name} />
                      <AvatarFallback>
                        {record.student?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{record.student?.name}</h3>
                        {getStatusBadge(record)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Matricula:</strong> {record.student?.rollNumber} | <strong>Clase:</strong>{" "}
                          {record.className}
                        </p>
                        <p>
                          <strong>Fecha de ausencia:</strong> {new Date(record.date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Recorded:</strong> {new Date(record.registrationDate).toLocaleString()}
                        </p>
                        {record.updatedAt && (
                          <p>
                            <strong>Ultima actualización:</strong> {new Date(record.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {record.comments && (
                        <div className="mt-2 p-2 bg-gray-50 border rounded text-sm">
                          <strong>Cometarios:</strong>
                          <p className="mt-1 whitespace-pre-wrap">{record.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {record.justified === undefined && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record)}>
                          Revisar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Revisar Ausencia</DialogTitle>
                          <DialogDescription>Revisar la ausencia de {record.student?.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Detalles del alumnos</Label>
                            <div className="text-sm text-gray-600">
                              <p>
                                {record.student?.name} ({record.student?.rollNumber})
                              </p>
                              <p>Clase: {record.className}</p>
                              <p>Fecha de ausencia: {new Date(record.date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {record.comments && (
                            <div className="space-y-2">
                              <Label>Comentarios existentes</Label>
                              <div className="text-sm text-gray-600 p-2 bg-gray-50 border rounded">
                                {record.comments}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="review-comment">Revision de comantario (Opcional)</Label>
                            <Textarea
                              id="review-comment"
                              placeholder="Añadir cualquier comentario sobre su decision..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter className="space-x-2">
                          <Button variant="destructive" onClick={() => handleJustification(record, false)}>
                            No Justificado
                          </Button>
                          <Button onClick={() => handleJustification(record, true)}>Justificar ausencia</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}

            {absenceRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">No absence records found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
