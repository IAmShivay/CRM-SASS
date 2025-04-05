"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitePage() {
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
        router.push("/dashboard?inviteAccepted=true");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    toast.info("Invitation declined");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center bg-black text-white rounded-md font-bold text-xs w-12 h-12">
              SC
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Workspace Invitation</CardTitle>
          <CardDescription className="text-center">
            {email ? `You've been invited to join a workspace as ${email}` : "You've been invited to join a workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Processing your invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Return to Login
              </Button>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <p className="text-primary">Invitation accepted successfully!</p>
              <p>Redirecting to dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-center">
                You've been invited to collaborate in a workspace. Click the button below to accept this invitation and join the team.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Note: Your invitation will expire in 2 hours.
              </p>
            </div>
          )}
        </CardContent>
        {!loading && !error && !success && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleDecline}>
              Decline
            </Button>
            <Button onClick={handleAcceptInvite}>
              Accept Invitation
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
