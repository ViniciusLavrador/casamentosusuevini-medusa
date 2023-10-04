import {
  AbstractCartCompletionStrategy,
  CartService,
  IdempotencyKey,
  IdempotencyKeyService,
  PostgresError,
} from "@medusajs/medusa";
import { AwilixContainer } from "awilix";
import { MedusaError } from "medusa-core-utils";
import { EOL } from "os";
import { Asaas } from "src/types/asaas-api";

export function buildError(event: string, err: any): string {
  let message = `Asaas webhook ${event} handling failed${EOL}${
    err?.detail ?? err?.message
  }`;
  if (err?.code === PostgresError.SERIALIZATION_FAILURE) {
    message = `Asaas webhook ${event} handle failed. This can happen when this webhook is triggered during a cart completion and can be ignored. This event should be retried automatically.${EOL}${
      err?.detail ?? err?.message
    }`;
  }
  if (err?.code === "409") {
    message = `Asaas webhook ${event} handle failed.${EOL}${
      err?.detail ?? err?.message
    }`;
  }

  return message;
}

export async function handlePaymentHook({
  event,
  container,
  charge,
}: {
  event: Asaas.Webhook.ChargeParams["event"];
  container: AwilixContainer;
  charge: Asaas.Charge;
}): Promise<{ statusCode: number }> {
  const logger = container.resolve("logger");

  const cartId = charge.externalReference;

  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED_IN_CASH_UNDONE":
      try {
        await onChargeSucceeded({
          eventId: event,
          cartId,
          container,
        });
      } catch (err) {
        const message = buildError(event, err);
        logger.warn(message);
        return { statusCode: 409 };
      }

      break;
    case "PAYMENT_UPDATED":
      try {
        await onChargeUpdate({
          eventId: event,
          cartId,
          container,
        });
      } catch (err) {
        const message = buildError(event, err);
        logger.warn(message);
        return { statusCode: 409 };
      }

      break;
    case "PAYMENT_DELETED":
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
      logger.error(
        `The payment of the payment intent ${charge.id} has failed${EOL}`
      );
      break;

    default:
      return { statusCode: 200 };
  }

  return { statusCode: 200 };
}

async function onChargeSucceeded({ eventId, cartId, container }) {
  const manager = container.resolve("manager");

  await manager.transaction(async (transactionManager) => {
    await completeCartIfNecessary({
      eventId,
      cartId,
      container,
      transactionManager,
    });

    await capturePaymentIfNecessary({
      cartId,
      transactionManager,
      container,
    });
  });
}

async function onChargeUpdate({ eventId, cartId, container }) {
  const manager = container.resolve("manager");

  await manager.transaction(async (transactionManager) => {
    await completeCartIfNecessary({
      eventId,
      cartId,
      container,
      transactionManager,
    });
  });
}

async function capturePaymentIfNecessary({
  cartId,
  transactionManager,
  container,
}) {
  const orderService = container.resolve("orderService");
  const order = await orderService
    .retrieveByCartId(cartId)
    .catch(() => undefined);

  if (order && order?.payment_status !== "captured") {
    await orderService
      .withTransaction(transactionManager)
      .capturePayment(order.id);
  }
}

async function completeCartIfNecessary({
  eventId,
  cartId,
  container,
  transactionManager,
}) {
  const orderService = container.resolve("orderService");
  const order = await orderService
    .retrieveByCartId(cartId)
    .catch(() => undefined);

  if (!order) {
    const completionStrat: AbstractCartCompletionStrategy = container.resolve(
      "cartCompletionStrategy"
    );
    const cartService: CartService = container.resolve("cartService");
    const idempotencyKeyService: IdempotencyKeyService = container.resolve(
      "idempotencyKeyService"
    );

    let idempotencyKey: IdempotencyKey;

    try {
      const idempotencyKeyServiceTx =
        idempotencyKeyService.withTransaction(transactionManager);

      idempotencyKey = await idempotencyKeyServiceTx.retrieve({
        request_path: "/hooks/asaas/charge",
        idempotency_key: eventId,
      });
    } catch (err) {
      idempotencyKey = await idempotencyKeyService
        .withTransaction(transactionManager)
        .create({
          request_path: "/hooks/asaas/charge",
          idempotency_key: eventId,
        });
    }

    const cart = await cartService
      .withTransaction(transactionManager)
      .retrieve(cartId, { select: ["context"] });

    const { response_code, response_body } = await completionStrat
      .withTransaction(transactionManager)
      .complete(cartId, idempotencyKey, { ip: cart.context?.ip as string });

    if (response_code !== 200) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        response_body["message"] as string,
        response_body["code"] as string
      );
    }
  }
}
