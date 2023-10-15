import { RSVP } from "src/models/rsvp";
import { OnboardingState } from "../models/onboarding";

export type UpdateRSVPInput = {
  name?: string;
  is_attending?: boolean;
  amountOfGuests?: number;
};

export type OnboardingStateRes = {
  status: RSVP;
};
