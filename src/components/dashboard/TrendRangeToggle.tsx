import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TrendRange = "day" | "week" | "month";

interface Props {
  value: TrendRange;
  onChange: (v: TrendRange) => void;
}

export function TrendRangeToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(v) => v && onChange(v as TrendRange)}
      className="border rounded-md"
    >
      <ToggleGroupItem value="day" className="text-xs px-3">Day</ToggleGroupItem>
      <ToggleGroupItem value="week" className="text-xs px-3">Week</ToggleGroupItem>
      <ToggleGroupItem value="month" className="text-xs px-3">Month</ToggleGroupItem>
    </ToggleGroup>
  );
}
