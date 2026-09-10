"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import { SearchBar } from "./SearchBar";
import { SortableTh } from "./SortableTh";
import { Pagination } from "./Pagination";
import { useTableControls } from "./useTableControls";
import { roleMeta } from "@/lib/userRoles";
import FieldSelect, { type FieldSelectOption } from "./FieldSelect";

export interface UserListItem {
  id: number;
  email: string;
  name: string;
  role: string;
  roleName: string;
  createdAt: string;
}

interface UserManagerProps {
  initialUsers: UserListItem[];
  roles: string[];
  currentUserId: number;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "",
};

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function roleOptions(roles: string[]): FieldSelectOption[] {
  return roles.map((r) => ({
    value: r,
    label: roleMeta(r).label,
    badge: (
      <span
        className={`inline-flex items-center gap-1.5 ${
          roleMeta(r).text
        } ${roleMeta(r).darkText}`}
      >
        <span className={`w-2 h-2 rounded-full ${roleMeta(r).swatch}`} aria-hidden />
      </span>
    ),
  }));
}

export default function UserManager({
  initialUsers,
  roles,
  currentUserId,
}: UserManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addPasswordShow, setAddPasswordShow] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetShow, setResetShow] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetCopy, setResetCopy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const ctrl = useTableControls<UserListItem>({
    searchKeys: [(u) => u.name, (u) => u.email, (u) => u.roleName],
  });
  const { total, totalPages, page, pageItems } = ctrl.process(
    users,
    (key, u) => {
      switch (key) {
        case "name":
          return u.name;
        case "email":
          return u.email;
        case "role":
          return u.roleName;
        default:
          return "";
      }
    }
  );

  const handleAdd = async () => {
    if (
      !addForm.name.trim() ||
      !addForm.email.trim() ||
      !addForm.password ||
      !addForm.role
    ) {
      toast.error("Tên, email, mật khẩu và vai trò là bắt buộc");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tạo người dùng");
        return;
      }
      setAddForm(emptyForm);
      setAddPasswordShow(false);
      await refreshAsync((prev) => [
        ...prev,
        {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          roleName: data.role,
          createdAt: data.createdAt,
        },
      ]);
      toast.success("Đã tạo người dùng");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (user: UserListItem) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Tên và email là bắt buộc");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể cập nhật người dùng");
        return;
      }
      setEditingId(null);
      await refreshAsync((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                email: data.email,
                name: data.name,
                role: data.role,
                roleName: data.role,
              }
            : u
        )
      );
      toast.success("Đã cập nhật người dùng");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/users/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không thể xóa người dùng");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    await refreshAsync((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    toast.success("Đã xóa người dùng");
  };

  const openReset = (user: UserListItem) => {
    setResetTarget(user);
    setResetPassword("");
    setResetShow(false);
    setResetDone(false);
    setResetCopy(false);
  };

  const generatePassword = () => {
    const chars =
      "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
    let out = "";
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    for (const n of buf) out += chars[n % chars.length];
    setResetPassword(out);
    setResetDone(false);
  };

  const copyResetPassword = async () => {
    if (!resetPassword) return;
    try {
      await navigator.clipboard.writeText(resetPassword);
      setResetCopy(true);
      setTimeout(() => setResetCopy(false), 1500);
    } catch {
      toast.error("Không thể sao chép, hãy copy thủ công");
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (resetPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể đặt lại mật khẩu");
        return;
      }
      setResetDone(true);
      toast.success(`Đã đặt lại mật khẩu cho ${resetTarget.name}`);
    } finally {
      setResetting(false);
    }
  };

  const refreshAsync = async (
    updater: (data: UserListItem[]) => UserListItem[]
  ) => {
    setUsers(updater);
    router.refresh();
  };

  const unlockReadonly = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.readOnly = false;
  };

  return (
    <div className="xl:grid xl:grid-cols-[380px_1fr] xl:gap-6 xl:items-start">
      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0 mb-6 xl:mb-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Thêm người dùng mới
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Minh Editor"
              autoComplete="off"
              readOnly
              onFocus={unlockReadonly}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="VD: minh@goclaptrinh.io.vn"
              autoComplete="off"
              readOnly
              onFocus={unlockReadonly}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mật khẩu{" "}
              <span className="text-gray-400 dark:text-gray-500">
                (tối thiểu 6 ký tự)
              </span>
            </label>
            <div className="relative">
              <input
                type={addPasswordShow ? "text" : "password"}
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
                readOnly
                onFocus={unlockReadonly}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setAddPasswordShow((s) => !s)}
                title={addPasswordShow ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {addPasswordShow ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Vai trò
            </label>
            <FieldSelect
              value={addForm.role}
              onChange={(v) => setAddForm((f) => ({ ...f, role: v }))}
              options={roleOptions(roles)}
              placeholder="Chọn vai trò..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Đang thêm..." : "+ Thêm người dùng"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 min-w-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <SearchBar
            value={ctrl.search}
            onChange={ctrl.setSearchAndReset}
            placeholder="Tìm theo tên, email, vai trò..."
          />
        </div>
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chưa có người dùng nào.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Hãy thêm người dùng đầu tiên ở bên trái.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100dvh-23rem)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <SortableTh label="Người dùng" sortKey="name" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                    <SortableTh label="Email" sortKey="email" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                    <SortableTh label="Vai trò" sortKey="role" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-4 py-3.5 text-right" aria-label="Thao tác" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {pageItems.map((user) => {
                    const isEditing = editingId === user.id;
                    const meta = roleMeta(user.role);
                    const isSelf = user.id === currentUserId;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <div className="space-y-3 max-w-md">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Tên hiển thị"
                                className={inputClass}
                              />
                              <input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                                placeholder="Để trống nếu không đổi mật khẩu"
                                autoComplete="new-password"
                                readOnly
                                onFocus={unlockReadonly}
                                className={inputClass}
                              />
                            </div>
                          ) : (
                            <span className="flex items-center gap-3">
                              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {user.name}
                                  {isSelf && (
                                    <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500 align-middle">(bạn)</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(user.createdAt)}
                                </span>
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.email}
                              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                              autoComplete="off"
                              readOnly
                              onFocus={unlockReadonly}
                              className={`${inputClass} max-w-md`}
                            />
                          ) : (
                            <span className="text-sm text-gray-600 dark:text-gray-400 break-all">
                              {user.email}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <FieldSelect
                              value={editForm.role}
                              onChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
                              options={roleOptions(roles)}
                              className="min-w-40 max-w-56"
                            />
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md ${meta.bg} ${meta.text} ${meta.darkBg} ${meta.darkText}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.swatch}`} aria-hidden />
                              {meta.label}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {!isEditing && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(user.createdAt)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="text-sm text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                              >
                                {saving ? "..." : "Lưu"}
                              </button>
                              <button
                                onClick={() => { setEditingId(null); }}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <RowActionsMenu
                                actions={[
                                  {
                                    label: "Sửa",
                                    disabled: isSelf,
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                      </svg>
                                    ),
                                    onClick: () => startEdit(user),
                                  },
                                  {
                                    label: "Đặt lại mật khẩu",
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                      </svg>
                                    ),
                                    onClick: () => openReset(user),
                                  },
                                  {
                                    label: "Xóa",
                                    variant: "danger",
                                    disabled: isSelf,
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                      </svg>
                                    ),
                                    onClick: () => setDeleteTarget(user),
                                  },
                                ]}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Không tìm thấy người dùng nào phù hợp.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={ctrl.pageSize}
              onPageChange={ctrl.setPage}
              onPageSizeChange={ctrl.setPageSize}
            />
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Xóa người dùng"
          message={`Bạn có chắc muốn xóa người dùng "${deleteTarget.name}" (${deleteTarget.email}) không? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {resetTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex w-full max-w-md flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="shrink-0 flex flex-col items-center gap-3 px-6 pt-6 text-center">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  resetDone
                    ? "bg-green-100 dark:bg-green-500/15"
                    : "bg-blue-100 dark:bg-blue-500/15"
                }`}
              >
                {resetDone ? (
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </span>
              <h3
                id="reset-password-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {resetDone ? "Đã đặt lại mật khẩu" : "Đặt lại mật khẩu"}
              </h3>
            </div>

            {resetDone ? (
              <div className="overflow-y-auto px-6 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
                  Mật khẩu mới cho{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {resetTarget.name}
                  </strong>{" "}
                  ({resetTarget.email}):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 text-base font-mono font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl break-all select-all">
                    {resetPassword}
                  </code>
                  <button
                    type="button"
                    onClick={copyResetPassword}
                    title="Sao chép"
                    className="shrink-0 h-11 px-3.5 inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {resetCopy ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Hãy chuyển mật khẩu này cho người dùng. Sau khi đóng cửa sổ
                  này, mật khẩu sẽ không được hiển thị lại.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto px-6 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
                  Nhập mật khẩu mới cho{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {resetTarget.name}
                  </strong>{" "}
                  ({resetTarget.email}) hoặc để hệ thống tạo tự động.
                </p>
                <div className="relative">
                  <input
                    type={resetShow ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    autoFocus
                    className="w-full px-4 pr-24 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setResetShow((s) => !s)}
                      title={resetShow ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {resetShow ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      title="Tạo mật khẩu ngẫu nhiên"
                      className="px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      Tạo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="shrink-0 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
              {resetDone ? (
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Xong
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    disabled={resetting}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {resetting ? "Đang đặt lại..." : "Đặt lại"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}