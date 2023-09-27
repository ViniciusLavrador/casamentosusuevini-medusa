// TODO: WEBHOOKS, FINISH THE METHODS HERE

import {
  AbstractPaymentProcessor,
  Cart,
  CartService,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  WithRequiredProperty,
} from "@medusajs/medusa";
import AsaasService from "./asaas";
import { AxiosError } from "axios";
import { Asaas } from "src/types/asaas-api";

type PaymentSessionData = {
  customer: Asaas.Customer;
  charge?: Asaas.Charge;
  QRCode?: Asaas.QRCode;
};

class Pix extends AbstractPaymentProcessor {
  static identifier = "pix";

  private asaas: AsaasService;
  private cartService: CartService;

  constructor(container) {
    super(container);
    this.asaas = container.asaasService;
    this.cartService = container.cartService;
  }

  private buildError(message: string, error: any): PaymentProcessorError {
    if (error instanceof AxiosError) {
      return {
        detail: JSON.stringify(error.response.data.errors),
        code: error.code,
        error: message,
      };
    }

    return {
      error: message,
      code: error.code || "UNKNOWN_ERROR",
      detail: error.message,
    };
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    const { email, customer } = context;

    try {
      const asaasCustomers = await this.asaas.listCustomers({
        email,
        cpfCnpj: customer.metadata.cpf as string,
      });

      if (asaasCustomers.totalCount > 0) {
        return {
          session_data: {
            customer: asaasCustomers.data[0],
          },
        };
      }
    } catch (err) {
      return this.buildError(
        "unable to initiate payment because the list asaas customers operation failed",
        err
      );
    }

    try {
      const asaasCustomer = await this.asaas.createCustomer({
        name: `${customer.first_name} ${customer.last_name}`,
        email,
        cpfCnpj: customer.metadata.cpf as string,
        externalReference: customer.id,
      });

      return {
        session_data: {
          customer: asaasCustomer,
        },
      };
    } catch (err) {
      return this.buildError(
        "unable to initiate payment because the create asaas customer operation failed",
        err
      );
    }
  }

