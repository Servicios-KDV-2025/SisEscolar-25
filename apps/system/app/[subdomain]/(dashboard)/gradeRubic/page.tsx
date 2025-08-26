"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Switch } from "@repo/ui/components/shadcn/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "@repo/ui/icons";
// Importaciones de Convex
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@repo/convex/convex/_generated/dataModel";

interface Rubric {
  _id: Id<"gradeRubric">;
  _creationTime: number;
  classCatalogId: Id<"classCatalog">;
  termId: Id<"term">;
  name: string;
  weight: number; // Almacenado como decimal en Convex (ej: 0.4)
  maxScore: number;
  createdBy: Id<"user">;
  status: boolean; // Campo añadido para la baja lógica
}

export default function RubricDashboard() {
const [searchTerm, setSearchTerm] = useState("");
  // Estado para los filtros seleccionados por el usuario
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    weight: [50],
    maxScore: 100,
    class: "",
    term: "",
  });

  const rubrics = useQuery(
    api.functions.gradeRubrics.getGradeRubricByClassAndTerm, 
    selectedClass && selectedTerm ? {
        classCatalogId: selectedClass as Id<"classCatalog">,
        termId: selectedTerm as Id<"term">,
    } : 'skip'
  );

  const createGradeRubric = useMutation(api.functions.gradeRubrics.createGradeRubric);
    const updateGradeRubric = useMutation(api.functions.gradeRubrics.updateGradeRubric);
    const deleteGradeRubric = useMutation(api.functions.gradeRubrics.deleteGradeRubric);

  if (rubrics === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando rúbricas...
      </div>
    );
  }
    const filteredRubrics = rubrics.filter((rubric) =>
    rubric.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalWeight = filteredRubrics
    .filter((rubric) => rubric.status)
    .reduce((sum, rubric) => sum + (rubric.weight * 100), 0);


  const handleOpenModal = (rubric?: Rubric) => {
    if (rubric) {
      setEditingRubric(rubric);
      setFormData({
        name: rubric.name,
        weight: [rubric.weight],
        maxScore: rubric.maxScore,
        class: rubric.class,
        term: rubric.term,
      });
    } else {
      setEditingRubric(null);
      setFormData({
        name: "",
        weight: [50],
        maxScore: 100,
        class: selectedClass || "",
        term: selectedTerm || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveRubric = () => {
    const newRubric: Rubric = {
      id: editingRubric?.id || Date.now().toString(),
      name: formData.name,
      weight: formData.weight[0] ?? 0,
      maxScore: formData.maxScore,
      status: editingRubric?.status || true,
      class: formData.class,
      term: formData.term,
    };

    if (editingRubric) {
      setRubrics((prev) =>
        prev.map((r) => (r.id === editingRubric.id ? newRubric : r))
      );
    } else {
      setRubrics((prev) => [...prev, newRubric]);
    }

    setIsModalOpen(false);
    setEditingRubric(null);
  };

  const handleDeleteRubric = (id: string) => {
    setRubrics((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setRubrics((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: !r.status } : r))
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Grade Rubric Management
          </h1>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search rubrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math101">Math 101</SelectItem>
                    <SelectItem value="eng102">English 102</SelectItem>
                    <SelectItem value="sci103">Science 103</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall2024">Fall 2024</SelectItem>
                    <SelectItem value="spring2024">Spring 2024</SelectItem>
                    <SelectItem value="summer2024">Summer 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Total Weight:
                    </span>
                    <Badge
                      variant={totalWeight === 100 ? "default" : "destructive"}
                      className="font-semibold "
                    >
                      {totalWeight}%
                    </Badge>
                    {totalWeight !== 100 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Rubric
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rubrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rubrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubric Name</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRubrics.map((rubric) => (
                  <TableRow key={rubric.id}>
                    <TableCell className="font-medium">{rubric.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rubric.weight}%</Badge>
                    </TableCell>
                    <TableCell>{rubric.maxScore}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rubric.status}
                        onCheckedChange={() => handleToggleStatus(rubric.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(rubric)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRubric(rubric.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Form */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRubric ? "Edit Rubric" : "New Rubric"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 ">
              <div className="space-y-2">
                <Label htmlFor="name">Rubric Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter rubric name"
                />
              </div>
              <div className="grid grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, class: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math101">Math 101</SelectItem>
                      <SelectItem value="eng102">English 102</SelectItem>
                      <SelectItem value="sci103">Science 103</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, term: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall2024">Fall 2024</SelectItem>
                      <SelectItem value="spring2024">Spring 2024</SelectItem>
                      <SelectItem value="summer2024">Summer 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxScore: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter max score"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="px-3">
                  <Label>Weight (%)</Label>
                  <div className="flex justify-center text-xm mt-1">
                  </div>
                  <Slider
                    value={formData.weight}
                    onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, weight: value }))
                    }
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span className="flex justify-center text-black text-xl">{formData.weight[0]}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRubric}
                disabled={
                  !formData.name.trim() ||
                  formData.maxScore <= 0 ||
                  !formData.class ||
                  !formData.term
                }
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
