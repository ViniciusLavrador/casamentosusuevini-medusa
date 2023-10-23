import { Request, Response } from "express";
import { EntityManager } from "typeorm";
import RSVPService from "src/services/rsvp";

export default async function createRSVP(req: Request, res: Response) {
  const rsvpService: RSVPService = req.scope.resolve("rsvpService");
  const manager: EntityManager = req.scope.resolve("manager");

  const status = await manager.transaction(async (transactionManager) => {
    return await rsvpService
      .withTransaction(transactionManager)
      .create(req.body);
  });

  res.status(200).json({ status });
}
