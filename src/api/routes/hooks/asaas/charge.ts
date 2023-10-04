import { Request, Response } from "express";

import { Asaas } from "src/types/asaas-api";
import { handlePaymentHook } from "./utils";

export default async (req: Request, res: Response): Promise<void> => {
  const chargeWebookParams = req.body as Asaas.Webhook.ChargeParams;

  console.log(`INCOMING WEBHOOK - ${chargeWebookParams.event}`);

  const { statusCode } = await handlePaymentHook({
    container: req.scope,
    charge: chargeWebookParams.payment,
    event: chargeWebookParams.event,
  });

  console.log(
    `RESPONDING TO STATUS CODE ${chargeWebookParams.event} with status ${statusCode}`
  );

  res.sendStatus(statusCode);
};
