"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import type { SeriesWithCount } from "@/lib/series";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import { SearchBar } from "./SearchBar";
import { SortableTh } from "./SortableTh";
import { Pagination } from "./Pagination";
import { useTableControls } from "./useTableControls";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import { fieldErrorsFrom, type FieldErrors } from "@/lib/validation";

interface SeriesManagerProps {
  initialSeries: SeriesWithCount[];
}

const SERIES_ICON_OPTIONS = ["📚", "🎓", "🧪", "🚀", "⚙️", "🗺️", "🧩", "📖"];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  icon: "📚",
};

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

export default function SeriesManager({ initialSeries }: SeriesManagerProps) {
  const router = useRouter();
  const [series, setSeries] = useState(initialSeries);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addErrors, setAddErrors] = useState<FieldErrors>({});
  const [adding, setAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SeriesWithCount | null>(null);

  const ctrl = useTableControls<SeriesWithCount>({
    searchKeys: [(s) => s.name, (s) => s.slug, (s) => s.description],
  });
  const { total, totalPages, page, pageItems } = ctrl.process(series, (key, s) => {
    switch (key) {
      case "name":
        return s.name;
      case "slug":
        return s.slug;
      case "count":
        return s.count;
      default:
        return "";
    }
  });

  const refresh = async (
    updater?: (data: SeriesWithCount[]) => SeriesWithCount[]
  ) => {
    if (updater) setSeries(updater);
    router.refresh();
  };

  const handleAddNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAddForm((f) => ({
      ...f,
      name,
      slug: f.slug === "" || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
    setAddErrors((er) => ({ ...er, name: "", slug: "" }));
  };

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setEditForm((f) => ({
      ...f,
      name,
      slug: f.slug === "" || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
    setEditErrors((er) => ({ ...er, name: "", slug: "" }));
  };

  const validate = (form: typeof emptyForm): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = "Tên series là bắt buộc";
    if (!form.slug.trim()) {
      errors.slug = "Slug là bắt buộc";
    } else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    }
    return errors;
  };

  const handleAdd = async () => {
    const errors = validate(addForm);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setAddErrors({});
    setAdding(true);
    try {
      const res = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const { errors: serverErrors, message } = fieldErrorsFrom(data);
        setAddErrors(serverErrors);
        toast.error(message);
        return;
      }
      setAddForm(emptyForm);
      setAddErrors({});
      await refresh((prev) => [...prev, { ...data, count: 0 } as SeriesWithCount]);
      toast.success("Đã tạo series");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (s: SeriesWithCount) => {
    setEditingSlug(s.slug);
    setEditErrors({});
    setEditForm({
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon || "📚",
    });
  };

  const handleSaveEdit = async () => {
    const errors = validate(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    if (!editingSlug) return;
    setEditErrors({});
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/series/${encodeURIComponent(editingSlug)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const { errors: serverErrors, message } = fieldErrorsFrom(data);
        setEditErrors(serverErrors);
        toast.error(message);
        return;
      }
      setEditingSlug(null);
      await refresh((prev) =>
        prev.map((s) =>
          s.slug === editingSlug ? ({ ...data, count: s.count } as SeriesWithCount) : s
        )
      );
      toast.success("Đã cập nhật series");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(
      `/api/admin/series/${encodeURIComponent(deleteTarget.slug)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không thể xóa series");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    await refresh((prev) => prev.filter((s) => s.slug !== deleteTarget.slug));
    setDeleting(false);
    setDeleteTarget(null);
    toast.success("Đã xóa series");
  };

  return (
    <div className="xl:grid xl:grid-cols-[400px_1fr] xl:gap-6 xl:items-start">
      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0 mb-6 xl:mb-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Thêm series mới
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tên series
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={handleAddNameChange}
              placeholder="VD: Học Next.js từ đầu"
              className={`${inputClass} ${errorInputClass(addErrors, "name")}`}
            />
            <FieldError message={addErrors.name} />
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
              onChange={(e) => {
                setAddForm((f) => ({ ...f, slug: e.target.value }));
                setAddErrors((er) => ({ ...er, slug: "" }));
              }}
              placeholder="VD: hoc-nextjs"
              className={`${inputClass} ${errorInputClass(addErrors, "slug")}`}
            />
            <FieldError message={addErrors.slug} />
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
              placeholder="Mô tả ngắn về chuỗi bài"
              rows={3}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SERIES_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setAddForm((f) => ({ ...f, icon }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    addForm.icon === icon
                      ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Đang thêm..." : "+ Thêm series"}
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
            placeholder="Tìm theo tên, slug, mô tả..."
          />
        </div>
        {series.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl">📚</span>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chưa có series nào.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Hãy tạo series đầu tiên ở bên trái.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100dvh-23rem)] overflow-y-auto">
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
                  {pageItems.map((s) => {
                    const isEditing = editingSlug === s.slug;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={handleEditNameChange}
                                className={`${inputClass} ${errorInputClass(editErrors, "name")}`}
                              />
                              <FieldError message={editErrors.name} />
                              <div className="flex flex-wrap gap-1.5">
                                {SERIES_ICON_OPTIONS.map((icon) => (
                                  <button
                                    key={icon}
                                    type="button"
                                    onClick={() =>
                                      setEditForm((f) => ({ ...f, icon }))
                                    }
                                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                                      editForm.icon === icon
                                        ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
                                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="text-base w-6 flex justify-center shrink-0">
                                {s.icon || "📚"}
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {s.name}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <div>
                              <input
                                type="text"
                                value={editForm.slug}
                                onChange={(e) => {
                                  setEditForm((f) => ({ ...f, slug: e.target.value }));
                                  setEditErrors((er) => ({ ...er, slug: "" }));
                                }}
                                className={`${inputClass} ${errorInputClass(editErrors, "slug")}`}
                              />
                              <FieldError message={editErrors.slug} />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              {s.slug}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {isEditing ? (
                            <textarea
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, description: e.target.value }))
                              }
                              rows={2}
                              className={inputClass}
                            />
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {s.description}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {s.count}
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
                                onClick={() => setEditingSlug(null)}
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
                                    onClick: () => startEdit(s),
                                  },
                                  {
                                    label: "Xóa",
                                    variant: "danger",
                                    icon: (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                      </svg>
                                    ),
                                    onClick: () => setDeleteTarget(s),
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
                          Không tìm thấy series nào phù hợp.
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
          title="Xóa series"
          message={`Bạn có chắc muốn xóa series "${deleteTarget.name}" không? Hành động này không thể hoàn tác.`}
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