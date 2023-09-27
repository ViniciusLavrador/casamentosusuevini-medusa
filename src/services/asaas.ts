import { TransactionBaseService } from "@medusajs/medusa";
import axios, { AxiosInstance } from "axios";

import { Asaas } from "src/types/asaas-api";

class AsaasService extends TransactionBaseService {
  private apiClient: AxiosInstance = axios.create({
    baseURL: process.env.ASAAS_API_URL,
    timeout: 3000,
    headers: {
      accept: "application/json",
      access_token: process.env.ASAAS_API_KEY,
    },
  });

  public isChargePaid(charge: Asaas.Charge): boolean {
    return (
      ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"] as Asaas.Charge["status"][]
    ).includes(charge.status);
  }

  public async listCustomers(
    params: Asaas.Request.ListCustomers
  ): Promise<Asaas.Response.ListCustomers> {
    const { data } = await this.apiClient.get<Asaas.Response.ListCustomers>(
      "/customers",
      { params }
    );

    return data;
  }

  public async createCustomer(
    params: Asaas.Request.CreateCustomer
  ): Promise<Asaas.Response.CreateCustomer> {
    console.log("creating customer in asaas with params", { params });

    const { data } = await this.apiClient.post<Asaas.Response.CreateCustomer>(
      "/customers",
      { ...params }
    );

    return data;
  }

  public async createCharge(
    params: Asaas.Request.CreateCharge
  ): Promise<Asaas.Response.CreateCharge> {
    console.log("creating charge in asaas with params", { params });

    const { data } = await this.apiClient.post<Asaas.Response.CreateCharge>(
      "/payments",
      { ...params }
    );

    return data;
  }

  public async getCharge(
    params: Asaas.Request.GetCharge
  ): Promise<Asaas.Response.GetCharge> {
    console.log("getting charge in asaas with params", { params });

    const { data } = await this.apiClient.get<Asaas.Response.GetCharge>(
      `/payments/${params.chargeId}`
    );

    return data;
  }

  public async getQRCode(
    params: Asaas.Request.GetQRCode
  ): Promise<Asaas.Response.GetQRCode> {
    console.log("getting QRCode in asaas with params", { params });

    const { data } = await this.apiClient.get<Asaas.Response.GetQRCode>(
      `/payments/${params.chargeId}/pixQrCode`
    );

    return data;
  }

  public async cancelCharge(
    params: Asaas.Request.CancelCharge
  ): Promise<Asaas.Response.CancelCharge> {
    console.log("canceling charge in asaas with params", { params });

    const { data } = await this.apiClient.delete<Asaas.Response.CancelCharge>(
      `/payments/${params.chargeId}`
    );

    return data;
  }

  public async refundCharge(
    params: Asaas.Request.RefundCharge
  ): Promise<Asaas.Response.RefundCharge> {
    console.log("refunding charge in asaas with params", { params });

    const { data } = await this.apiClient.post<Asaas.Response.RefundCharge>(
      `/payments/${params.chargeId}/refund`,
      { ...params }
    );

    return data;
  }

  public async updateCharge(
    params: Asaas.Request.UpdateCharge
  ): Promise<Asaas.Response.UpdateCharge> {
    console.log("updating charge in asaas with params", { params });

    const { data } = await this.apiClient.post<Asaas.Response.UpdateCharge>(
      `/payments/${params.chargeId}`,
      { ...params }
    );

    return data;
  }
}

export default AsaasService;
