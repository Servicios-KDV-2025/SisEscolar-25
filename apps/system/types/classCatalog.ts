import { Id } from "@repo/convex/convex/_generated/dataModel";

export type Status = "active" | "inactive";

export interface ClassCatalog {
  _id: Id<"classCatalog">;
  schoolId: Id<"school">;
  schoolCycleId: Id<"schoolCycle">;
  subjectId: Id<"subject">;
  classroomId: Id<"classroom">;
  teacherId: Id<"user">;
  groupId?: Id<"group">;
  name: string;
  status: Status;
  createdBy?: Id<"user">;
  updatedAt?: number;
}
