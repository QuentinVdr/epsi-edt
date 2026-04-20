export interface Course {
  NoCours: number;
  Commentaire: string;
  Matiere: string;
  Salles: string;
  NomProf: string | null;
  Duree: number;
  Start: string;
  End: string;
  IsAllDay: boolean;
  ColorRed: number;
  ColorGreen: number;
  ColorBlue: number;
  CoursMixteInfoBulle: string;
  LibelleGroupe: string;
  NomEcole: string;
  LogoEcole: string;
  TeamsUrl: string | null;
}

export type ViewType = "day" | "week" | "month" | "year";

export interface EdtResponse {
  Data: Course[];
  Total: number;
  AggregateResults: null;
  Errors: null;
}
