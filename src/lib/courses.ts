import { db, sqliteClient } from "@/lib/db";
import { courses, courseLessons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Course } from "@/lib/types";

export function getAllCourses(includeUnpublished = false): Course[] {
  const query = db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      image: courses.image,
      level: courses.level,
      price: courses.price,
      category: courses.category,
      tags: courses.tags,
      published: courses.published,
      featured: courses.featured,
      duration: courses.duration,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses);

  if (!includeUnpublished) {
    return query.where(eq(courses.published, true)).all();
  }
  return query.all();
}

export function getCourseBySlug(slug: string, includeUnpublished = false): Course | null {
  const course = db.select().from(courses).where(eq(courses.slug, slug)).get();
  if (!course) return null;
  if (!course.published && !includeUnpublished) return null;
  return course;
}

export function getCourseLessons(courseId: number): Array<{
  id: number;
  courseId: number;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  orderIndex: number;
  duration: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}> {
  return db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.courseId, courseId))
    .orderBy(courseLessons.orderIndex)
    .all();
}

export function countCourseLessons(courseId: number): number {
  const row = sqliteClient
    .prepare("SELECT count(*) AS c FROM course_lessons WHERE course_id = ?")
    .get(courseId) as { c: number };
  return Number(row.c);
}