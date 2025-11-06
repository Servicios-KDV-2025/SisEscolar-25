import { Id } from "@repo/convex/convex/_generated/dataModel";

export interface ClassCatalog {
  _id: Id<"classCatalog">;
  schoolId: Id<"school">;
  schoolCycleId: Id<"schoolCycle">;
  subjectId: Id<"subject">;
  classroomId: Id<"classroom">;
  teacherId: Id<"user">;
  groupId: Id<"group">;
  name: string;
  status: "active" | "inactive";
  createdBy: Id<"user"> | undefined;
  updatedAt: number | undefined;
  schoolCycle: {
    _id: Id<"schoolCycle">;
    _creationTime: number;
    name: string;
    status: "active" | "inactive" | "archived";
    createdAt: number;
    updatedAt: number;
    schoolId: Id<"school">;
    startDate: number;
    endDate: number;
  } | null
}

export interface Term {
  _id: Id<'term'>
  name: string
  schoolCycleId: Id<'schoolCycle'>
}

export interface RubricData {
  name: string
  weight: number[]
  maxScore: number
  schoolCycle: string
  class: string
  term: string
}