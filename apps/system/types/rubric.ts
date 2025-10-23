import { Id } from "@repo/convex/convex/_generated/dataModel";

export interface ClassCatalog {
  _id: Id<'classCatalog'>
  name: string
  schoolCycleId?: Id<'schoolCycle'>
  schoolCycle?: {
    _id: Id<'schoolCycle'>
    name: string
    status: 'active' | 'inactive' | 'archived'
  }
  status: 'active' | 'inactive' 
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