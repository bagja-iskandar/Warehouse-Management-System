import { apiClient } from "@/lib/api-client";
import { AdminOverview, CustomerSummary, DriverSummary, OperationalCounts } from "@/types";

export interface IAnalyticsService {
  getAdminOverview(warehouseId?: string): Promise<AdminOverview>;
  getCustomerSummary(customerId?: string): Promise<CustomerSummary>;
  getDriverSummary(driverId?: string): Promise<DriverSummary>;
  getOperationalCounts(): Promise<OperationalCounts>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL wms_db)
 */
export class HttpAnalyticsService implements IAnalyticsService {
  async getAdminOverview(warehouseId?: string): Promise<AdminOverview> {
    const url = warehouseId
      ? `/analytics/admin-overview?warehouseId=${encodeURIComponent(warehouseId)}`
      : "/analytics/admin-overview";
    return apiClient<AdminOverview>(url);
  }

  async getCustomerSummary(customerId?: string): Promise<CustomerSummary> {
    const url = customerId
      ? `/analytics/customer-summary?customerId=${encodeURIComponent(customerId)}`
      : "/analytics/customer-summary";
    return apiClient<CustomerSummary>(url);
  }

  async getDriverSummary(driverId?: string): Promise<DriverSummary> {
    const url = driverId
      ? `/analytics/driver-summary?driverId=${encodeURIComponent(driverId)}`
      : "/analytics/driver-summary";
    return apiClient<DriverSummary>(url);
  }

  async getOperationalCounts(): Promise<OperationalCounts> {
    return apiClient<OperationalCounts>("/analytics/operational-counts");
  }
}

export const analyticsService: IAnalyticsService = new HttpAnalyticsService();
