import { Router } from "express";
import rsvpRoutes from "./rsvp";

export function attachGuestsRoutes(guestsRouter: Router) {
  // Attach routes for onboarding experience, defined separately
  rsvpRoutes(guestsRouter);
}
