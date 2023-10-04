import { Router } from "express";
import assasHooksRouterHandler from "./asaas/charge";
import { wrapHandler } from "@medusajs/medusa";

// Initialize a custom router
const router = Router();

export function attachHooksRoutes(hooksRouter: Router) {
  // Attach our router to a custom path on the store router
  hooksRouter.use("/asaas", router);

  // Define a GET endpoint on the root route of our custom path
  router.post("/charge", wrapHandler(assasHooksRouterHandler));
}
