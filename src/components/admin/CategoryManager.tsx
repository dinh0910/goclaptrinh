"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/categories";

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
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (cat: CategoryWithCount) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    setError(null);
    const res = await fetch(`/api/categories/${encodeURIComponent(cat.slug)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thể xóa danh mục");
      return;
    }
    await refresh((prev) => prev.filter((c) => c.slug !== cat.slug));
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Chưa có danh mục nào. Hãy thêm danh mục đầu tiên.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bài viết</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {categories.map((cat) => {
                const isEditing = editingSlug === cat.slug;
                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => startEdit(cat)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}