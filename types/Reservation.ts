export type ReservationStatus = "PENDING" | "APPROVED" | "SEATED" | "FULFILLED" | "NO_SHOW" | "CANCELED";
export type ReservationSource = "MARKETPLACE" | "WIDGET" | "WEBSITE" | "BACK_OFFICE" | "WALK_IN";
export interface Occasion {
  id: number
  name: string
  description: string
  color: string
}

export interface OccasionsType {
  results: Occasion[]
  count: number
}