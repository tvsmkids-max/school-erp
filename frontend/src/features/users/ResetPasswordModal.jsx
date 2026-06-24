import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetUserPasswordApi } from "../../api/users.api.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function ResetPasswordModal({ open, onClose, user }) {
  const [newPassword, setNewPassword] = useState("User@123");

  const mutation = useMutation({
    mutationFn: () => resetUserPasswordApi({ id: user._id, newPassword }),
    onSuccess: onClose,
  });

  return (
    <Modal open={open} onClose={onClose} title={`Reset Password - ${user?.fullName || "User"}`} maxWidth="max-w-md">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
            New Password
          </span>
          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>

        {mutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {mutation.error.message}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button className="bg-slate-600 hover:bg-slate-700" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
