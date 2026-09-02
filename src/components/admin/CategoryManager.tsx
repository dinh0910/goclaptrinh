"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/categories";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import { SearchBar } from "./SearchBar";
import { SortableTh } from "./SortableTh";
import { Pagination } from "./Pagination";
import { useTableControls } from "./useTableControls";

interface CategoryManagerProps {
  initialCategories: CategoryWithCount[];
}

const emptyForm = { name: "", slug: "", description: "" };

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

export default function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ctrl = useTableControls<CategoryWithCount>({
    searchKeys: [(c) => c.name, (c) => c.slug, (c) => c.description],
  });
  const { total, totalPages, page, pageItems } = ctrl.process(
    categories,
    (key, c) => {
      switch (key) {
        case "name":
          return c.name;
        case "slug":
          return c.slug;
        case "count":
          return c.count;
        default:
          return "";
      }
    }
  );

  const refresh = async (updater?: (data: CategoryWithCount[]) => CategoryWithCount[]) => {
    // optimistic update when provided, then re-sync from server
    if (updater) setCategories(updater);
    router.refresh();
  };

  const handleAddNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAddForm((f) => ({
      ...f,
      name,
      slug:
        f.slug === "" || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
  };

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setEditForm((f) => ({
      ...f,
      name,
      slug:
        f.slug === "" || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tạo danh mục");
        return;
      }
      setAddForm(emptyForm);
      await refresh((prev) => [...prev, data as CategoryWithCount]);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: CategoryWithCount) => {
    setEditingSlug(cat.slug);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSlug || !editForm.name.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(editingSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể cập nhật danh mục");
        return;
      }
      setEditingSlug(null);
      await refresh((prev) =>
        prev.map((c) =>
          c.slug === editingSlug ? (data as CategoryWithCount) : c
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(
      `/api/categories/${encodeURIComponent(deleteTarget.slug)}`,
      {
        method: "DELETE",
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thể xóa danh mục");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    await refresh((prev) => prev.filter((c) => c.slug !== deleteTarget.slug));
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Thêm danh mục mới
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tên danh mục
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={handleAddNameChange}
                placeholder="VD: Next.js"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Slug{" "}
                <span className="text-gray-400 dark:text-gray-500">
                  (tự sinh theo tên)
                </span>
              </label>
              <input
                type="text"
                value={addForm.slug}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="VD: nextjs"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mô tả
            </label>
            <textarea
              value={addForm.description}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mô tả ngắn về danh mục"
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Đang thêm..." : "+ Thêm danh mục"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <SearchBar
            value={ctrl.search}
            onChange={ctrl.setSearchAndReset}
            placeholder="Tìm theo tên, slug, mô tả..."
          />
        </div>
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Chưa có danh mục nào. Hãy thêm danh mục đầu tiên.
          </p>
        ) : (
          <>
          <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <SortableTh label="Tên" sortKey="name" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <SortableTh label="Slug" sortKey="slug" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
                <SortableTh label="Bài viết" sortKey="count" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <th className="px-4 py-3.5 text-right" aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {pageItems.map((cat) => {
                const isEditing = editingSlug === cat.slug;
                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={handleEditNameChange}
                          className={inputClass}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {cat.name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.slug}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, slug: e.target.value }))
                          }
                          className={inputClass}
                        />
                      ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {cat.slug}
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                          className={inputClass}
                        />
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {cat.description}
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {cat.count}
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
                            onClick={() => {
                              setEditingSlug(null);
                              setError(null);
                            }}
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
                                onClick: () => startEdit(cat),
                              },
                              {
                                label: "Xóa",
                                variant: "danger",
                                icon: (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  </svg>
                                ),
                                onClick: () => setDeleteTarget(cat),
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
                  <td colSpan={5} className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy danh mục nào phù hợp.
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
          title="Xóa danh mục"
          message={`Bạn có chắc muốn xóa danh mục "${deleteTarget.name}" không? Hành động này không thể hoàn tác.`}
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