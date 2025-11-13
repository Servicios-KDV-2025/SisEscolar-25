import { Id } from "@repo/convex/convex/_generated/dataModel"
import { GenericId } from "convex/values"

export interface CalendarType {
    _id: GenericId<"calendar">
    schoolId : Id<"school">
    schoolCycleId: Id<"schoolCycle">
    startDate: number
    endDate: number
    eventTypeId: Id<"eventType">
    description?: string
    status: string
  }