"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { updateUser, deleteUser } from "@/lib/actions/adminActions";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
  createdAt: Date;
}

export function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editName, setEditName] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const handleEditOpen = (user: User) => {
    setEditUser(user);
    setEditName(user.name || "");
    setEditIsAdmin(user.isAdmin);
  };

  const handleEditSave = () => {
    if (!editUser) return;
    startTransition(async () => {
      const result = await updateUser(editUser.id, {
        name: editName.trim() || null,
        isAdmin: editIsAdmin,
      });
      if (result.success) {
        toast.success("User updated");
        router.refresh();
        setEditUser(null);
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteUserId) return;
    startTransition(async () => {
      const result = await deleteUser(deleteUserId);
      if (result.success) {
        toast.success("User deleted");
        router.refresh();
        setDeleteUserId(null);
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  };

  return (
    <>
      <div className="rounded-md border border-[#1e1e2e] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#1e1e2e]">
              <TableHead>#</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow key={user.id} className="border-b border-[#1e1e2e]">
                <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={user.name || user.email} email={user.email} image={user.image} size="sm" />
                    <span>{user.name || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.isAdmin ? "Yes" : "—"}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditOpen(user)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteUserId(user.id)} className="text-red-500">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isAdmin" checked={editIsAdmin} onCheckedChange={(v) => setEditIsAdmin(!!v)} />
              <label htmlFor="isAdmin" className="text-sm font-medium">Admin</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action is permanent. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}