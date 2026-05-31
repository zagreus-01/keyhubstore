import { Button, Empty, Skeleton, Space, Typography } from "antd";

const { Text, Title } = Typography;

export function PageLoading({ title = "Loading", rows = 4 }) {
  return (
    <div className="page-state rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-premium-soft backdrop-blur md:p-8" role="status" aria-live="polite">
      <Space direction="vertical" size={18} className="page-state-stack w-full max-w-3xl">
        <Skeleton.Input active size="small" className="page-state-kicker !w-44 !rounded-full" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} active paragraph={{ rows: 2 }} />
        ))}
      </Space>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function PageEmpty({
  title = "Nothing here yet",
  description = "Try changing the filters or come back later.",
  actionLabel,
  onAction
}) {
  return (
    <div className="page-state page-empty rounded-[28px] border border-white/80 bg-white/85 px-6 py-14 text-center shadow-premium-soft backdrop-blur">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction="vertical" size={6}>
            <Title level={4} className="!mb-0 !text-slate-950">
              {title}
            </Title>
            <Text type="secondary">{description}</Text>
          </Space>
        }
      >
        {actionLabel && (
          <Button type="primary" className="!bg-slate-950" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  );
}
