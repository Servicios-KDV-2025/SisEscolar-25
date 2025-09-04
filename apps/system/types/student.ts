import { Id } from "@repo/convex/convex/_generated/dataModel";

export type Status = "active" | "inactive";

export interface Student {
  _id: Id<"student">;
  _creationTime: number;
  schoolId: Id<"school">;
  groupId: Id<"group">;
  tutorId: Id<"user">;
  enrollment: string;
  name: string;
  lastName?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
}