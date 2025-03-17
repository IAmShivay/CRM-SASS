// 'use client'
// import React, { useState, useRef } from "react";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   Users,
//   Mail,
//   Trash2,
//   Upload,
//   UserCircle,
//   Loader2,
// } from "lucide-react";
// import { useGetMembersQuery } from "@/lib/store/services/members";
// import { useParams } from "next/navigation";
// interface WorkspaceMember {
//   id?: string;
//   email: string;
//   role: string;
//   status: "active" | "pending";
//   profileImage?: string;
//   name?: string;
// }
// interface MemberManagementProps {
//   isAdding: boolean;
//   isDeleting: boolean;
//   isResending: boolean;
//   isLoading: boolean;
//   members: WorkspaceMember[];
//   onMemberAdd: (member: WorkspaceMember) => void;
//   onMemberDelete: (memberId: string) => void;
//   onMemberUpdate: (member: WorkspaceMember) => void;
//   onInviteResend?: (member: WorkspaceMember) => void;  // New prop for handling resend
// }

// export default function MemberManagement({
//   members,
//   onMemberAdd,
//   onMemberDelete,
//   onMemberUpdate,
//   onInviteResend,
//   isAdding,
//   isDeleting,
//   isResending
// }: MemberManagementProps) {
//   const searchParams = useParams();
//   const { id: workspaceId }: any = searchParams
//   // const { data: membersData } = useGetMembersQuery(workspaceId);
//   const [newInviteEmail, setNewInviteEmail] = useState("");
//   const [newInviteRole, setNewInviteRole] = useState("member");
//   const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(null);
//   // const [isResending, setIsResending] = useState<string | null>(null);  // Track which invite is being resent
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleInviteMember = async () => {
//     if (!newInviteEmail) return;

//     const newMember: WorkspaceMember = {
//       email: newInviteEmail,
//       role: newInviteRole,
//       status: "pending",
//     };

//     onMemberAdd(newMember);
//     setNewInviteEmail("");
//     setNewInviteRole("member");
//   };

//   const handleDeleteMember = (member: WorkspaceMember) => {
//     setMemberToDelete(member);
//   };
//   const handleResendInvite = async (member: WorkspaceMember) => {
//     if (!member.id || !onInviteResend) return;
//     await onInviteResend(member);
//   };
//   const confirmDeleteMember = () => {
//     if (memberToDelete) {
//       if (memberToDelete.id) {
//         onMemberDelete(memberToDelete.id);
//       }
//       setMemberToDelete(null);
//     }
//   };

//   const handleProfileImageUpload = async (
//     memberId: string,
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     // In a real app, you would upload to your server here
//     const imageUrl = "/api/placeholder/32/32";

//     const updatedMember = members.find(m => m.id === memberId);
//     if (updatedMember) {
//       onMemberUpdate({ ...updatedMember, profileImage: imageUrl });
//     }

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle>Members & Invitations</CardTitle>
//             <CardDescription>
//               Manage workspace members and send invitations
//             </CardDescription>
//           </div>
//           <Users className="w-8 h-8 text-muted-foreground" />
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {/* Invite Form */}
//         <div className="space-y-4">
//           <Label>Invite New Member</Label>
//           <div className="flex flex-col sm:flex-row gap-2">
//             <Input
//               type="email"
//               placeholder="Email address"
//               value={newInviteEmail}
//               onChange={(e) => setNewInviteEmail(e.target.value)}
//               className="flex-1"
//             />
//             <Select
//               value={newInviteRole}
//               onValueChange={setNewInviteRole}
//             >
//               <SelectTrigger className="w-full sm:w-[140px]">
//                 <SelectValue placeholder="Role" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="admin">Admin</SelectItem>
//                 <SelectItem value="member">Member</SelectItem>
//               </SelectContent>
//             </Select>
//             <Button
//               onClick={handleInviteMember}
//               className="w-full sm:w-auto"
//             >
//               <Mail className="mr-2 h-4 w-4" />
//               Invite
//             </Button>
//           </div>
//         </div>

//         {/* Members List */}
//         <div className="space-y-4">
//           <Label>Current Members & Pending Invites</Label>
//           <div className="space-y-2">
//             {members.map((member) => (
//               <div
//                 key={member?.id}
//                 className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary rounded-lg gap-4"
//               >
//                 <div className="flex items-center space-x-4">
//                   <div className="relative">
//                     {member?.profileImage ? (
//                       <img
//                         src={member?.profileImage || ""}
//                         alt={member?.name || member?.email}
//                         className="w-10 h-10 rounded-full object-cover"
//                       />
//                     ) : (
//                       <UserCircle className="w-10 h-10" />
//                     )}
//                     <input
//                       type="file"
//                       accept="image/*"
//                       className="hidden"
//                       ref={fileInputRef}
//                       onChange={(e) => member?.id && handleProfileImageUpload(member.id, e)}
//                     />
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="absolute -bottom-1 -right-1 w-6 h-6 p-0 rounded-full bg-primary hover:bg-primary/90"
//                       onClick={() => fileInputRef.current?.click()}
//                     >
//                       <Upload className="w-3 h-3 text-white" />
//                     </Button>
//                   </div>
//                   <div>
//                     <p className="font-medium">
//                       {member?.name || member?.email}
//                     </p>
//                     <p className="text-sm text-muted-foreground">
//                       {member?.email}
//                     </p>
//                     <p className="text-sm text-muted-foreground capitalize">
//                       {member?.role} • {member?.status}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-2 self-end sm:self-center">
//                   {member?.status === "pending" && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handleResendInvite(member)}
//                       disabled={isResending}
//                     >
//                       {isResending ? (
//                         <>
//                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                           Resending...
//                         </>
//                       ) : (
//                         'Resend'
//                       )}
//                     </Button>
//                   )}
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="text-destructive hover:text-destructive/90"
//                     onClick={() => handleDeleteMember(member)}
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Delete Member Confirmation Dialog */}
//         <AlertDialog
//           open={!!memberToDelete}
//           onOpenChange={() => setMemberToDelete(null)}
//         >
//           <AlertDialogContent className="sm:max-w-[425px]">
//             <AlertDialogHeader>
//               <AlertDialogTitle>Delete Member</AlertDialogTitle>
//               <AlertDialogDescription>
//                 Are you sure you want to remove{" "}
//                 {memberToDelete?.name || memberToDelete?.email} from the
//                 workspace? This action cannot be undone.
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter className="sm:flex-row sm:justify-end gap-2">
//               <AlertDialogCancel className="sm:w-auto">Cancel</AlertDialogCancel>
//               <AlertDialogAction
//                 onClick={confirmDeleteMember}
//                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
//               >
//                 Delete
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </CardContent>
//     </Card>
//   );
// }
"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateMemberMutation } from "@/lib/store/services/members"; // Adjust the import path
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";

