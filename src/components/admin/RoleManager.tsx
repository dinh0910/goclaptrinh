"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import { SearchBar } from "./SearchBar";
import { Pagination } from "./Pagination";
import { useTableControls } from "./useTableControls";
import { roleMeta, PERMISSION_OPTIONS } from "@/lib/userRoles";

export interface RoleListItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  permissions: string[];
  count: number;
}

interface RoleManagerProps {
  initialRoles: RoleListItem[];
}

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  permissions: [] as string[],
};

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

const permissionLabel = (key: string) =>
  PERMISSION_OPTIONS.find((p) => p.key === key)?.label || key;

export default function RoleManager({ initialRoles }: RoleManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ctrl = useTableControls<RoleListItem>({
    searchKeys: [() => ""],
  });
  const { total, totalPages, page, pageItems } = ctrl.process(roles, (_k, r) => r.name);

  const togglePermission = (
    form: typeof emptyForm,
    setter: (f: typeof emptyForm) => void,
    key: string
  ) => {
    const next = form.permissions.includes(key)
      ? form.permissions.filter((p) => p !== key)
      : [...form.permissions, key];
    setter({ ...form, permissions: next });
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.slug.trim()) {
      setError("Tên và slug vai trò là bắt buộc");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tạo vai trò");
        return;
      }
      setAddForm(emptyForm);
      setRoles((prev) => [...prev, data]);
      router.refresh();
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (role: RoleListItem) => {
    setEditingId(role.id);
    setEditForm({
      slug: role.slug,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim() || !editForm.slug.trim()) {
      setError("Tên và slug vai trò là bắt buộc");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể cập nhật vai trò");
        return;
      }
      setEditingId(null);
      setRoles((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...data } : r))
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/roles/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thể xóa vai trò");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const renderPermissionsForm = (
    form: typeof emptyForm,
    setter: (f: typeof emptyForm) => void
  ) => (
    <div className="flex flex-wrap gap-2">
      {PERMISSION_OPTIONS.map((p) => {
        const active = form.permissions.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => togglePermission(form, setter, p.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              active
                ? "bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300"
                : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/40"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="xl:grid xl:grid-cols-[380px_1fr] xl:gap-6 xl:items-start">
      {error && (
        <div className="xl:col-span-2 px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0 mb-6 xl:mb-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Thêm vai trò mới
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tên vai trò
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Người đăng bài"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Slug{" "}
              <span className="text-gray-400 dark:text-gray-500">
                (định danh, VD: author2)
              </span>
            </label>
            <input
              type="text"
              value={addForm.slug}
              onChange={(e) => setAddForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="VD: author2"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mô tả
            </label>
            <textarea
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về vai trò"
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Quyền
            </label>
            {renderPermissionsForm(addForm, setAddForm)}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Đang thêm..." : "+ Thêm vai trò"}
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
            placeholder="Tìm theo tên vai trò..."
          />
        </div>
        {roles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 7h7M8.5 12h4M8.5 17h7" />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chưa có vai trò nào.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100dvh-23rem)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vai trò</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quyền</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người dùng</th>
                    <th className="px-4 py-3.5 text-right" aria-label="Thao tác" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {pageItems.map((role) => {
                    const isEditing = editingId === role.id;
                    const meta = roleMeta(role.slug);
                    return (
                      <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <div className="space-y-3 max-w-sm">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Tên vai trò"
                                className={inputClass}
                              />
                              <input
                                type="text"
                                value={editForm.slug}
                                onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                                placeholder="Slug"
                                className={inputClass}
                              />
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Mô tả"
                                rows={2}
                                className={inputClass}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${meta.swatch}`} aria-hidden />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {role.name}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                  {role.slug}
                                </span>
                              </span>
                              {role.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {role.description}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            renderPermissionsForm(editForm, setEditForm)
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {role.permissions.length === 0 ? (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Chưa có quyền
                                </span>
                              ) : (
                                role.permissions.map((p) => (
                                  <span key={p} className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md">
                                    {permissionLabel(p)}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {role.count}
                          </span>
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
                                onClick={() => { setEditingId(null); setError(null); }}
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
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                      </svg>
                                    ),
                                    onClick: () => startEdit(role),
                                  },
                                  {
                                    label: "Xóa",
                                    variant: "danger",
                                    disabled: role.slug === "admin" || role.count > 0,
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                      </svg>
                                    ),
                                    onClick: () => setDeleteTarget(role),
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
                      <td colSpan={4} className="p-8 text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Không tìm thấy vai trò nào phù hợp.
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
          title="Xóa vai trò"
          message={`Bạn có chắc muốn xóa vai trò "${deleteTarget.name}" không?`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}