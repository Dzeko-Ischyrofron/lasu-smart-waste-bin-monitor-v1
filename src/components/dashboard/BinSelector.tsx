import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

interface Bin {
  id: string;
  name: string;
  location: string;
}

interface Props {
  bins: Bin[];
  value: string;
  onChange: (binId: string) => void;
}

export function BinSelector({ bins, value, onChange }: Props) {
  if (bins.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <Trash2 className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder="Select bin" />
        </SelectTrigger>
        <SelectContent>
          {bins.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name} <span className="text-muted-foreground">— {b.location}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
