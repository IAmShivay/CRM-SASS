"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="container max-w-md py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Cancelled</CardTitle>
          <CardDescription>
            Your subscription process was cancelled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You have cancelled the subscription process. No charges have been made to your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you have any questions or encountered any issues during the subscription process, please contact our support team.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => router.push("/dashboard/subscription")}>
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
