import { Id } from "@repo/convex/convex/_generated/dataModel"
import { GenericId } from "convex/values"

export interface EventType {
    _id: GenericId<"eventType">
    schoolId: Id<"school">
    name: string
    key: string
    description?: string
    color?: string
    icon?: string
    status: string
  }