"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getVisitorId, getVisitorSignals } from "@/lib/client-visitor";

export default function NewsletterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Vui lòng nhập email của bạn.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: "",
          visitorId: getVisitorId(),
          signals: getVisitorSignals(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setStatus("ok");
        setEmail("");
        setMessage(data.message || "Đăng ký thành công!");
        router.refresh();
      } else {
        setStatus("error");
        setMessage(data?.error || "Không thể đăng ký. Vui lòng thử lại.");
      }
    } catch {
      setStatus("error");
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        disabled={status === "loading"}
        className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Đang gửi..." : "Đăng ký"}
      </button>
      {status !== "idle" && (
        <p
          className={`text-sm mt-2 sm:mt-0 sm:w-full ${
            status === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}