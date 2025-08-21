"use client"

import { useState } from "react"
import { Plus, Search, Edit, Trash2, Mail, Phone } from "@repo/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Button } from "@repo/ui/components/shadcn/button"
import { Input } from "@repo/ui/components/shadcn/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select"
import { Badge } from "@repo/ui/components/shadcn/badge"

// Mock student data
const initialStudents = [
  {
    id: '1',
    name: "John Doe",
    rollNumber: "2024001",
    class: "10A",
    email: "john.doe@school.edu",
    phone: "+1234567890",
    avatar: "/placeholder.svg?height=40&width=40",
    attendanceRate: 95.2,
    status: "active",
  },
  {
    id: '2',
    name: "Jane Smith",
    rollNumber: "2024002",
    class: "10A",
    email: "jane.smith@school.edu",
    phone: "+1234567891",
    avatar: "/placeholder.svg?height=40&width=40",
    attendanceRate: 98.1,
    status: "active",
  },
  {
    id: '3',
    name: "Mike Johnson",
    rollNumber: "2024003",
    class: "10A",
    email: "mike.johnson@school.edu",
    phone: "+1234567892",
    avatar: "/placeholder.svg?height=40&width=40",
    attendanceRate: 87.5,
    status: "active",
  },
  {
    id: '4',
    name: "Sarah Wilson",
    rollNumber: "2024004",
    class: "10A",
    email: "sarah.wilson@school.edu",
    phone: "+1234567893",
    avatar: "/placeholder.svg?height=40&width=40",
    attendanceRate: 92.8,
    status: "active",
  },
]

interface StudentClass {
  id: string
  student: {
    name: string
    rollNumber: string
    email: string
    phone: string
    avatar: string
    attendanceRate: number
  }
  className: string
}

interface StudentManagementProps {
  studentClasses: StudentClass[]
}

export default function StudentManagement({ studentClasses }: StudentManagementProps) {
  const [students, setStudents] = useState(initialStudents)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    class: "",
    email: "",
    phone: "",
  })

  const filteredStudents = studentClasses.filter((studentClass) => {
    const matchesSearch =
      studentClass.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentClass.student.rollNumber.includes(searchTerm) ||
      studentClass.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || studentClass.className === selectedClass
    return matchesSearch && matchesClass
  })

  const handleAddStudent = () => {
    const newStudent = {
      id: Date.now().toString(),
      ...formData,
      avatar: "/placeholder.svg?height=40&width=40",
      attendanceRate: 100,
      status: "active",
    }
    setStudents([...students, newStudent])
    setFormData({ name: "", rollNumber: "", class: "", email: "", phone: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditStudent = () => {
    setStudents(students.map((student) => (student.id === editingStudent.id ? { ...student, ...formData } : student)))
    setEditingStudent(null)
    setFormData({ name: "", rollNumber: "", class: "", email: "", phone: "" })
  }

  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter((student) => student.id !== studentId))
    }
  }

  const openEditDialog = (student: any) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      email: student.email,
      phone: student.phone,
    })
  }

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-500">Excellent</Badge>
    if (rate >= 85) return <Badge className="bg-blue-500">Good</Badge>
    if (rate >= 75) return <Badge className="bg-yellow-500">Average</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de estudiantes</CardTitle>
              <CardDescription>Gestionar la información y los perfiles de los estudiantes</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Enter the student's information to add them to the system.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter student's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      placeholder="Enter roll number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10A">Class 10A</SelectItem>
                        <SelectItem value="10B">Class 10B</SelectItem>
                        <SelectItem value="11A">Class 11A</SelectItem>
                        <SelectItem value="11B">Class 11B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddStudent}>Add Student</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="10A">Class 10A</SelectItem>
                <SelectItem value="10B">Class 10B</SelectItem>
                <SelectItem value="11A">Class 11A</SelectItem>
                <SelectItem value="11B">Class 11B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {filteredStudents.map((studentClass) => (
              <div key={studentClass.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={studentClass.student.avatar || "/placeholder.svg"}
                        alt={studentClass.student.name}
                      />
                      <AvatarFallback>
                        {studentClass.student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">{studentClass.student.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Roll: {studentClass.student.rollNumber}</span>
                        <span>Class: {studentClass.className}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{studentClass.student.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{studentClass.student.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getAttendanceRateBadge(studentClass.student.attendanceRate)}
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(studentClass.student)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteStudent(studentClass.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">No students found matching your search criteria.</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter student's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rollNumber">Roll Number</Label>
              <Input
                id="edit-rollNumber"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="Enter roll number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-class">Class</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10A">Class 10A</SelectItem>
                  <SelectItem value="10B">Class 10B</SelectItem>
                  <SelectItem value="11A">Class 11A</SelectItem>
                  <SelectItem value="11B">Class 11B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditStudent}>Update Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
