import { Card } from "@/components/ui/card";

interface DashboardStatProps {
  title: string;
  value: number;
}

export function DashboardStat({ title, value }: DashboardStatProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}