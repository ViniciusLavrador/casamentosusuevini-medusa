export namespace Asaas {
  type LIST_OBJECT = "list";
  type CUSTOMER_OBJECT = "customer";
  type CHARGE_OBJECT = "payment";
  type BILLING_TYPE = "UNDEFINED" | "BOLETO" | "CREDIT_CARD" | "PIX";
  type PERSON_TYPE = "FISICA" | "JURIDICA";
  type CUSTOMER_GROUP = { name: string };
  type CHARGE_STATUS =
    | "PENDING"
    | "RECEIVED"
    | "CONFIRMED"
    | "OVERDUE"
    | "REFUNDED"
    | "RECEIVED_IN_CASH"
    | "REFUND_REQUESTED"
    | "REFUND_IN_PROGRESS"
    | "CHARGEBACK_REQUESTED"
    | "CHARGEBACK_DISPUTE"
    | "AWAITING_CHARGEBACK_REVERSAL"
    | "DUNNING_REQUESTED"
    | "DUNNING_RECEIVED"
    | "AWAITING_RISK_ANALYSIS";

  type CHARGE_WEBHOOK_EVENT =
    | "PAYMENT_CREATED"
    | "PAYMENT_AWAITING_RISK_ANALYSIS"
    | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
    | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
    | "PAYMENT_UPDATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_ANTICIPATED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_DELETED"
    | "PAYMENT_RESTORED"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_REFUND_IN_PROGRESS"
    | "PAYMENT_RECEIVED_IN_CASH_UNDONE"
    | "PAYMENT_CHARGEBACK_REQUESTED"
    | "PAYMENT_CHARGEBACK_DISPUTE"
    | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
    | "PAYMENT_DUNNING_RECEIVED"
    | "PAYMENT_DUNNING_REQUESTED"
    | "PAYMENT_BANK_SLIP_VIEWED"
    | "PAYMENT_CHECKOUT_VIEWED";

  type ListResponse<T> = {
    object: LIST_OBJECT;
    hasMore: boolean;
    totalCount: number;
    limit: number;
    offset: number;
    data: T[];
  };

  type CancelResponse = {
    deleted: boolean;
    id: string;
  };

  export type Customer = {
    object: CUSTOMER_OBJECT;
    id: string;
    dateCreated: Date;
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    mobilePhone?: string;
    deleted: boolean;
    additionalEmails?: string;
    externalReference?: string;
    notificationDisabled: boolean;
    groups?: CUSTOMER_GROUP[];
    personType?: PERSON_TYPE;
    observations?: string;
  };

  export type Discount = {
    value: number;
    dueDateLimitDays: number;
  };

  export type Fine = {
    value: number;
  };

  export type Interest = {
    value: number;
  };

  export type Refund = {
    dateCreated: string;
    status: string;
    value: number;
    description: string;
    transactionReceiptUrl: string;
  };

  export type ChargeBack = {
    status: string;
    reason: string;
  };

  export type Charge = {
    object: CHARGE_OBJECT;
    id: string;
    dateCreated: Date;
    customer: string;
    paymentLink?: string;
    dueDate?: Date;
    value?: number;
    netValue?: number;
    billingType?: BILLING_TYPE;
    canBePaidAfterDueDate?: boolean;
    pixTransaction?: string;
    status?: CHARGE_STATUS;
    description?: string;
    externalReference?: string;
    originalValue?: number;
    interestValue?: number;
    originalDueDate?: Date;
    paymentDate?: Date;
    clientPaymentDate?: Date;
    installmentNumber?: string;
    transactionReceiptUrl?: string;
    nossoNumero?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    invoiceNumber?: string;
    discount?: Discount;
    fine?: Fine;
    interest?: Interest;
    deleted: boolean;
    postalService: boolean;
    anticipated: boolean;
    anticipable: boolean;
    chargeBack?: ChargeBack;
    refunds?: Refund[];
  };

  export type QRCode = {
    encodedImage: string;
    payload: string;
    expirationDate: Date;
  };

  type Callback = {
    successUrl: string;
    autoRedirect?: boolean;
  };

  export namespace Request {
    export type ListCustomers = {
      name?: string;
      email?: string;
      cpfCnpj?: string;
      limit?: number;
    };

    export type CreateCustomer = {
      name: string;
      email: string;
      cpfCnpj: string;
      externalReference?: string;
    };

    export type CreateCharge = {
      customer: string;
      billingType: BILLING_TYPE;
      dueDate: Date;
      value?: number;
      description?: string;
      externalReference?: string;
      installmentCount?: number;
      totalValue?: number;
      callback?: Callback;
    };

    export type GetQRCode = {
      chargeId: string;
    };

    export type GetCharge = {
      chargeId: string;
    };

    export type CancelCharge = {
      chargeId: string;
    };

    export type RefundCharge = {
      chargeId: string;
      value?: number;
      description?: string;
    };

    export type UpdateCharge = {
      chargeId: string;
      customer?: string;
      billingType?: BILLING_TYPE;
      value?: number;
      dueDate?: Date;
      description?: string;
      externalReference?: string;
      installmentCount?: number;
      installmentValue?: number;
    };
  }

  export namespace Response {
    export type ListCustomers = ListResponse<Customer>;
    export type CreateCustomer = Customer;
    export type CreateCharge = Charge;
    export type GetQRCode = QRCode;
    export type GetCharge = Charge;
    export type CancelCharge = CancelResponse;
    export type RefundCharge = Charge;
    export type UpdateCharge = Charge;
  }

  export namespace Webhook {
    export type ChargeParams = {
      event: CHARGE_WEBHOOK_EVENT;
      payment: Charge;
    };
  }
}