  // WIP
  async authorizePayment(
    paymentSessionData: PaymentSessionData,
    context: Record<string, unknown> & { cart_id: string }
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: PaymentSessionData;
      }
  > {
    // If charge already exists, check if it's paid
    if (paymentSessionData.charge) {
      const charge = await this.asaas.getCharge({
        chargeId: paymentSessionData.charge.id,
      });
      if (this.asaas.isChargePaid(charge)) {
        return {
          status: PaymentSessionStatus.AUTHORIZED,
          data: {
            ...paymentSessionData,
            charge,
          },
        };
      } else {
        const QRCode = await this.asaas.getQRCode({ chargeId: charge.id });
        return {
          status: PaymentSessionStatus.REQUIRES_MORE,
          data: {
            ...paymentSessionData,
            charge,
            QRCode,
          },
        };
      }
    }

    // get cart
    let cart: WithRequiredProperty<Cart, "total">;

    try {
      cart = await this.cartService.retrieveWithTotals(context.cart_id);
    } catch (err) {
      return this.buildError(
        "unable to authorize payment because the cart could not be retrieved",
        err
      );
    }

    try {
      const charge = await this.asaas.createCharge({
        customer: paymentSessionData.customer.id,
        billingType: "BOLETO",
        value: (cart.total / 100).toFixed(2),
        dueDate: new Date(),
        externalReference: context.cart_id,
        description: `Pedido ${context.cart_id}`,
      });

      const QRCode = await this.asaas.getQRCode({ chargeId: charge.id });

      return {
        status: PaymentSessionStatus.REQUIRES_MORE,
        data: {
          ...paymentSessionData,
          charge,
          QRCode,
        },
      };
    } catch (err) {
      console.log("error creating charge in asaas");
      if (err instanceof AxiosError) {
        return {
          error: JSON.stringify(err.response.data.errors),
          code: err.code,
        };
      }
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    throw new Error("Method not implemented.");
  }

  async cancelPayment(
    paymentSessionData: PaymentSessionData
  ): Promise<PaymentSessionData | PaymentProcessorError> {
    await this.asaas.cancelCharge({ chargeId: paymentSessionData.charge.id });
    const charge = await this.asaas.getCharge({
      chargeId: paymentSessionData.charge.id,
    });

    return {
      ...paymentSessionData,
      charge,
    };
  }

  async deletePayment(
    paymentSessionData: PaymentSessionData
  ): Promise<PaymentSessionData | PaymentProcessorError> {
    return this.cancelPayment(paymentSessionData);
  }
  async getPaymentStatus(
    paymentSessionData: PaymentSessionData
  ): Promise<PaymentSessionStatus> {
    const charge = await this.asaas.getCharge({
      chargeId: paymentSessionData.charge.id,
    });

    switch (charge.status) {
      case "PENDING":
        return PaymentSessionStatus.REQUIRES_MORE;
      case "RECEIVED":
        return PaymentSessionStatus.AUTHORIZED;
      case "CONFIRMED":
        return PaymentSessionStatus.AUTHORIZED;
      case "OVERDUE":
        return PaymentSessionStatus.ERROR;
      case "REFUNDED":
        return PaymentSessionStatus.CANCELED;
      case "RECEIVED_IN_CASH":
        return PaymentSessionStatus.AUTHORIZED;
      case "REFUND_REQUESTED":
        return PaymentSessionStatus.CANCELED;
      case "REFUND_IN_PROGRESS":
        return PaymentSessionStatus.CANCELED;
      case "CHARGEBACK_REQUESTED":
        return PaymentSessionStatus.CANCELED;
      case "CHARGEBACK_DISPUTE":
        return PaymentSessionStatus.CANCELED;
      case "AWAITING_CHARGEBACK_REVERSAL":
        return PaymentSessionStatus.CANCELED;
      case "DUNNING_REQUESTED":
        return PaymentSessionStatus.CANCELED;
      case "DUNNING_RECEIVED":
        return PaymentSessionStatus.CANCELED;
      case "AWAITING_RISK_ANALYSIS":
        // I'm treating this as authorized because it's a manual process (and should be minimal)
        return PaymentSessionStatus.AUTHORIZED;
    }
  }
  async refundPayment(
    paymentSessionData: PaymentSessionData,
    refundAmount: number
  ): Promise<PaymentSessionData | PaymentProcessorError> {
    const refundedCharge = await this.asaas.refundCharge({
      chargeId: paymentSessionData.charge.id,
      value: refundAmount,
      description: "Refund",
    });

    return {
      ...paymentSessionData,
      charge: refundedCharge,
    };
  }
  async retrievePayment(
    paymentSessionData: PaymentSessionData
  ): Promise<PaymentSessionData | PaymentProcessorError> {
    const charge = await this.asaas.getCharge({
      chargeId: paymentSessionData.charge.id,
    });
    return {
      ...paymentSessionData,
      charge,
    };
  }
  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
    console.log("ME");
    const { amount, customer, paymentSessionData } = context;

    if (
      customer.metadata.cpf !==
      (paymentSessionData as PaymentSessionData).customer.cpfCnpj
    ) {
      try {
        return this.initiatePayment(context);
      } catch (err) {
        return this.buildError(
          "unable to update payment because the initiate payment operation failed for the new customer",
          err
        );
      }
    }

    if (
      amount &&
      (paymentSessionData as PaymentSessionData).charge.value === amount
    ) {
      return;
    }

    try {
      const updatedCharge = await this.asaas.updateCharge({
        chargeId: (paymentSessionData as PaymentSessionData).charge.id,
        value: (amount / 100).toFixed(2),
      });

      return {
        session_data: {
          ...paymentSessionData,
          charge: updatedCharge,
        },
      };
    } catch (err) {
      return this.buildError(
        "unable to update payment because the update charge operation failed",
        err
      );
    }
  }

  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    throw new Error("Method not implemented.");
  }
}

export default Pix;
