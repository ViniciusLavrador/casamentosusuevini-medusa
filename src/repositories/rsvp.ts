import { dataSource } from "@medusajs/medusa/dist/loaders/database";
import { RSVP } from "../models/rsvp";

const RSVPRepository = dataSource.getRepository(RSVP);

export default RSVPRepository;
