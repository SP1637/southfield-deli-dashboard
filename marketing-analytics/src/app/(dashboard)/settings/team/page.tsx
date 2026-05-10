"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users, UserPlus, Trash2, Crown, Eye, Edit3,
  Mail, CheckCircle2, AlertTriangle, Shield, X, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "admin" | "editor" | "viewer";

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: Role;
  status: "active" | "pending";
  joinedAt: string;
}

const ROLES: { value: Role; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access — manage team, sources, and all settings",
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can connect sources and edit dashboard settings",
    icon: Edit3,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to dashboards and reports",
    icon: Eye,
    color: "text-green-600 dark:text-green-400",
  },
];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "View all dashboards",
    "Edit dashboard settings",
    "Connect & disconnect data sources",
    "Invite & remove team members",
    "Manage billing & subscription",
    "Generate & export reports",
    "Create & manage alerts",
  ],
  editor: [
    "View all dashboards",
    "Edit dashboard settings",
    "Connect & disconnect data sources",
    "Generate & export reports",
    "Create & manage alerts",
  ],
  viewer: [
    "View all dashboards",
    "Generate & export reports",
  ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedRoleInfo, setSelectedRoleInfo] = useState<Role | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // Seed with current user as admin
  useEffect(() => {
    if (session?.user?.email) {
      const stored = (() => {
        try { return JSON.parse(localStorage.getItem("team_members") ?? "null"); } catch { return null; }
      })();

      if (stored) {
        setMembers(stored);
      } else {
        const initial: TeamMember[] = [{
          id: "owner",
          email: session.user.email,
          name: session.user.name ?? undefined,
          avatar: session.user.image ?? undefined,
          role: "admin",
          status: "active",
          joinedAt: new Date().toISOString(),
        }];
        setMembers(initial);
        try { localStorage.setItem("team_members", JSON.stringify(initial)); } catch {}
      }
    }
  }, [session]);

  function persist(updated: TeamMember[]) {
    try { localStorage.setItem("team_members", JSON.stringify(updated)); } catch {}
    setMembers(updated);
  }

  function inviteMember() {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    setTimeout(() => {
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        email: inviteEmail.trim(),
        role: inviteRole,
        status: "pending",
        joinedAt: new Date().toISOString(),
      };
      persist([...members, newMember]);
      setInviteEmail("");
      setInviteRole("viewer");
      setShowInvite(false);
      setInviting(false);
      showToast(`Invite sent to ${newMember.email}`, true);
    }, 800);
  }

  function changeRole(id: string, role: Role) {
    persist(members.map((m) => m.id === id ? { ...m, role } : m));
    showToast("Role updated", true);
  }

  function removeMember(id: string) {
    if (id === "owner") { showToast("You cannot remove yourself", false); return; }
    persist(members.filter((m) => m.id !== id));
    showToast("Member removed", true);
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/connect?inviteToken=demo_${Date.now()}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1800);
  }

  const roleInfo = (r: Role) => ROLES.find((ro) => ro.value === r)!;

  return (
    <>
      <PageHeader title="Team & Settings" />
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg",
          toast.ok ? "bg-green-600" : "bg-red-600"
        )}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
      <PageContent>
      <div className="flex justify-end">
        <Button className="gap-2 shrink-0" onClick={() => setShowInvite(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isOpen = selectedRoleInfo === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setSelectedRoleInfo(isOpen ? null : role.value)}
              className={cn(
                "text-left rounded-xl border bg-card p-4 transition-all hover:border-primary/30",
                isOpen && "border-primary/40 ring-2 ring-primary/15"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={cn("h-4 w-4", role.color)} />
                <span className="font-semibold text-sm">{role.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{role.description}</p>
              {isOpen && (
                <ul className="mt-3 space-y-1.5">
                  {ROLE_PERMISSIONS[role.value].map((perm) => (
                    <li key={perm} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      {perm}
                    </li>
                  ))}
                  {(["admin", "editor", "viewer"] as Role[])
                    .filter((r) => !ROLE_PERMISSIONS[role.value].some(
                      (p) => ROLE_PERMISSIONS[r].includes(p) && r === role.value
                    ))
                    .flatMap((r) =>
                      ROLE_PERMISSIONS[r].filter((p) => !ROLE_PERMISSIONS[role.value].includes(p))
                    )
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((perm) => (
                      <li key={perm} className="flex items-center gap-1.5 text-xs opacity-40">
                        <X className="h-3 w-3 text-muted-foreground shrink-0" />
                        {perm}
                      </li>
                    ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Invite a team member</p>
            <button onClick={() => setShowInvite(false)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                placeholder="colleague@company.com"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              className="gap-2"
              onClick={inviteMember}
              disabled={inviting || !inviteEmail.trim()}
            >
              <Mail className="h-4 w-4" />
              {inviting ? "Sending invite…" : "Send Invite"}
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedInvite ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              Copy invite link
            </button>
          </div>
        </div>
      )}

      {/* Team table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-3.5 bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Team Members ({members.length})
          </p>
        </div>
        <div className="divide-y">
          {members.map((member) => {
            const role = roleInfo(member.role);
            const RoleIcon = role.icon;
            const isOwner = member.id === "owner";

            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name ?? member.email}
                    width={36}
                    height={36}
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(member.name?.[0] ?? member.email[0]).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {member.name ?? member.email}
                    </p>
                    {isOwner && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                        You
                      </Badge>
                    )}
                    {member.status === "pending" && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>
                  {member.name && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>

                {/* Role selector */}
                <div className="shrink-0 flex items-center gap-2">
                  <RoleIcon className={cn("h-3.5 w-3.5 hidden sm:block", role.color)} />
                  {isOwner ? (
                    <span className={cn("text-xs font-medium", role.color)}>{role.label}</span>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value as Role)}
                      className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Delete */}
                {!isOwner && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border bg-muted/20 p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong className="text-foreground">Agency tip:</strong> Invite clients as <strong className="text-foreground">Viewers</strong> so they can review dashboards and reports without modifying settings or seeing your other clients&apos; data.
          Use <strong className="text-foreground">Editor</strong> for junior analysts who need to connect sources.
        </span>
      </div>
      </PageContent>
    </>
  );
}
