"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { toast } from "@/components/ui/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { changePassword, getMe, logout, queryKeys, updateProfile } from "@/lib/api/student";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: queryKeys.me, queryFn: getMe });

  // Seed the editable field once the profile lands, without clobbering edits
  // in progress on a background refetch.
  useEffect(() => {
    if (data?.user.phone !== undefined && phone === "") {
      setPhone(data.user.phone ?? "");
    }
  }, [data?.user.phone, phone]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setPhoneError(null);
      toast({ title: "Profile updated", description: result.message });
    },
    onError: (error) => {
      setPhoneError(error instanceof ApiClientError ? error.message : "Couldn't update your profile.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      toast({ title: "Password changed", description: "Use your new password next time you log in." });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        const details = error.details as Record<string, string[]> | undefined;
        if (details) {
          setPasswordErrors(
            Object.fromEntries(Object.entries(details).map(([key, messages]) => [key, messages[0] ?? ""])),
          );
          return;
        }
        setPasswordErrors({ currentPassword: error.message });
        return;
      }
      setPasswordErrors({ currentPassword: "Couldn't change your password." });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  if (isPending || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { user } = data;

  // Identity and academic fields originate at registration and are not
  // student-editable (Module 1 §3.10).
  const identityFields: Array<[string, string]> = [
    ["Full Name", user.fullName],
    ["Student ID", user.studentId ?? "—"],
    ["Department", user.department ?? "—"],
    ["Batch", user.batch ?? "—"],
    ["Email", user.email],
  ];

  function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      setPhoneError("Enter a valid phone number.");
      return;
    }
    setPhoneError(null);
    profileMutation.mutate({ phone: trimmed });
  }

  function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    passwordMutation.mutate(passwordForm);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Profile</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-border-subtle bg-bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-primary text-lg font-semibold text-bg-primary">
              {user.fullName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{user.fullName}</p>
              <p className="truncate text-xs text-text-secondary">Student</p>
            </div>
          </div>

          <dl className="mt-6 space-y-4">
            {identityFields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-text-secondary">{label}</dt>
                <dd className="mt-0.5 break-words text-sm text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-card border border-border-subtle bg-bg-surface p-6">
            <h2 className="text-sm font-medium text-text-primary">Contact</h2>
            <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                error={phoneError ?? undefined}
              />
              <Button type="submit" size="sm" loading={profileMutation.isPending}>
                Save Changes
              </Button>
            </form>
          </section>

          <section className="rounded-card border border-border-subtle bg-bg-surface p-6">
            <h2 className="text-sm font-medium text-text-primary">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <Input
                label="Current Password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((form) => ({ ...form, currentPassword: event.target.value }))
                }
                error={passwordErrors.currentPassword}
              />
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))}
                error={passwordErrors.newPassword}
              />
              <Input
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((form) => ({ ...form, confirmPassword: event.target.value }))
                }
                error={passwordErrors.confirmPassword}
              />
              <Button type="submit" size="sm" loading={passwordMutation.isPending}>
                Change Password
              </Button>
            </form>
          </section>

          <Button variant="danger" onClick={() => setIsLogoutOpen(true)}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Modal open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Log out?</ModalTitle>
            <ModalDescription>You&apos;ll need to sign in again to access your wallet.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
              Log Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
