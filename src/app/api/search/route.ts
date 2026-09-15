import { NextRequest, NextResponse } from "next/server";
import { searchPosts } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ query: "", results: [], count: 0 });
  }
  try {
    const results = searchPosts(q);
    return NextResponse.json({ query: q, results, count: results.length });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}