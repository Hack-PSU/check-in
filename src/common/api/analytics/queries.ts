import { createQuery, CreateQueryReturn } from "@/common/api/utils";
import {
  AnalyticsEventsResponse,
  AnalyticsScansResponse,
  AnalyticsSummaryResponse,
} from "@/common/api/analytics/entity";
import { QueryAction, QueryScope } from "@/common/api/types";

/**
 * Get all analytics summary
 */
export const getAnalyticsSummary: CreateQueryReturn<AnalyticsSummaryResponse> =
  createQuery("/analytics/summary");

/**
 * Get all analytics for events
 */
export const getAnalyticsEvents: CreateQueryReturn<AnalyticsEventsResponse[]> =
  createQuery("/analytics/events");

/**
 * get all analytics for scans
 */
export const getAnalyticsScans: CreateQueryReturn<AnalyticsScansResponse[]> =
  createQuery("/analytics/scans");

export const AnalyticsQueryKeys = {
  all: [{ entity: "analytics" }],
  findAll: () =>
    [
      {
        ...AnalyticsQueryKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  findOne: (endpoint: string) =>
    [
      {
        ...AnalyticsQueryKeys.all[0],
        action: QueryAction.query,
        scope: endpoint,
      },
    ] as const,
};
