"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MediaPicker from "./MediaPicker";
import FieldSelect from "./FieldSelect";
import FieldNumber from "./FieldNumber";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import Breadcrumb from "@/components/shared/Breadcrumb";
import type { FieldErrors } from "@/lib/validation";

interface CourseFormData {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  level: string;
  price: number;
  category: string;
  categoryInput: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  duration: string;
}

interface CourseEditorProps {
  mode: "create" | "edit";
  slug?: string;
  initialData?: Partial<CourseFormData>;
  categories?: { slug: string; name: string; icon?: string }[];
  levels?: { key: string; label: string; icon?: string }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fieldClass =
  "w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

export default function CourseEditor({
  mode,
  slug,
  initialData,
  categories,
  levels = [],
}: CourseEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CourseFormData>({
    id: initialData?.id ?? 0,
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    image: initialData?.image || "",
    level: initialData?.level || "beginner",
    price: initialData?.price ?? 0,
    category: initialData?.category || "",
    categoryInput: "",
    tags: initialData?.tags || [],
    published: initialData?.published ?? false,
    featured: initialData?.featured ?? false,
    duration: initialData?.duration || "",
  });

  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const levelOptions =
    levels.length > 0
      ? levels.map((l) => ({ value: l.key, label: l.label, icon: l.icon }))
      : [{ value: "beginner", label: "Cơ bản", icon: "🌱" }];

  const updateField = <K extends keyof CourseFormData>(
    key: K,
    value: CourseFormData[K]
  ) => {
    setErrors((er) => ({ ...er, [key]: "" }));
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && mode === "create") {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateField("image", data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.title.trim()) nextErrors.title = "Tiêu đề là bắt buộc";
    if (!form.slug.trim()) {
      nextErrors.slug = "Slug là bắt buộc";
    } else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      nextErrors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const body = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        category:
          form.category === "__custom__" ? form.categoryInput.trim() : form.category,
      };
      const url =
        mode === "edit" ? `/api/admin/courses/${initialData?.id}` : "/api/admin/courses";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (mode === "edit") {
        toast.success("Cập nhật khóa học thành công!");
        if (slug && form.slug !== slug) {
          document.dispatchEvent(new CustomEvent("admin:navigation"));
          router.replace(`/admin/courses/${encodeURIComponent(form.slug)}/edit`);
        }
        router.refresh();
      } else {
        document.dispatchEvent(new CustomEvent("admin:navigation"));
        router.push("/admin/courses");
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Khóa học", href: "/admin/courses" },
          { label: mode === "edit" ? "Chỉnh sửa khóa học" : "Thêm khóa học mới" },
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
          {mode === "edit" ? `Chỉnh sửa: ${form.title || ""}` : "Thêm khóa học mới"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {saving ? "Đang lưu..." : mode === "edit" ? "Cập nhật" : "Tạo khóa học"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={`${fieldClass} ${errorInputClass(errors, "title")} text-lg`}
              placeholder="Nhập tiêu đề khóa học..."
            />
            <FieldError message={errors.title} />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Slug *
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className={`${fieldClass} ${errorInputClass(errors, "slug")} font-mono text-sm`}
              placeholder="khoa-hoc-lap-trinh"
            />
            <FieldError message={errors.slug} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className={`${fieldClass} resize-none`}
              placeholder="Mô tả ngắn gọn nội dung khóa học..."
            />
            <FieldError message={errors.description} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Ảnh bìa
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                uploadDragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              }`}
            >
              {form.image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); updateField("image", ""); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading ? "Đang tải..." : "Kéo thả ảnh hoặc click để chọn"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    JPEG, PNG, WebP, GIF (tối đa 5MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>
            <input
              type="text"
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              className="mt-2 w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Hoặc dán URL ảnh..."
            />
            <button
              type="button"
              onClick={() => setShowMediaPicker(true)}
              className="mt-2 w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
            >
              🖼️ Chọn từ thư viện media
            </button>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cấp độ
            </label>
            <FieldSelect
              value={form.level}
              onChange={(v) => updateField("level", v)}
              options={levelOptions}
              placeholder="Chọn cấp độ..."
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Giá (VND)
            </label>
            <FieldNumber
              value={form.price}
              onChange={(v) => updateField("price", v)}
              min={0}
              max={100_000_000}
              step={10_000}
              className="w-full"
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              0 = khóa học miễn phí
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Danh mục
            </label>
            <FieldSelect
              value={form.category === "__custom__" ? "__custom__" : form.category}
              onChange={(v) => updateField("category", v)}
              options={[
                ...(categories ?? []).map((c) => ({
                  value: c.slug,
                  label: c.name,
                  icon: c.icon,
                })),
                { value: "__custom__", label: "✏️ Nhập danh mục khác..." },
              ]}
              placeholder="Chọn danh mục..."
              searchable
            />
            {form.category === "__custom__" && (
              <input
                type="text"
                value={form.categoryInput}
                onChange={(e) => updateField("categoryInput", e.target.value)}
                className="mt-2 w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập tên danh mục mới..."
              />
            )}
            <FieldError message={errors.category} />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Thời lượng
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              className={fieldClass}
              placeholder="VD: 8 giờ 30 phút"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Thêm tag..."
              />
              <button
                onClick={addTag}
                className="px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Published */}
          <label className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => updateField("published", e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Đăng công khai</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị ở danh sách khóa học cho người dùng</p>
            </div>
          </label>

          {/* Featured */}
          <label className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Nổi bật</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị ở vị trí đặc biệt trong danh sách khóa học</p>
            </div>
          </label>
        </div>
      </div>

      {showMediaPicker && (
        <MediaPicker
          onSelect={(item) => {
            updateField("image", item.url);
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}