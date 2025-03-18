import { Card } from "@/components/ui/card";

interface DashboardStatProps {
  title: string;
  value: number;
}

export function DashboardStat({ title, value }: DashboardStatProps) {
  return (
    <Card className="dashboard-card p-6 hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-semibold mb-2 text-secondary-foreground">{title}</h3>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </Card>
  );
}