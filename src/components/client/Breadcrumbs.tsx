"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <li>
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Trang chủ
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

          return (
            <li key={href} className="flex items-center gap-1.5">
              <span>/</span>
              {isLast ? (
                <span className="text-gray-900 dark:text-white font-medium">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
