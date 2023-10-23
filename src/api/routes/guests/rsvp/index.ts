import { wrapHandler } from "@medusajs/utils";
import { Router } from "express";
import createRSVP from "./create-rsvp";

const router = Router();

export default (guestsRouter: Router) => {
  guestsRouter.use("/rsvp", router);

  router.post("/", wrapHandler(createRSVP));
};
