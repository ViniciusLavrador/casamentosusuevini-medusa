import { RSVP } from "src/models/rsvp";

export type UpdateRSVPInput = {
  name?: string;
  is_attending?: boolean;
  amount_of_guests?: number;
  customer_id?: string;
};

export type OnboardingStateRes = {
  status: RSVP;
};