import { Users, Mail, Trash2, Upload, UserCircle, Loader2 } from "lucide-react";

import { useParams } from "next/navigation";
import CartForm from "@/components/ui/cardForm";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface WorkspaceMember {
  id?: string;
  email: string;
  role: string;
  status: "active" | "pending";
  profileImage?: string;
  name?: string;
}

interface MemberManagementProps {
  isAdding: boolean;
  isDeleting: boolean;
  isResending: boolean;
  isLoading: boolean;
  members: WorkspaceMember[];
  onMemberAdd: (member: WorkspaceMember) => void;
  onMemberDelete: (memberId: string) => void;
  onMemberUpdate: (member: WorkspaceMember) => void;
  onInviteResend?: (member: WorkspaceMember) => void;
}

export default function MemberManagement({
  members,
  onMemberAdd,
  onMemberDelete,
  onMemberUpdate,
  onInviteResend,
  isAdding,
  isDeleting,
  isResending,
  isLoading,
}: MemberManagementProps) {
  const searchParams = useParams();
  const { id: workspaceId }: any = searchParams
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("member");
  const [resendingMembers, setResendingMembers] = useState<{ [key: string]: boolean }>({});

  const [selectedEmail, setSelectedEmail] = useState<string | undefined>(
    undefined
  );
  // const [isAllowToEdit, setIsAllowToEdit] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInviteMember = async () => {
    if (!newInviteEmail) return;

    const newMember: WorkspaceMember = {
      email: newInviteEmail,
      role: newInviteRole,
      status: "pending",
    };

    await onMemberAdd(newMember);
    setNewInviteEmail("");
    setNewInviteRole("member");
  };

  const {
    data: activeWorkspace,
    isLoading: activeWorkspaceLoading,
    isError: activeWorkspaceError,
  } = useGetActiveWorkspaceQuery();

  const handleDeleteMember = (member: WorkspaceMember) => {
    setMemberToDelete(member);
  };

  const handleResendInvite = async (member: WorkspaceMember) => {
    if (!member.id || !onInviteResend) return;
    
    // Set loading state for this specific member
    setResendingMembers(prev => ({ ...prev, [member.id!]: true }));
    
    try {
      await onInviteResend(member);
    } finally {
      // Clear loading state for this member regardless of success/failure
      setResendingMembers(prev => ({ ...prev, [member.id!]: false }));
    }
  };

  const confirmDeleteMember = async () => {
    if (memberToDelete?.id) {
      await onMemberDelete(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  const handleProfileImageUpload = async (
    memberId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload to your server here
    const imageUrl = "/api/placeholder/32/32";

    const updatedMember = members.find((m) => m.id === memberId);
    if (updatedMember) {
      await onMemberUpdate({ ...updatedMember, profileImage: imageUrl });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /// it is working in future if someone want to allow some part on based of login user role

  // const { data } = useGetMemberRoleQuery(workspaceId);
  // const userRole = data?.data?.role ?? "No Role Found";

  // useEffect(() => {
  //   console.log(userRole);

  //   if (userRole === "SuperAdmin") {
  //     setIsAllowToEdit(true);
  //   } else {
  //     setIsAllowToEdit(false);
  //   }
  //   console.log(isAllowToEdit);
  // }, [userRole, isAllowToEdit]);

  const openEditDialog = (member: { email: string }) => {
    setSelectedEmail(member.email || undefined);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setSelectedEmail(undefined);
  };

  const [updateMember] = useUpdateMemberMutation();

  const handleSubmit = async (data: {
    email: string;
    role: "admin" | "member";
  }) => {
    const updatedMember = members.find((m) => m.email === data.email);
    if (!updatedMember) {
      toast.error("Member not found!");
      return;
    }

    try {
      // Call the API to update the member role
      const response = await updateMember({
        workspaceId,
        id: updatedMember.id ?? " ",
        updates: { role: data.role },
      }).unwrap();

      // Optionally update local state if needed
      await onMemberUpdate({ ...updatedMember, role: data.role });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Error updating member role");
    }

    closeDialog();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members & Invitations</CardTitle>
            <CardDescription>
              Manage workspace members and send invitations
            </CardDescription>
          </div>
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Form */}
        <div className="space-y-4">
          <Label>Invite New Member</Label>
          <div className="  flex md:flex-row flex-col   gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={newInviteEmail}
              onChange={(e) => setNewInviteEmail(e.target.value)}
              className="flex-1"
              disabled={isAdding}
            />
            <div className="  flex md:flex-row gap-2">
              <Select
                value={newInviteRole}
                onValueChange={setNewInviteRole}
                disabled={isAdding}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInviteMember}
                className="w-full sm:w-auto"
                disabled={isAdding || !newInviteEmail}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <Label>Current Members & Pending Invites</Label>
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member?.id}
                  className="flex  flex-row sm:flex-row sm:items-center justify-between p-2 md:p-4 bg-secondary rounded-lg gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      {member?.profileImage ? (
                        <img
                          src={member.profileImage}
                          alt={member.name || member.email}
                          className="md:w-10 md:h-10 w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="md:w-10 md:h-10 w-8 h-8" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) =>
                          member?.id && handleProfileImageUpload(member.id, e)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -bottom-1 -right-1 md:w-6 md:h-6 w-5 h-5 p-0 rounded-full bg-primary hover:bg-primary/90"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium text-[12px]">
                        {member?.name || member?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member?.email}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member?.role} • {member?.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex md:flex-row flex-col items-center space-x-2 self-end sm:self-center">
                    {member?.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(member)}
                        disabled={resendingMembers[member.id!]}
                      >
                        {resendingMembers[member.id!] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resending...
                          </>
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    )}

                    <div className="flex ">
                      {/* Edit Button */}
                      <button onClick={() => openEditDialog(member)}>
                        {member.role === "member" && (
                          <Pencil className="h-3 w-3" />
                        )}
                      </button>

                      {/* Dialog */}
                      {isOpen && (
                        <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 bg-opacity-20 dark:bg-opacity-10">
                          <div className="relative p-6 rounded-lg w-[40rem] h-[24rem] bg-white dark:bg-gray-800 shadow-lg">
                            {/* Modal Header */}
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
                              Edit User Role
                            </h3>

                            {/* Workspace Name */}
                            <h1 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
                              Workspace:
                              <span className="text-gray-500 dark:text-gray-400">
                                {activeWorkspace?.data?.name}
                              </span>
                            </h1>

                            {/* Cart Form */}
                            <CartForm
                              onSubmit={handleSubmit}
                              defaultEmail={selectedEmail}
                            />

                            {/* Close Button */}
                            <div className="absolute h-6 w-6 top-3 right-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center p-1">
                              <button
                                onClick={closeDialog}
                                className="text-gray-400 dark:text-gray-300"
                              >
                                ✖
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleDeleteMember(member)}
                        disabled={isDeleting}
                      >
                        {isDeleting && memberToDelete?.id === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Member Confirmation Dialog */}
        <AlertDialog
          open={!!memberToDelete}
          onOpenChange={() => setMemberToDelete(null)}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                {memberToDelete?.name || memberToDelete?.email} from the
                workspace? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:flex-row sm:justify-end gap-2">
              <AlertDialogCancel className="sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
