import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
} from "@medusajs/medusa";
import AsaasService from "./asaas";
import { Asaas } from "src/types/asaas-api";
import { AxiosError } from "axios";

type SessionData = {
  charge_id: Asaas.Charge["id"];
  customer: Asaas.Customer;
};

class AsaasPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "asaas-payment-processor";
  private asaas: AsaasService;

  constructor(container, options) {
    super(container, options);

    this.asaas = container.asaasService;
  }

  private _handleError(error: any): PaymentProcessorError {
    console.log("ASAAS PAYMENT PROCESSOR ERROR", error);

    if (error instanceof AxiosError) {
      return {
        error: Array.isArray(error.response.data.errors)
          ? error.response.data.errors.map((e) => e.description).join(", ")
          : "Error interacting with Asaas API",
        code: error.code,
        detail: error.message,
      };
    }

    return {
      error: "Error interacting with Asaas API",
      code: error.code,
      detail: error.message,
    };
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    if (!context.customer.metadata.cpf) throw new Error("Customer has no CPF");

    try {
      const customer = await this.asaas.getOrCreateCustomerByCPF({
        cpfCnpj: context.customer.metadata.cpf as string,
        name: `${context.customer.first_name} ${context.customer.last_name}`,
        email: context.customer.email,
        externalReference: context.customer.id,
      });

      const charge = await this.asaas.createCharge({
        customer: customer.id,
        billingType: "UNDEFINED", // This means all types should be created - and the customer can choose
        dueDate: new Date(new Date().getTime() + 24 * 60 * 1000), // 24 hours from now
        value: context.amount / 100,
        externalReference: context.resource_id,
        description: `Pedido #${context.resource_id}`,
      });

      return {
        session_data: {
          charge_id: charge.id,
          customer: customer,
        } as SessionData,
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async retrievePayment(
    paymentSessionData: SessionData
  ): Promise<Asaas.Charge | PaymentProcessorError> {
    try {
      return await this.asaas.getCharge({
        chargeId: paymentSessionData.charge_id,
      });
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getPaymentStatus(
    paymentSessionData: SessionData | Asaas.Charge
  ): Promise<PaymentSessionStatus> {
    const charge = await this.asaas.getCharge({
      chargeId: isPaymentSessionData(paymentSessionData)
        ? paymentSessionData.charge_id
        : paymentSessionData.id,
    });

    console.log("CHARGE STATUS", charge.status);

    switch (charge.status) {
      case "PENDING":
      case "RECEIVED":
      case "CONFIRMED":
      case "RECEIVED_IN_CASH":
        return PaymentSessionStatus.AUTHORIZED;
      case "OVERDUE":
      case "REFUNDED":
      case "REFUND_REQUESTED":
      case "REFUND_IN_PROGRESS":
      case "CHARGEBACK_REQUESTED":
      case "CHARGEBACK_DISPUTE":
      case "AWAITING_CHARGEBACK_REVERSAL":
      case "DUNNING_REQUESTED":
      case "DUNNING_RECEIVED":
      case "AWAITING_RISK_ANALYSIS":
        return PaymentSessionStatus.CANCELED;
      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
    const sessionData = context.paymentSessionData as SessionData;

    try {
      await this.asaas.updateCharge({
        chargeId: sessionData.charge_id,
        value: context.amount / 100,
        externalReference: context.resource_id,
        description: `Pedido #${context.resource_id}`,
      });

      return {
        session_data: sessionData,
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async deletePayment(
    paymentSessionData: SessionData
  ): Promise<SessionData | PaymentProcessorError> {
    try {
      await this.asaas.cancelCharge({ chargeId: paymentSessionData.charge_id });
    } catch (error) {
      return this._handleError(error);
    }

    return paymentSessionData;
  }

  async cancelPayment(
    paymentSessionData: SessionData
  ): Promise<SessionData | PaymentProcessorError> {
    return this.deletePayment(paymentSessionData);
  }

  async authorizePayment(
    paymentSessionData: SessionData,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: Record<string, unknown>;
      }
  > {
    const status = await this.getPaymentStatus(paymentSessionData);
    return { data: paymentSessionData, status };
  }

  async refundPayment(
    paymentSessionData: SessionData,
    refundAmount: number
  ): Promise<SessionData | PaymentProcessorError> {
    try {
      await this.asaas.refundCharge({
        chargeId: paymentSessionData.charge_id,
        value: refundAmount,
      });

      return paymentSessionData;
    } catch (error) {
      return this._handleError(error);
    }
  }

  //  I believe we don't need this.
  async capturePayment(
    paymentSessionData: SessionData
  ): Promise<SessionData | PaymentProcessorError> {
    return paymentSessionData;
  }

  // I'm not sure how to implement this
  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    throw new Error("Method not implemented.");
  }
}

export default AsaasPaymentProcessor;

const isPaymentSessionData = (
  data: SessionData | Asaas.Charge
): data is SessionData => {
  return (data as SessionData).charge_id !== undefined;
};
