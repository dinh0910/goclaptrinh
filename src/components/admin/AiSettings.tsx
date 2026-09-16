"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import FieldSelect from "./FieldSelect";
import FieldNumber from "./FieldNumber";

interface PublicProvider {
  id: number;
  name: string;
  baseUrl: string;
  model: string;
  hasKey: boolean;
  maskedKey: string;
  enabled: boolean;
  profiles: AiProfile[];
}

interface AiProfile {
  providerId: number | null;
  action: string;
  label: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  updatedAt: string;
}

interface ProviderDraft {
  id: number | null;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  active: boolean;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const emptyDraft: ProviderDraft = {
  id: null,
  name: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  active: false,
};

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ProfileEditor({
  profiles,
  saving,
  onUpdate,
  onSave,
  onReset,
}: {
  profiles: AiProfile[];
  saving: boolean;
  onUpdate: (action: string, patch: Partial<AiProfile>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Cấu hình hành động của nhà cung cấp
      </p>
      <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
        Mỗi nhà cung cấp có riêng bộ prompt và thông số cho từng nút AI trong trình soạn thảo. Không dùng chung với nhà cung cấp khác.
      </p>
      {profiles.length === 0 ? (
        <p className="text-xs text-amber-500">Chưa có cấu hình hành động nào.</p>
      ) : (
        <div className="space-y-4">
          {profiles.map((pr) => (
            <div key={pr.action} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{pr.label}</p>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bật</span>
                  <Toggle
                    checked={pr.enabled}
                    onChange={() => onUpdate(pr.action, { enabled: !pr.enabled })}
                  />
                </label>
              </div>
              <div>
                <label className={labelClass}>System prompt</label>
                <textarea
                  value={pr.systemPrompt}
                  onChange={(e) => onUpdate(pr.action, { systemPrompt: e.target.value })}
                  rows={5}
                  className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Temperature (0 – 2)</label>
                  <FieldNumber
                    value={pr.temperature}
                    onChange={(v) => onUpdate(pr.action, { temperature: v })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max tokens</label>
                  <FieldNumber
                    value={pr.maxTokens}
                    onChange={(v) => onUpdate(pr.action, { maxTokens: v })}
                    min={1}
                    max={32000}
                    step={100}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {profiles.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình hành động"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  );
}

export default function AiSettings() {
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<ProviderDraft>(emptyDraft);
  const [editingModels, setEditingModels] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<Record<number, { ok: boolean; text: string }>>({});
  const [expandedProfile, setExpandedProfile] = useState<number | null>(null);
  const [profileDrafts, setProfileDrafts] = useState<Record<number, AiProfile[]>>({});
  const [profileSaving, setProfileSaving] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai");
      if (!res.ok) throw new Error("Không thể tải cấu hình AI");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải cấu hình AI");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setBusyKey = (key: string, value: boolean) =>
    setBusy((b) => ({ ...b, [key]: value }));

  const refresh = async () => {
    await load();
    setShowAdd(false);
    setDraft(emptyDraft);
    setEditingModels(null);
    setExpandedProfile(null);
    setProfileDrafts({});
  };

  const openAdd = () => {
    setDraft(emptyDraft);
    setEditingModels(null);
    setShowAdd(true);
  };

  const startEdit = (p: PublicProvider) => {
    setDraft({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: "",
      model: p.model,
      active: p.enabled,
    });
    setEditingModels(null);
    setShowAdd(true);
  };

  const createOrUpdate = async () => {
    if (!draft.name.trim()) return toast.error("Nhập tên nhà cung cấp");
    if (!draft.baseUrl.trim()) return toast.error("Nhập Base URL");
    try {
      setBusyKey("save", true);
      let res: Response;
      if (draft.id) {
        res = await fetch(`/api/admin/ai/providers/${draft.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            baseUrl: draft.baseUrl,
            apiKey: draft.apiKey || null,
            model: draft.model,
            active: draft.active,
          }),
        });
      } else {
        res = await fetch("/api/admin/ai/providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            baseUrl: draft.baseUrl,
            apiKey: draft.apiKey,
            model: draft.model,
            active: draft.active,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");
      toast.success(draft.id ? "Đã cập nhật nhà cung cấp" : "Đã thêm nhà cung cấp");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally {
      setBusyKey("save", false);
    }
  };

  const activate = async (p: PublicProvider) => {
    try {
      setBusyKey(`active-${p.id}`, true);
      const res = await fetch(`/api/admin/ai/providers/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể kích hoạt");
      toast.success(`Đã kích hoạt "${p.name}"`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi kích hoạt");
    } finally {
      setBusyKey(`active-${p.id}`, false);
    }
  };

  const remove = async (p: PublicProvider) => {
    if (!window.confirm(`Xóa nhà cung cấp "${p.name}"? Cấu hình hành động của nhà cung cấp này cũng sẽ bị xóa. Không thể hoàn tác.`)) return;
    try {
      setBusyKey(`del-${p.id}`, true);
      const res = await fetch(`/api/admin/ai/providers/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa");
      toast.success("Đã xóa nhà cung cấp");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi xóa");
    } finally {
      setBusyKey(`del-${p.id}`, false);
    }
  };

  const testProvider = async (p: PublicProvider) => {
    const isEditing = draft.id === p.id;
    try {
      setBusyKey(`test-${p.id}`, true);
      const res = await fetch(`/api/admin/ai/providers/${p.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          baseUrl: isEditing ? draft.baseUrl : "",
          apiKey: isEditing ? draft.apiKey : "",
          model: isEditing ? draft.model : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kết nối thất bại");
      setNote((n) => ({ ...n, [p.id]: { ok: true, text: data.result } }));
      toast.success("Kết nối thành công");
    } catch (e) {
      setNote((n) => ({ ...n, [p.id]: { ok: false, text: e instanceof Error ? e.message : "Lỗi" } }));
      toast.error(e instanceof Error ? e.message : "Kết nối thất bại");
    } finally {
      setBusyKey(`test-${p.id}`, false);
    }
  };

  const testDraft = async () => {
    if (!draft.baseUrl.trim()) return toast.error("Nhập Base URL trước khi kiểm tra");
    try {
      setBusyKey("test-form", true);
      const res = await fetch(
        draft.id ? `/api/admin/ai/providers/${draft.id}` : "/api/admin/ai",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            baseUrl: draft.baseUrl,
            apiKey: draft.apiKey,
            model: draft.model,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kết nối thất bại");
      toast.success(`Kết nối thành công: ${data.result}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kết nối thất bại");
    } finally {
      setBusyKey("test-form", false);
    }
  };

  const fetchDraftModels = async () => {
    if (!draft.baseUrl.trim()) return toast.error("Nhập Base URL trước khi lấy model");
    try {
      setBusyKey("models-form", true);
      const res = await fetch(
        draft.id ? `/api/admin/ai/providers/${draft.id}` : "/api/admin/ai",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "list_models",
            baseUrl: draft.baseUrl,
            apiKey: draft.apiKey,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không lấy được danh sách model");
      setEditingModels(data.models || []);
      toast.success(`Đã lấy ${(data.models || []).length} model`);
    } catch (e) {
      setEditingModels([]);
      toast.error(e instanceof Error ? e.message : "Lỗi lấy danh sách model");
    } finally {
      setBusyKey("models-form", false);
    }
  };

  const toggleProfileOpen = (p: PublicProvider) => {
    if (expandedProfile === p.id) {
      setExpandedProfile(null);
    } else {
      setProfileDrafts((d) => ({
        ...d,
        [p.id]: p.profiles.map((pr) => ({ ...pr })),
      }));
      setExpandedProfile(p.id);
    }
  };

  const updateProfileDraft = (providerId: number, action: string, patch: Partial<AiProfile>) => {
    setProfileDrafts((d) => ({
      ...d,
      [providerId]: (d[providerId] || []).map((pr) =>
        pr.action === action ? { ...pr, ...patch } : pr
      ),
    }));
  };

  const resetProfileDraft = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    setProfileDrafts((d) => ({
      ...d,
      [providerId]: provider.profiles.map((pr) => ({ ...pr })),
    }));
  };

  const saveProfileDraft = async (providerId: number) => {
    const draftProfiles = profileDrafts[providerId];
    if (!draftProfiles || draftProfiles.length === 0) return;
    try {
      setProfileSaving((s) => ({ ...s, [providerId]: true }));
      const res = await fetch("/api/admin/ai/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, profiles: draftProfiles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");
      setProviders((list) =>
        list.map((p) => (p.id === providerId ? { ...p, profiles: data.profiles } : p))
      );
      setProfileDrafts((d) => ({ ...d, [providerId]: data.profiles }));
      toast.success("Đã lưu cấu hình hành động");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally {
      setProfileSaving((s) => ({ ...s, [providerId]: false }));
    }
  };

  const activeProvider = providers.find((p) => p.enabled);

  return (
    <div className="max-w-3xl">
      {/* AI enable summary */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span
          className={`inline-flex h-2.5 w-2.5 rounded-full ${
            activeProvider ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
        <span className="text-gray-700 dark:text-gray-300">
          {activeProvider
            ? `AI đang hoạt động qua "${activeProvider.name}"`
            : "Chưa kích hoạt nhà cung cấp nào — AI sẽ không hoạt động"}
        </span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Spinner className="w-5 h-5" />
          </div>
        ) : providers.length === 0 && !showAdd ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Chưa có nhà cung cấp AI nào
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Thêm nhà cung cấp có API tương thích OpenAI (OpenRouter, Groq, Google AI Studio, DeepSeek...) để sử dụng AI viết bài. Mỗi nhà cung cấp sẽ có bộ cấu hình hành động riêng.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Thêm nhà cung cấp
            </button>
          </div>
        ) : (
          <>
            {showAdd && (
              <div className="rounded-xl border border-blue-300 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-500/10 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {draft.id ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Tên nhà cung cấp *</label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className={inputClass}
                      placeholder="OpenRouter"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Base URL *</label>
                    <input
                      type="url"
                      value={draft.baseUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
                      className={inputClass}
                      placeholder="https://openrouter.ai/api/v1"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      API Key {draft.id && <span className="text-gray-400">(để trống = giữ key cũ)</span>}
                    </label>
                    <input
                      type="password"
                      value={draft.apiKey}
                      onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                      className={inputClass}
                      placeholder={draft.id ? "••••••••" : "sk-..."}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className={labelClass}>Model</label>
                        {editingModels && editingModels.length > 0 ? (
                          <FieldSelect
                            value={draft.model}
                            onChange={(v) => setDraft((d) => ({ ...d, model: v }))}
                            options={(editingModels as string[]).map((m) => ({
                              value: m,
                              label: m,
                            }))}
                            placeholder="Chọn model..."
                            className="w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            value={draft.model}
                            onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                            className={inputClass}
                            placeholder="gpt-4o-mini"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={fetchDraftModels}
                        disabled={busy["models-form"]}
                        className="mb-0.5 inline-flex items-center gap-1.5 px-3 h-11 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg disabled:opacity-50 transition-colors shrink-0"
                      >
                        {busy["models-form"] ? (
                          <Spinner className="w-3 h-3" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        )}
                        Lấy model
                      </button>
                    </div>
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Kích hoạt ngay (nhà cung cấp đang dùng)
                  </span>
                </label>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={createOrUpdate}
                    disabled={busy["save"]}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {busy["save"] ? "Đang lưu..." : draft.id ? "Lưu thay đổi" : "Thêm nhà cung cấp"}
                  </button>
                  <button
                    type="button"
                    onClick={testDraft}
                    disabled={busy["test-form"]}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {busy["test-form"] ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      setDraft(emptyDraft);
                      setEditingModels(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${
                    p.enabled
                      ? "border-green-300 dark:border-green-500/40 bg-green-50/40 dark:bg-green-500/5"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        {p.enabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/10 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Đang hoạt động
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 break-all">{p.baseUrl}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Model: <span className="font-mono text-gray-700 dark:text-gray-300">{p.model || "(chưa đặt)"}</span>{" "}
                        · Key: {p.hasKey ? <span className="font-mono">{p.maskedKey}</span> : <span className="text-amber-500">chưa nhập</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        {!p.enabled && (
                          <button
                            type="button"
                            onClick={() => activate(p)}
                            disabled={busy[`active-${p.id}`]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {busy[`active-${p.id}`] && <Spinner className="w-3 h-3" />}
                            Kích hoạt
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => testProvider(p)}
                          disabled={busy[`test-${p.id}`]}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {busy[`test-${p.id}`] ? "Đang test..." : "Kiểm tra"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p)}
                          disabled={busy[`del-${p.id}`]}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {busy[`del-${p.id}`] ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProfileOpen(p)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${expandedProfile === p.id ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {expandedProfile === p.id ? "Ẩn cấu hình hành động" : `Cấu hình hành động (${p.profiles.length})`}
                      </button>
                    </div>
                  </div>
                  {note[p.id] && (
                    <div
                      className={`mt-3 p-2 rounded-lg text-xs ${
                        note[p.id].ok
                          ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {note[p.id].ok ? `Kết nối thành công: ${note[p.id].text}` : note[p.id].text}
                    </div>
                  )}
                  {expandedProfile === p.id && (
                    <ProfileEditor
                      profiles={profileDrafts[p.id] || p.profiles}
                      saving={Boolean(profileSaving[p.id])}
                      onUpdate={(action, patch) => updateProfileDraft(p.id, action, patch)}
                      onSave={() => saveProfileDraft(p.id)}
                      onReset={() => resetProfileDraft(p.id)}
                    />
                  )}
                </div>
              ))}
            </div>

            {!showAdd && (
              <button
                type="button"
                onClick={openAdd}
                className="w-full py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                + Thêm nhà cung cấp
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}