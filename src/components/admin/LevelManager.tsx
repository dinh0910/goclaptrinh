"use client";

import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import type { CourseLevel } from "@/lib/types";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "./RowActionsMenu";
import DataTable from "./DataTable";
import FieldNumber from "./FieldNumber";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import type { FieldErrors } from "@/lib/validation";
import { CATEGORY_ICON_OPTIONS } from "@/lib/constants";
import { CATEGORY_COLOR_OPTIONS, categoryColor } from "@/lib/categoryColors";

interface LevelManagerProps {
  initialLevels: CourseLevel[];
  levelCoursesCount: Record<string, number>;
}

const emptyForm = {
  key: "",
  label: "",
  description: "",
  icon: "🌱",
  color: "blue",
  sortOrder: 1,
};

const fieldClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {CATEGORY_COLOR_OPTIONS.map((c) => (
        <button
          key={c.key}
          type="button"
          title={`${c.label} (${c.key})`}
          onClick={() => onChange(c.key)}
          className={`w-7 h-7 rounded-lg ${c.swatch} flex items-center justify-center ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all ${
            value === c.key ? "ring-2 ring-gray-900 dark:ring-white scale-110" : "hover:scale-105"
          }`}
        >
          {value === c.key && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 drop-shadow" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const selected = CATEGORY_ICON_OPTIONS.find((o) => o.icon === value) || null;

  const results = q
    ? CATEGORY_ICON_OPTIONS.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.keywords.some((k) => k.toLowerCase().includes(q))
      )
    : CATEGORY_ICON_OPTIONS;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg">
          {value}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {selected ? selected.label : "Chọn icon bên dưới"}
        </span>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm icon... (vd: learning, beginner)"
        className="w-full px-3 py-1.5 mb-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
      />
      <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto pr-0.5">
        {results.map((o) => (
          <button
            key={o.icon}
            type="button"
            onClick={() => onChange(o.icon)}
            title={`${o.label} ${o.icon}`}
            className={`flex items-center justify-center aspect-square rounded-lg transition-colors ${
              value === o.icon
                ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-lg leading-none">{o.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LevelManager({ initialLevels, levelCoursesCount }: LevelManagerProps) {
  const [levels, setLevels] = useState(initialLevels);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addErrors, setAddErrors] = useState<FieldErrors>({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CourseLevel | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseLevel | null>(null);

  const syncLevels = (updater: (prev: CourseLevel[]) => CourseLevel[]) => {
    setLevels(updater);
  };

  const handleAddLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    setAddForm((f) => ({
      ...f,
      label,
      key: f.key === "" || f.key === slugify(f.label) ? slugify(label) : f.key,
    }));
    setAddErrors((er) => ({ ...er, label: "", key: "" }));
  };

  const handleEditLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    setEditForm((f) => ({
      ...f,
      label,
      key: f.key === "" || f.key === slugify(f.label) ? slugify(label) : f.key,
    }));
    setEditErrors((er) => ({ ...er, label: "", key: "" }));
  };

  const validate = (form: typeof emptyForm): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.label.trim()) errors.label = "Tên cấp độ là bắt buộc";
    if (!form.key.trim()) {
      errors.key = "Mã cấp độ là bắt buộc";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.key.trim())) {
      errors.key = "Mã chỉ gồm chữ thường, số và dấu gạch ngang";
    }
    if (typeof form.sortOrder !== "number" || form.sortOrder < 1) {
      errors.sortOrder = "Thứ tự phải là số nguyên dương";
    }
    return errors;
  };

  const nextSortOrder = () =>
    Math.max(1, ...levels.map((l) => l.sortOrder)) + 1;

  const handleOpenAdd = () => {
    setAddForm({ ...emptyForm, sortOrder: nextSortOrder() });
    setAddErrors({});
    setShowAdd(true);
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
      const res = await fetch("/api/admin/course-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, key: addForm.key.trim().toLowerCase(), sortOrder: Math.floor(addForm.sortOrder) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddErrors({ key: data.error });
        toast.error(data.error || "Không thể tạo cấp độ");
        return;
      }
      syncLevels((prev) => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      setAddForm(emptyForm);
      setShowAdd(false);
      toast.success("Đã tạo cấp độ mới");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    const errors = validate(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setEditErrors({});
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/course-levels/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, key: editForm.key.trim().toLowerCase(), sortOrder: Math.floor(editForm.sortOrder) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditErrors({ key: data.error });
        toast.error(data.error || "Không thể cập nhật cấp độ");
        return;
      }
      syncLevels((prev) => prev.map((l) => (l.id === editing.id ? data : l)).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      setEditing(null);
      toast.success("Đã cập nhật cấp độ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/course-levels/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa cấp độ");
        return;
      }
      syncLevels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Đã xóa cấp độ");
    } finally {
      setDeleting(false);
    }
  };

  const input = (cls?: string) => `${fieldClass} ${cls || ""}`;

  return (
    <>
      <DataTable<CourseLevel>
        columns={[
          { label: "Cấp độ", sortKey: "label" },
          { label: "Mã", sortKey: "key" },
          { label: "Mô tả", sortKey: "description" },
          { label: "Thứ tự", sortKey: "sortOrder" },
          { label: "Khóa học", sortKey: "count" },
          { label: "", align: "right" },
        ]}
        rows={levels}
        rowKey={(l) => l.id}
        getSortValue={(key, l) => {
          switch (key) {
            case "label": return l.label;
            case "key": return l.key;
            case "description": return l.description;
            case "sortOrder": return l.sortOrder;
            case "count": return levelCoursesCount[l.key] ?? 0;
            default: return "";
          }
        }}
        searchKeys={[(l) => l.label, (l) => l.key, (l) => l.description]}
        searchPlaceholder="Tìm theo tên, mã..."
        toolbar={
          <button
            onClick={handleOpenAdd}
            className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Thêm cấp độ
          </button>
        }
        emptyIcon={<span className="text-4xl">🌱</span>}
        emptyText="Chưa có cấp độ nào."
        renderRow={(level) => {
          const color = categoryColor(level.color);
          const count = levelCoursesCount[level.key] ?? 0;
          return (
            <tr key={level.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-9 h-9 shrink-0 rounded-lg ${color.bg} ${color.darkBg} flex items-center justify-center text-lg`}>
                    {level.icon || "🌱"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{level.label}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 mt-0.5 text-[10px] font-medium rounded ${color.bg} ${color.text}`}>
                      {level.color}
                    </span>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{level.key}</span>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[240px]">
                  {level.description || "—"}
                </span>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{level.sortOrder}</span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {count}
                </span>
              </td>
              <td className="p-4">
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
                        onClick: () => {
                          setEditing(level);
                          setEditForm({
                            key: level.key,
                            label: level.label,
                            description: level.description,
                            icon: level.icon,
                            color: level.color,
                            sortOrder: level.sortOrder,
                          });
                          setEditErrors({});
                        },
                      },
                      {
                        label: "Xóa",
                        variant: "danger",
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </svg>
                        ),
                        onClick: () => setDeleteTarget(level),
                      },
                    ]}
                  />
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !adding && setShowAdd(false)}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thêm cấp độ mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tên cấp độ *</label>
                <input
                  type="text"
                  value={addForm.label}
                  onChange={handleAddLabelChange}
                  className={input(errorInputClass(addErrors, "label"))}
                  placeholder="VD: Chuyên gia"
                  autoFocus
                />
                <FieldError message={addErrors.label} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mã (key) *</label>
                <input
                  type="text"
                  value={addForm.key}
                  onChange={(e) => {
                    setAddForm((f) => ({ ...f, key: e.target.value }));
                    setAddErrors((er) => ({ ...er, key: "" }));
                  }}
                  className={input(errorInputClass(addErrors, "key"))}
                  placeholder="VD: expert"
                />
                <FieldError message={addErrors.key} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={input()}
                  placeholder="Mô tả ngắn về cấp độ này..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Icon *</label>
                <IconPicker value={addForm.icon} onChange={(icon) => setAddForm((f) => ({ ...f, icon }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Màu sắc</label>
                <ColorPicker value={addForm.color} onChange={(c) => setAddForm((f) => ({ ...f, color: c }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Thứ tự sắp xếp</label>
                <FieldNumber
                  value={addForm.sortOrder}
                  onChange={(v) => {
                    setAddForm((f) => ({ ...f, sortOrder: v }));
                    setAddErrors((er) => ({ ...er, sortOrder: "" }));
                  }}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <FieldError message={addErrors.sortOrder} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {adding ? "Đang lưu..." : "Tạo cấp độ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Chỉnh sửa cấp độ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tên cấp độ *</label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={handleEditLabelChange}
                  className={input(errorInputClass(editErrors, "label"))}
                  autoFocus
                />
                <FieldError message={editErrors.label} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mã (key) *</label>
                <input
                  type="text"
                  value={editForm.key}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, key: e.target.value }));
                    setEditErrors((er) => ({ ...er, key: "" }));
                  }}
                  className={input(errorInputClass(editErrors, "key"))}
                />
                <FieldError message={editErrors.key} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={input()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Icon *</label>
                <IconPicker value={editForm.icon} onChange={(icon) => setEditForm((f) => ({ ...f, icon }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Màu sắc</label>
                <ColorPicker value={editForm.color} onChange={(c) => setEditForm((f) => ({ ...f, color: c }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Thứ tự sắp xếp</label>
                <FieldNumber
                  value={editForm.sortOrder}
                  onChange={(v) => {
                    setEditForm((f) => ({ ...f, sortOrder: v }));
                    setEditErrors((er) => ({ ...er, sortOrder: "" }));
                  }}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <FieldError message={editErrors.sortOrder} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Xóa cấp độ"
          message={`Bạn có chắc muốn xóa cấp độ "${deleteTarget.label}" không? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}