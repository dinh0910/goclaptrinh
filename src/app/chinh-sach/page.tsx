import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getPublishedPolicies } from "@/lib/policy";

// Nội dung do admin sửa lúc chạy nên render động, không phụ thuộc cache lúc build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chính sách",
  description: `Các chính sách của ${siteConfig.name}: bảo mật dữ liệu, điều khoản sử dụng và thông tin liên hệ.`,
  alternates: {
    canonical: `${siteConfig.url}/chinh-sach`,
  },
};

export default function PolicyIndexPage() {
  const policies = getPublishedPolicies();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Chính sách
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Các văn bản điều khoản áp dụng khi bạn sử dụng {siteConfig.name}.
        </p>
      </header>

      {policies.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hiện chưa có văn bản nào được xuất bản.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {policies.map((policy) => (
            <li key={policy.slug}>
              <Link
                href={`/chinh-sach/${policy.slug}`}
                className="group block p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-600"
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {policy.title}
                </h2>
                {policy.summary && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {policy.summary}
                  </p>
                )}
                {policy.updatedAt && (
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    Cập nhật lần cuối:{" "}
                    {new Date(policy.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
