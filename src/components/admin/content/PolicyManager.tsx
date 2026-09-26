"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import RichEditor from "@/components/admin/editor/RichEditor";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";
import {
  emptyPolicy,
  isValidPolicySlug,
  type PolicyDoc,
} from "@/lib/policy-config";

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

/** Bỏ dấu tiếng Việt rồi đưa về dạng slug để URL không bị rối. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    // \p{M} là dấu kết hợp do NFD sinh ra; xoá đi để còn lại chữ cái.
    .replace(/\p{M}/gu, "")
    // `đ` là một chữ riêng, không tách được qua NFD nên phải thay tay.
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    // Cắt ở giữa có thể để lại dấu gạch nối ở cuối, tạo slug không hợp lệ.
    .replace(/-+$/g, "");
}

function formatUpdated(iso: string): string {
  if (!iso) return "Chưa lưu lần nào";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Chưa lưu lần nào";
  return `Cập nhật ${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function PolicyManager() {
  const [policies, setPolicies] = useState<PolicyDoc[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Slug của bản nháp mới chưa nằm trong danh sách, dùng khoá riêng để chọn.
  const DRAFT_KEY = "__draft__";
  const selectedKey = selectedSlug ?? DRAFT_KEY;

  const selected = useMemo(
    () => policies.find((p) => p.slug === selectedKey),
    [policies, selectedKey]
  );

  useEffect(() => {
    fetch("/api/admin/policy")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<PolicyDoc[]>)
          : Promise.reject(new Error("Không thể tải danh sách chính sách"))
      )
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPolicies(list);
        if (list.length > 0) setSelectedSlug(list[0].slug);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<PolicyDoc>) => {
    setPolicies((list) =>
      list.map((p) => (p.slug === selectedKey ? { ...p, ...patch } : p))
    );
    setErrors({});
  };

  const addPolicy = () => {
    const draft = emptyPolicy();
    setPolicies((list) => [...list, draft]);
    setSelectedSlug(DRAFT_KEY);
    setErrors({});
  };

  const removePolicy = (slug: string) => {
    setPolicies((list) => list.filter((p) => p.slug !== slug));
    setSelectedSlug((current) => (current === slug ? null : current));
    setConfirmDelete(null);
  };

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    const seen = new Set<string>();

    for (const p of policies) {
      const label = p.title.trim() || p.slug || "văn bản mới";
      if (!isValidPolicySlug(p.slug)) {
        nextErrors[p.slug || DRAFT_KEY] =
          "Slug phải là chữ thường không dấu, số và gạch nối.";
        continue;
      }
      if (seen.has(p.slug)) {
        nextErrors[p.slug] = "Slug bị trùng với văn bản khác.";
        continue;
      }
      seen.add(p.slug);
      if (!p.title.trim()) nextErrors[p.slug] = `${label}: chưa có tiêu đề.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Hãy sửa các ô bị đánh dấu đỏ rồi lưu lại.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies }),
      });
      const data = (await res.json()) as PolicyDoc[] & { error?: string };
      if (!res.ok) throw new Error(data?.error || "Không thể lưu");
      setPolicies(Array.isArray(data) ? data : policies);
      setSelectedSlug(selectedKey === DRAFT_KEY ? null : selectedKey);
      toast.success("Đã lưu chính sách");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Đang tải chính sách..." compact />;
  }

  const publishedCount = policies.filter((p) => p.published).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {policies.length} văn bản · {publishedCount} đang xuất bản
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addPolicy}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            + Thêm văn bản
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu tất cả"}
          </button>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có văn bản nào. Bấm “Thêm văn bản” để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {policies.map((p) => {
              const active = p.slug === selectedKey;
              const invalid = Boolean(errors[p.slug || DRAFT_KEY]);
              return (
                <li key={p.slug || DRAFT_KEY}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlug(p.slug);
                      setErrors({});
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {p.title.trim() || "Chưa có tiêu đề"}
                      </span>
                      {invalid && (
                        <span className="text-red-500 text-xs" title="Cần sửa">
                          ●
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <code className="truncate">/chinh-sach/{p.slug || "…"}</code>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
                          p.published
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {p.published ? "Công khai" : "Nháp"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <div className="space-y-4 p-5 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Tiêu đề</label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      // Chỉ tự sinh slug khi người dùng chưa tự đặt, tránh
                      // đổi URL đã xuất bản ngoài ý muốn.
                      const autoSlug = !selected.slug || selected.slug === slugify(selected.title);
                      update(
                        autoSlug
                          ? { title, slug: slugify(title) }
                          : { title }
                      );
                    }}
                    placeholder="Chính sách bảo mật"
                    className={`${inputClass} ${errorInputClass(errors, selected.slug || DRAFT_KEY)}`}
                    maxLength={200}
                  />
                  <FieldError message={errors[selected.slug || DRAFT_KEY]} />
                </div>
                <div>
                  <label className={labelClass}>Slug (đoạn cuối URL)</label>
                  <input
                    type="text"
                    value={selected.slug}
                    onChange={(e) => update({ slug: slugify(e.target.value) })}
                    placeholder="bao-mat"
                    className={`${inputClass} ${errorInputClass(errors, selected.slug || DRAFT_KEY)}`}
                    maxLength={80}
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    /chinh-sach/{selected.slug || "…"}
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Mô tả ngắn</label>
                <input
                  type="text"
                  value={selected.summary}
                  onChange={(e) => update({ summary: e.target.value })}
                  placeholder="Dùng cho thẻ meta và danh sách chính sách"
                  className={inputClass}
                  maxLength={300}
                />
              </div>

              <div>
                <label className={labelClass}>Nội dung</label>
                <RichEditor
                  content={selected.content}
                  onChange={(html) => update({ content: html })}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.published}
                    onChange={(e) => update({ published: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Xuất bản công khai
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatUpdated(selected.updatedAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(selected.slug)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              Chọn một văn bản ở danh sách bên trái để sửa.
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xoá văn bản?"
        danger
        confirmLabel="Xoá"
        message={`Văn bản "${policies.find((p) => p.slug === confirmDelete)?.title || confirmDelete}" sẽ bị xoá. Bấm "Lưu tất cả" để áp dụng thay đổi.`}
        onConfirm={() => confirmDelete && removePolicy(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
