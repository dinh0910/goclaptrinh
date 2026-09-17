import Link from "next/link";

interface TagCloudProps {
  tags: Record<string, number>;
}

export default function TagCloud({ tags }: TagCloudProps) {
  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return (
    <div className="flex flex-wrap gap-2">
      {sortedTags.map(([tag, count]) => (
        <Link
          key={tag}
          href={`/tags/${tag}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-blue-950 dark:hover:text-blue-400"
        >
          <span>#{tag}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({count})
          </span>
        </Link>
      ))}
    </div>
  );
}
