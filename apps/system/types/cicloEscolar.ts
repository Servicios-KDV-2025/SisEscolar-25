import { GenericId } from "convex/values";

export type CiclosEscolaresId = GenericId<"ciclosEscolares">;
export type EscuelaId = GenericId<"escuelas">;

export type CicloEscolar = {
  id: CiclosEscolaresId;
  schoolId: EscuelaId;
  name: string;
  startDate: number;
  endDate: number;
  status: "active" | "archived" | "inactive";
  createdAt: number;
  updatedAt?: number;
};
