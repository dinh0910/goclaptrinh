"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/categories";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import DataTable from "./DataTable";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import { TextArea } from "@/components/shared/TextArea";
import {
  fieldErrorsFrom,
  type FieldErrors,
} from "@/lib/validation";
import {
  CATEGORY_ICON_GROUPS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/constants";
import {
  CATEGORY_COLOR_OPTIONS,
  DEFAULT_CATEGORY_COLOR,
  categoryColor,
} from "@/lib/categoryColors";

interface CategoryManagerProps {
  initialCategories: CategoryWithCount[];
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  icon: DEFAULT_CATEGORY_ICON,
  color: DEFAULT_CATEGORY_COLOR,
};

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const selected =
    CATEGORY_ICON_OPTIONS.find((o) => o.icon === value) || null;

  const searchResults = q
    ? CATEGORY_ICON_OPTIONS.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.keywords.some((k) => k.toLowerCase().includes(q))
      )
    : null;

  const renderIcon = (o: { icon: string; label: string }) => (
    <button
      key={o.icon}
      type="button"
      onClick={() => onChange(o.icon)}
      title={`${o.label} ${o.icon}`}
      className={`flex flex-col items-center gap-0.5 px-1 pt-1.5 pb-1 rounded-lg transition-colors min-w-0 ${
        value === o.icon
          ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <span className="text-lg leading-none">{o.icon}</span>
      <span className="w-full text-[9px] leading-tight text-gray-600 dark:text-gray-400 truncate text-center">
        {o.label}
      </span>
    </button>
  );

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        Icon{" "}
        <span className="text-gray-400 dark:text-gray-500">
          (hiển thị trên site)
        </span>
      </label>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg">
          {value || DEFAULT_CATEGORY_ICON}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {selected ? selected.label : "Chọn icon bên dưới"}
        </span>
      </div>
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm icon... (vd: python, react)"
          className="w-full px-3 py-1.5 pr-8 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            title="Xóa tìm kiếm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {searchResults !== null ? (
        searchResults.length > 0 ? (
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-6 gap-1">
              {searchResults.map(renderIcon)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center">
            Không tìm thấy icon nào phù hợp.
          </p>
        )
      ) : (
        <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
          {CATEGORY_ICON_GROUPS.map((group) => (
            <div key={group.group}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                {group.group}
              </h4>
              <div className="grid grid-cols-6 gap-1">
                {group.icons.map(renderIcon)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        Màu sắc{" "}
        <span className="text-gray-400 dark:text-gray-500">
          (nền, gradient trên site)
        </span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLOR_OPTIONS.map((c) => {
          const active = value === c.key;
          return (
            <button
              key={c.key}
              type="button"
              title={`${c.label} (${c.key})`}
              onClick={() => onChange(c.key)}
              className={`w-7 h-7 rounded-lg ${c.swatch} flex items-center justify-center ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all ${
                active ? "ring-2 ring-gray-900 dark:ring-white scale-110" : ""
              } hover:scale-105`}
            >
              {active && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 drop-shadow" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addErrors, setAddErrors] = useState<FieldErrors>({});
  const [adding, setAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);

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
    setAddErrors((er) => ({ ...er, name: "", slug: "" }));
  };

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setEditForm((f) => ({
      ...f,
      name,
      slug:
        f.slug === "" || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
    setEditErrors((er) => ({ ...er, name: "", slug: "" }));
  };

  const handleAdd = async () => {
    const errors: FieldErrors = {};
    if (!addForm.name.trim()) errors.name = "Tên danh mục là bắt buộc";
    if (!addForm.slug.trim()) {
      errors.slug = "Slug là bắt buộc";
    } else if (!/^[a-z0-9-]+$/.test(addForm.slug.trim())) {
      errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setAddErrors({});
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
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
      await refresh((prev) => [...prev, { ...data, count: 0 } as CategoryWithCount]);
      toast.success("Đã tạo danh mục");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: CategoryWithCount) => {
    setEditingSlug(cat.slug);
    setEditErrors({});
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon || DEFAULT_CATEGORY_ICON,
      color: cat.color || DEFAULT_CATEGORY_COLOR,
    });
  };

  const handleSaveEdit = async () => {
    const errors: FieldErrors = {};
    if (!editForm.name.trim()) errors.name = "Tên danh mục là bắt buộc";
    if (!editForm.slug.trim()) {
      errors.slug = "Slug là bắt buộc";
    } else if (!/^[a-z0-9-]+$/.test(editForm.slug.trim())) {
      errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    if (!editingSlug) return;
    setEditErrors({});
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(editingSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const { errors: serverErrors, message } = fieldErrorsFrom(data);
        setEditErrors(serverErrors);
        toast.error(message);
        return;
      }
      setEditingSlug(null);
      await refresh((prev) =>
        prev.map((c) =>
          c.slug === editingSlug
            ? ({ ...data, count: c.count } as CategoryWithCount)
            : c
        )
      );
      toast.success("Đã cập nhật danh mục");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(
      `/api/categories/${encodeURIComponent(deleteTarget.slug)}`,
      {
        method: "DELETE",
      }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không thể xóa danh mục");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    await refresh((prev) => prev.filter((c) => c.slug !== deleteTarget.slug));
    setDeleting(false);
    setDeleteTarget(null);
    toast.success("Đã xóa danh mục");
  };

  return (
    <div className="xl:grid xl:grid-cols-[400px_1fr] xl:gap-6 xl:items-start">
      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0 mb-6 xl:mb-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Thêm danh mục mới
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tên danh mục
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={handleAddNameChange}
              placeholder="VD: Next.js"
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
              placeholder="VD: nextjs"
              className={`${inputClass} ${errorInputClass(addErrors, "slug")}`}
            />
            <FieldError message={addErrors.slug} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mô tả
            </label>
            <TextArea
              value={addForm.description}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mô tả ngắn về danh mục"
              rows={3}
            />
          </div>
          <IconPicker
            value={addForm.icon}
            onChange={(icon) => setAddForm((f) => ({ ...f, icon }))}
          />
          <ColorPicker
            value={addForm.color}
            onChange={(color) => setAddForm((f) => ({ ...f, color }))}
          />
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
      <DataTable<CategoryWithCount>
        columns={[
          { label: "Tên", sortKey: "name" },
          { label: "Slug", sortKey: "slug" },
          { label: "Mô tả", sortKey: "description" },
          { label: "Bài viết", sortKey: "count" },
          { label: "", align: "right" },
        ]}
        rows={categories}
        rowKey={(c) => c.id}
        getSortValue={(key, c) => {
          switch (key) {
            case "name":
              return c.name;
            case "slug":
              return c.slug;
            case "description":
              return c.description;
            case "count":
              return c.count;
            default:
              return "";
          }
        }}
        searchKeys={[(c) => c.name, (c) => c.slug, (c) => c.description]}
        searchPlaceholder="Tìm theo tên, slug, mô tả..."
        emptyIcon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18M7 15h4" />
          </svg>
        }
        emptyText="Chưa có danh mục nào."
        emptyHint="Hãy thêm danh mục đầu tiên ở bên trái."
        renderRow={(cat) => {
          const isEditing = editingSlug === cat.slug;
          return (
            <tr
              key={cat.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td className="p-4 align-top">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={handleEditNameChange}
                        className={`${inputClass} ${errorInputClass(editErrors, "name")}`}
                      />
                      <FieldError message={editErrors.name} />
                    </div>
                    <IconPicker
                      value={editForm.icon}
                      onChange={(icon) =>
                        setEditForm((f) => ({ ...f, icon }))
                      }
                    />
                    <ColorPicker
                      value={editForm.color}
                      onChange={(color) =>
                        setEditForm((f) => ({ ...f, color }))
                      }
                    />
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${categoryColor(cat.color).swatch}`}
                      title={categoryColor(cat.color).label}
                    />
                    <span className="text-base w-6 flex justify-center shrink-0">
                      {cat.icon || DEFAULT_CATEGORY_ICON}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {cat.name}
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
                    {cat.slug}
                  </span>
                )}
              </td>
              <td className="p-4 align-top">
                {isEditing ? (
                  <TextArea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
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
        }}
      />

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