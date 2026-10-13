import { initialsFrom } from "../../utils/formatters";

interface AvatarProps {
  label: string;
}

// UI-only concept — no backend field for this. Derived from the
// transaction's Vendor/Description at render time.
export default function Avatar({ label }: AvatarProps) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-medium text-accent-dark">
      {initialsFrom(label)}
    </div>
  );
}
