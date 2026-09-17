"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FieldSelect from "@/components/admin/ui/FieldSelect";
import { WelcomeVisual } from "@/components/client/welcome/WelcomeVisual";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import { TextArea } from "@/components/shared/TextArea";
import FieldNumber from "@/components/admin/ui/FieldNumber";
import Breadcrumb from "@/components/shared/Breadcrumb";
import type { FieldErrors } from "@/lib/validation";
import {
  DEFAULT_ITEM,
  FIELD_TYPES,
  WELCOME_EMOJIS,
  WELCOME_TEMPLATES,
  emptyWelcomeItem,
  type WelcomeField,
  type WelcomeItem,
} from "@/lib/welcome-config";

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

export default function WelcomeEditor({
  id,
  mode,
}: {
  id: string;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<WelcomeItem>(() => emptyWelcomeItem());
  const [exists, setExists] = useState(mode === "new");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;
    fetch("/api/welcome/admin")
      .then((res) =>
        res.ok ? (res.json() as Promise<{ items: WelcomeItem[] }>) : null
      )
      .then((data) => {
        if (cancelled) return;
        const found = data?.items.find((i) => i.id === id);
        if (found) {
          setForm(found);
          setExists(true);
        } else {
          setExists(false);
        }
      })
      .catch(() => toast.error("Không thể tải popup giới thiệu"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const set = <K extends keyof WelcomeItem>(key: K, value: WelcomeItem[K]) => {
    setErrors((er) => ({ ...er, [key]: "" }));
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updateField = (id: string, patch: Partial<WelcomeField>) => {
    setErrors((er) => ({ ...er, [id]: "", fields: "" }));
    set("fields", form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addField = () => {
    setErrors((er) => ({ ...er, fields: "" }));
    set("fields", [
      ...form.fields,
      {
        id: `field-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        label: "Trường mới",
        type: "text",
        placeholder: "",
        required: false,
      },
    ]);
  };

  const removeField = (id: string) => {
    setErrors((er) => ({ ...er, fields: "", [id]: "" }));
    set("fields", form.fields.filter((f) => f.id !== id));
  };

  const selectTemplate = (key: WelcomeItem["template"]) => {
    setErrors((er) => ({ ...er, fields: "", template: "" }));
    setForm((f) => {
      if (key === "form" && f.fields.length === 0) {
        const ts = Date.now().toString(36);
        return {
          ...f,
          template: key,
          fields: [
            {
              id: `field-${ts}a`,
              label: "Email",
              type: "email",
              placeholder: "you@example.com",
              required: true,
            },
            {
              id: `field-${ts}b`,
              label: "Số điện thoại",
              type: "phone",
              placeholder: "VD: 0987654321",
              required: false,
            },
          ],
        };
      }
      return { ...f, template: key };
    });
  };

  const isValidLink = (v: string) =>
    /^\/(?!\/)/.test(v) || /^#/.test(v) || /^https?:\/\//i.test(v);

  const save = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "Tên popup là bắt buộc";
    }
    if (!form.title.trim()) {
      nextErrors.title = "Popup cần có tiêu đề để hiển thị";
    }
    if (form.buttonText.trim() || form.buttonLink.trim()) {
      if (!form.buttonText.trim()) {
        nextErrors.buttonText = "Cần có chữ cho nút chính";
      }
      if (!form.buttonLink.trim()) {
        nextErrors.buttonLink = "Cần có link cho nút chính";
      } else if (!isValidLink(form.buttonLink.trim())) {
        nextErrors.buttonLink = "Link phải bắt đầu bằng /, # hoặc http(s)://";
      }
    }
    if (form.reappearHours < 0 || form.reappearHours > 8760) {
      nextErrors.reappearHours = "Giờ phải là số từ 0 đến 8760";
    }
    if (form.appearDelay < 0 || form.appearDelay > 60) {
      nextErrors.appearDelay = "Giây phải là số từ 0 đến 60";
    }
    if (form.template === "form") {
      if (form.fields.length === 0) {
        nextErrors.fields = "Popup đăng ký nhận tin cần ít nhất một trường nhập liệu";
      } else {
        for (const f of form.fields) {
          if (!f.label.trim()) nextErrors[f.id] = "Nhãn trường là bắt buộc";
        }
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    setErrors({});
    const toSave: WelcomeItem =
      form.reappearHours === 0
        ? { ...form, reappearHours: DEFAULT_ITEM.reappearHours }
        : form;
    setSaving(true);
    try {
      const res = await fetch("/api/welcome/admin").catch(() => null);
      const current = res && res.ok
        ? ((await res.json()) as { items?: WelcomeItem[] }).items ?? []
        : [];
      const exists = current.some((i) => i.id === toSave.id);
      const items = exists
        ? current.map((i) => (i.id === toSave.id ? toSave : i))
        : [...current, toSave];
      if (items.length === 0) {
        toast.error("Không thể lưu popup");
        return;
      }
      const put = await fetch("/api/welcome/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await put.json();
      if (!put.ok) {
        toast.error(data.error || "Không thể lưu popup");
        return;
      }
      toast.success(exists ? "Đã cập nhật popup giới thiệu" : "Đã tạo popup giới thiệu");
      router.push("/admin/welcome");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && !exists) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đang tải popup giới thiệu...
          </p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Không tìm thấy popup giới thiệu này.
            </p>
            <Link
              href="/admin/welcome"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 underline"
            >
              Quay lại danh sách
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="xl:grid xl:grid-cols-[1fr_380px] xl:gap-6 xl:items-start">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Popup giới thiệu", href: "/admin/welcome" },
          { label: mode === "edit" ? "Chỉnh sửa popup" : "Popup mới" },
        ]}
      />
      {/* Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6 xl:mb-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {mode === "edit" ? "Chỉnh sửa popup" : "Popup mới"}
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                aria-label="Bật bật popup này"
                onClick={() => set("active", !form.active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {form.active ? "Hiển thị" : "Ẩn"}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Tên popup (hiển thị trong danh sách)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Khuyến mãi Tết"
              className={`${inputClass} ${errorInputClass(errors, "name")}`}
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Thiết kế popup
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WELCOME_TEMPLATES.map((t) => {
                const selected = form.template === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => selectTemplate(t.key)}
                    className={`relative rounded-xl p-4 text-left transition-colors border-2 ${
                      selected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t.label}
                      </span>
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nhãn nhỏ (badge)
            </label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="VD: ƯU ĐÃI, TIN MỚI"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Tiêu đề
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Tiêu đề hiển thị trong popup"
              className={`${inputClass} ${errorInputClass(errors, "title")}`}
            />
            <FieldError message={errors.title} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nội dung
            </label>
            <TextArea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={4}
              placeholder="Nội dung giới thiệu khuyến mãi / thông báo..."
              className="resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Biểu tượng (emoji)
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {WELCOME_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set("emoji", em)}
                  className={`h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                    form.emoji === em
                      ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              placeholder="VD: 🎉"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Nút chính (text)
              </label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                placeholder="VD: Khám phá ngay"
                className={`${inputClass} ${errorInputClass(errors, "buttonText")}`}
              />
              <FieldError message={errors.buttonText} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Link của nút
              </label>
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) => set("buttonLink", e.target.value)}
                placeholder="/blog hoặc https://..."
                className={`${inputClass} ${errorInputClass(errors, "buttonLink")}`}
              />
              <FieldError message={errors.buttonLink} />
            </div>
          </div>

          {form.template === "form" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trường đăng ký ({form.fields.length})
                </h3>
                <button
                  type="button"
                  onClick={addField}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Thêm trường
                </button>
              </div>

              {form.fields.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Chưa có trường nào. Bấm “+ Thêm trường” để thêm email, số
                  điện thoại, tên...
                </p>
              )}
              <FieldError message={errors.fields} />

              {form.fields.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => updateField(f.id, { label: e.target.value })}
                        placeholder="Nhãn (VD: Email, Số điện thoại)"
                        className={`${inputClass} text-sm ${errorInputClass(errors, f.id)}`}
                      />
                      <FieldError message={errors[f.id]} />
                      <div className="flex gap-2">
                        <FieldSelect
                          value={f.type}
                          onChange={(v) =>
                            updateField(f.id, {
                              type: v as WelcomeField["type"],
                            })
                          }
                          options={FIELD_TYPES.map((t) => ({
                            value: t.key,
                            label: t.label,
                          }))}
                          size="sm"
                          className="w-36 shrink-0"
                        />
                        <input
                          type="text"
                          value={f.placeholder}
                          onChange={(e) =>
                            updateField(f.id, { placeholder: e.target.value })
                          }
                          placeholder="Gợi ý nhập liệu"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      title="Xóa trường"
                      className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(f.id, { required: e.target.checked })}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Bắt buộc nhập
                    </span>
                  </label>
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Thông báo sau khi đăng ký thành công
                </label>
                <TextArea
                  value={form.successMessage}
                  onChange={(e) => set("successMessage", e.target.value)}
                  rows={2}
                  placeholder="VD: Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm."
                  className="resize-y"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Hiện lại sau khi đóng (giờ)
              </label>
              <FieldNumber
                value={form.reappearHours}
                onChange={(v) => set("reappearHours", v)}
                min={0}
                max={8760}
                className={errorInputClass(errors, "reappearHours")}
              />
              <FieldError message={errors.reappearHours} />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Nhập 0 để chỉ hiện đúng một lần mỗi trình duyệt. Mặc định 24 giờ.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Hiện sau khi tải trang (giây)
              </label>
              <FieldNumber
                value={form.appearDelay}
                onChange={(v) => set("appearDelay", v)}
                min={0}
                max={60}
                className={errorInputClass(errors, "appearDelay")}
              />
              <FieldError message={errors.appearDelay} />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Nhịp chờ trước khi popup bật lên. VD: 3 giây để khách xem trang một chút.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-5">
          <Link
            href="/admin/welcome"
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Quay lại danh sách
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu popup"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Xem trước
        </h2>
        <WelcomeVisual item={form} preview />
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          {form.active
            ? "Popup này sẽ được hiển thị cho khách truy cập trang chủ."
            : "Popup này hiện đang bị ẩn."}
        </p>
      </div>
    </div>
  );
}