export type Role = "ADMIN" | "OPERATOR";
export type DocumentStatus = "DRAFT" | "GENERATED" | "ARCHIVED";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: Role;
}

/** Hisoblash dvigateli kirish parametrlari */
export interface CalculationInput {
  s: number; // yer maydoni (kv.m)
  t: number; // hudud toifa koeffitsiyenti
  b: number; // yer solig'i stavkasi (so'm/kv.m)
  g: number; // muhandislik koeffitsiyenti
  f: number; // foydalanish turi koeffitsiyenti
  m: number; // maydon kamaytiruvchi koeffitsiyenti
  e: number; // qo'shimcha xarajatlar (so'm)
}

/** Hisoblash dvigateli natijasi */
export interface CalculationResult {
  input: CalculationInput;
  startingPrice: number;
  formattedPrice: string;
  formula: string; // to'liq yakuniy satr
  formulaTemplate: string; // C = S × T × B × G × F × M + E
}

/** Formaga koeffitsiyentlarni yechish natijasi */
export interface ResolvedCoefficients {
  t: number;
  tDescription: string;
  b: number;
  bDescription: string;
  m: number;
  mDescription: string;
}
