"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  emptyHero,
  type HeroConfig,
  type HeroPreset,
  type HeroTemplate,
} from "@/lib/hero-config";

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

const TEXT_FIELDS = [
  ["badge", "Badge (dòng nhỏ phía trên tiêu đề)"],
  ["heading", "Tiêu đề chính (phần trước)"],
  ["highlight", "Từ nổi bật (gradient)"],
  ["headingSuffix", "Phần sau tiêu đề"],
  ["subtitle", "Mô tả"],
  ["primaryText", "Nút chính — chữ"],
  ["primaryLink", "Nút chính — liên kết"],
  ["secondaryText", "Nút phụ — chữ"],
  ["secondaryLink", "Nút phụ — liên kết"],
] as const;

const TEMPLATES: {
  key: HeroTemplate;
  label: string;
  desc: string;
}[] = [
  {
    key: "hero-text",
    label: "Nội dung + Code",
    desc: "Nội dung bên trái, khối code minh họa bên phải (mặc định)",
  },
  {
    key: "hero-center",
    label: "Canh giữa",
    desc: "Toàn bộ nội dung ở giữa, nền sáng, không khối code",
  },
  {
    key: "hero-glow",
    label: "Nền tối phát sáng",
    desc: "Nền tối với hiệu ứng gradient phát sáng, nội dung ở giữa",
  },
];

export default function BannerEditor({
  id,
  mode = id ? "edit" : "new",
}: {
  id?: string;
  mode?: "new" | "edit";
}) {
  const isNew = mode === "new";
  const [presets, setPresets] = useState<HeroPreset[]>([]);
  const [draft, setDraft] = useState<HeroPreset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải cấu hình banner");
        return res.json() as Promise<{ presets: HeroPreset[] }>;
      })
      .then((data) => {
        setPresets(data.presets);
        if (isNew) {
          setDraft({
            id: "",
            name: `Biến thể ${data.presets.length + 1}`,
            active: false,
            config: emptyHero(),
          });
        } else {
          const found = data.presets.find((p) => p.id === id);
          if (found) setDraft(found);
        }
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraft = (updater: (d: HeroPreset) => HeroPreset) => {
    setDraft((d) => (d ? updater(d) : d));
  };

  const updateConfig = (updater: (c: HeroConfig) => HeroConfig) => {
    updateDraft((d) => ({ ...d, config: updater(d.config) }));
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const draftId = isNew ? `p-${Date.now()}` : draft.id;
      const next = isNew
        ? [...presets, { ...draft, id: draftId }]
        : presets.map((p) => (p.id === draft.id ? { ...draft } : p));
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presets: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Không thể lưu banner");
      }
      setPresets(next);
      toast.success(isNew ? "Đã tạo biến thể mới" : "Đã lưu biến thể");
      if (isNew) {
        router.push(`/admin/banners/${draftId}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đang tải cấu hình banner...
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/banners"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Danh sách
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNew ? "Thêm biến thể mới" : "Chỉnh sửa biến thể"}
            {!isNew && draft && (
              <span className="text-gray-500 dark:text-gray-400 font-semibold">
                : {draft.name}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving
              ? "Đang lưu..."
              : isNew
                ? "Tạo biến thể"
                : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* Tên biến thể */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tên biến thể
        </label>
        <div>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => updateDraft((d) => ({ ...d, name: e.target.value }))}
            className={`${inputClass} max-w-md font-semibold`}
          />
          {!isNew && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {draft.active
                ? "Biến thể này đang được hiển thị trên trang chủ."
                : "Biến thể chưa được kích hoạt — vào danh sách để bấm " +
                  "\u201cKích hoạt\u201d."}
            </p>
          )}
        </div>
      </div>

      {/* Template selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kiểu banner
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const isActive = draft.config.template === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  updateConfig((c) => ({ ...c, template: t.key }))
                }
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.label}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero text fields */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nội dung hero
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={
                  draft.config.heroText[
                    key as keyof typeof draft.config.heroText
                  ] as string
                }
                onChange={(e) =>
                  updateConfig((c) => ({
                    ...c,
                    heroText: {
                      ...c.heroText,
                      [key]: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Code block — only used by the "Nội dung + Code" style */}
      {draft.config.template === "hero-text" && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Khối code minh họa (bên phải)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tên file (trên tab)
              </label>
              <input
                type="text"
                value={draft.config.heroText.code.title}
                onChange={(e) =>
                  updateConfig((c) => ({
                    ...c,
                    heroText: {
                      ...c.heroText,
                      code: {
                        ...c.heroText.code,
                        title: e.target.value,
                      },
                    },
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nội dung code (1 dòng mỗi dòng)
            </label>
            <textarea
              rows={10}
              spellCheck={false}
              value={draft.config.heroText.code.lines.join("\n")}
              onChange={(e) =>
                updateConfig((c) => ({
                  ...c,
                  heroText: {
                    ...c.heroText,
                    code: {
                      ...c.heroText.code,
                      lines: e.target.value.split("\n"),
                    },
                  },
                }))
              }
              className={`${inputClass} font-mono text-xs leading-5`}
            />
          </div>
        </div>
      )}
    </div>
  );
}