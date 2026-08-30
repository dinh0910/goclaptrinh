import { MetadataRoute } from "next";
import { getAllPostSlugs, getPostBySlug, getAllTags } from "@/lib/posts";
import { getCategoriesWithCounts } from "@/lib/categories";
import { siteConfig } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getAllPostSlugs();

  const postEntries: MetadataRoute.Sitemap = await Promise.all(
    posts.map(async (slug) => {
      const post = await getPostBySlug(slug);
      return {
        url: `${siteConfig.url}/blog/${slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  const categoryEntries: MetadataRoute.Sitemap = getCategoriesWithCounts().map((cat) => ({
    url: `${siteConfig.url}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tags = getAllTags();
  const tagEntries: MetadataRoute.Sitemap = Object.keys(tags).map((tag) => ({
    url: `${siteConfig.url}/tags/${tag}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...categoryEntries,
    ...tagEntries,
    ...postEntries,
  ];
}
