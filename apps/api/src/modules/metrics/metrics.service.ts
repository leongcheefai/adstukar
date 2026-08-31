import type { MetricsOverview } from "@repo/contracts";
import { generateMockMetrics } from "./metrics.mock";

export function getMetricsOverview(): MetricsOverview {
  return generateMockMetrics();
}
