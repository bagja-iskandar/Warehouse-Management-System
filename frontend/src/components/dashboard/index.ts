export * from "./DashboardContainer";
export * from "./DashboardHeader";
export * from "./DashboardMetricCard";
export * from "./DashboardSectionCard";
export * from "./DashboardEmptyState";
export * from "./DashboardSkeleton";
export * from "./DashboardErrorState";

// Re-export common aliases for universal layout standardization
export { PageContainer } from "../layout/PageContainer";
export { PageHeader } from "../layout/PageHeader";
export { FilterBar } from "../layout/FilterBar";
export { DashboardMetricCard as MetricCard } from "./DashboardMetricCard";
export { DashboardSectionCard as SectionCard } from "./DashboardSectionCard";
export { DashboardEmptyState as EmptyState } from "./DashboardEmptyState";
export { DashboardSkeleton as LoadingSkeleton } from "./DashboardSkeleton";
export { DashboardErrorState as ErrorState } from "./DashboardErrorState";
