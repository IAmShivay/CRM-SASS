"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Award, Users, TrendingUp, IndianRupee, Loader2 } from "lucide-react";
import {
  useGetActiveWorkspaceQuery,
  useGetCountByWorkspaceQuery,
  useGetQualifiedCountQuery,
  useGetRevenueByWorkspaceQuery,
  useGetROCByWorkspaceQuery,
} from "@/lib/store/services/workspace";
import { useGetWebhooksBySourceIdQuery } from "@/lib/store/services/webhooks";
import { UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

interface Workspace {
  id: string;
  name: string;
  role: string;
  industry?: string;
  status?: boolean;
  type?: string;
}

const SalesDashboard = () => {
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  const { data: activeWorkspace, isLoading: isWorkspaceLoading } =
    useGetActiveWorkspaceQuery();
  const { data: workspaceRevenue, isLoading: isRevenueLoading } =
    useGetRevenueByWorkspaceQuery(activeWorkspace?.data?.id, {
      skip: !activeWorkspace?.data?.id,
    });
  const { data: ROC, isLoading: isRocLoading } = useGetROCByWorkspaceQuery(
    activeWorkspace?.data?.id,
    {
      skip: !activeWorkspace?.data?.id,
    }
  );
  const { data: qualifiedCount, isLoading: isQualifiedCountLoading } =
    useGetQualifiedCountQuery(activeWorkspace?.data?.id, {
      skip: !activeWorkspace?.data?.id,
    });
  const { data: workspaceCount, isLoading: isCountLoading } =
    useGetCountByWorkspaceQuery(activeWorkspace?.data?.id, {
      skip: !activeWorkspace?.data?.id,
    });
  const { data: webhooks, isLoading: isWebhooksLoading } =
    useGetWebhooksBySourceIdQuery(
      {
        workspaceId: activeWorkspace?.data?.id,
        id: ROC?.top_source_id, // Using the top source ID from ROC data
      },
      {
        skip: !activeWorkspace?.data?.id || !ROC?.top_source_id,
      }
    );
  const { arrivedLeadsCount } = workspaceCount || 0;
  const isLoading = isWorkspaceLoading || isRevenueLoading;
  const updatedRevenue = workspaceRevenue?.totalRevenue.toFixed(2);
  const { monthly_stats } = ROC || 0;

  const dashboardStats = [
    {
      icon: <IndianRupee className="text-green-500" />,
      title: "Total Revenue",
      value: updatedRevenue || "0",
      change: workspaceRevenue?.change || "+0%",
      trend: "up",
    },
    {
      icon: <UserPlus className="text-orange-500" />,
      title: "Subscriptions",
      value: qualifiedCount?.qualifiedLeadsCount || "0",
      change: "+15% from last month",
      trend: "up",
    },
    {
      icon: <Users className="text-blue-500" />,
      title: "Sales",
      value: arrivedLeadsCount || 0,
      change: "+18% from last month",
      trend: "up",
    },
    {
      icon: <TrendingUp className="text-purple-500" />,
      title: "Active Now",
      value: `${ROC?.conversion_rate || 0}`,
      change: "+20% since last hour",
      trend: "up",
    },
  ];
  
  const salesData =
    monthly_stats?.map((stat: { month: string; convertedLeads: number }) => ({
      month: stat.month,
      sales: stat.convertedLeads,
    })) || [];
    
  const recentSales = [
    {
      id: "OM",
      name: "Olivia Martin",
      email: "olivia.martin@gmail.com",
      amount: "+$1,999.00"
    },
    {
      id: "JL",
      name: "Jackson Lee",
      email: "jackson.lee@gmail.com",
      amount: "+$39.00"
    },
    {
      id: "IN",
      name: "Isabella Nguyen",
      email: "isabella.nguyen@gmail.com",
      amount: "+$299.00"
    },
    {
      id: "WK",
      name: "William Kim",
      email: "will@gmail.com",
      amount: "+$99.00"
    },
    {
      id: "SD",
      name: "Sofia Davis",
      email: "sofia.davis@gmail.com",
      amount: "+$39.00"
    }
  ];

  if (
    isLoading ||
    isCountLoading ||
    isRevenueLoading ||
    isRocLoading ||
    isWorkspaceLoading ||
    isQualifiedCountLoading ||
    isWebhooksLoading
  ) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={`p-6 transition-all duration-500 ease-in-out w-full 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden `}
    >
      <div className="flex flex-col space-y-6 w-full">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6 w-full">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Download
          </button>
        </div>
        
        {/* Tabs - Only Analytics tab active */}
        <div className="border-b flex space-x-6 mb-6">
          <button className="pb-2 border-b-2 border-black font-medium text-sm">Analytics</button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="overflow-hidden border rounded-lg">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className={`ml-2 text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="md:col-span-2 overflow-hidden border rounded-lg">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-lg font-medium">Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Sales */}
          <Card className="overflow-hidden border rounded-lg">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-lg font-medium">Recent Sales</CardTitle>
              <p className="text-sm text-gray-500">You made 265 sales this month.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {recentSales.map((sale) => (
                  <div key={sale.email} className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-3">
                      {sale.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{sale.name}</p>
                      <p className="text-xs text-gray-500">{sale.email}</p>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {sale.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
