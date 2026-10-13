import { ReactNode } from "react";

interface PageHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeading({ title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-medium text-ink">{title}</h1>
        {description && <p className="mt-1 text-xs sm:text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
}
