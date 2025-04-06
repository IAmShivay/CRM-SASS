"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// This tells Next.js to render this page dynamically at request time
export const dynamic = 'force-dynamic';

// Create a loading component
function InvitePageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Processing Invitation</CardTitle>
          <CardDescription>Please wait while we process your invitation...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

// Main component wrapped in Suspense
function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract parameters from URL
  const email = searchParams?.get("email") || "";
  const workspaceId = searchParams?.get("workspaceId") || "";
  const status = searchParams?.get("status") || "";

  useEffect(() => {
    // Validate parameters
    if (!email || !workspaceId) {
      setError("Invalid invitation link. Missing required parameters.");
      setLoading(false);
      return;
    }

    // Show the component first, don't process automatically
    setLoading(false);
  }, [email, workspaceId]);

  const handleAcceptInvite = async () => {
    setLoading(true);
    try {
      // Call the API to accept the invitation
      const response = await fetch(`/api/auth?action=acceptInvite&email=${email}&workspaceId=${workspaceId}&status=${status}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept invitation");
      }

      // Set success state
      setSuccess(true);
      toast.success("Invitation accepted successfully!");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while accepting the invitation.");
      toast.error("Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = () => {
    // Just redirect to the login page
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{success ? "Invitation Accepted" : "Workspace Invitation"}</CardTitle>
          <CardDescription>
            {success
              ? "You have successfully joined the workspace."
              : `You've been invited to join a workspace. Would you like to accept?`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                <strong>Email:</strong> {email}
              </p>
              {/* Don't show workspace ID to user, it's internal */}
            </div>
          )}
        </CardContent>
        {!loading && !error && !success && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleDeclineInvite}>
              Decline
            </Button>
            <Button onClick={handleAcceptInvite}>Accept Invitation</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Export the page component with Suspense
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<InvitePageLoading />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
