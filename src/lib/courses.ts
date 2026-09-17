import { db, sqliteClient } from "@/lib/db";
import { courses, courseLessons, courseEnrollments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { Course, CourseEnrollmentProgress } from "@/lib/types";

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
  slug: string;
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

export interface CourseLesson {
  id: number;
  courseId: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  orderIndex: number;
  duration: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function countPublishedLessons(courseId: number): number {
  const row = sqliteClient
    .prepare("SELECT count(*) AS c FROM course_lessons WHERE course_id = ? AND published = 1")
    .get(courseId) as { c: number };
  return Number(row.c);
}

export function getEnrollmentByEmail(
  courseId: number,
  email: string
): CourseEnrollmentProgress | null {
  if (!email) return null;
  const row = db
    .select()
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.userEmail, email)))
    .get();
  if (!row) return null;
  const completedLessons = Array.isArray(row.completedLessons) ? row.completedLessons : [];
  return {
    progress: Number(row.progress) || 0,
    completed: Boolean(row.completed),
    completedLessons,
  };
}

export function setLessonCompleted(
  courseId: number,
  lessonId: number,
  email: string,
  completed: boolean
): CourseEnrollmentProgress | null {
  if (!email) return null;

  const total = countPublishedLessons(courseId);
  const existing = db
    .select()
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.userEmail, email)))
    .get();

  const current: number[] = existing && Array.isArray(existing.completedLessons)
    ? existing.completedLessons
    : [];
  const nextSet = completed
    ? Array.from(new Set([...current, lessonId]))
    : current.filter((id) => id !== lessonId);
  const nextProgress = total > 0 ? Math.round((nextSet.length / total) * 100) : 0;
  const nextCompleted = total > 0 && nextSet.length >= total;
  const now = new Date().toISOString();

  if (existing) {
    db.update(courseEnrollments)
      .set({
        progress: nextProgress,
        completed: nextCompleted,
        completedLessons: nextSet,
        updatedAt: now,
      })
      .where(eq(courseEnrollments.id, existing.id))
      .run();
  } else {
    db.insert(courseEnrollments)
      .values({
        courseId,
        userEmail: email,
        visitorId: "",
        progress: nextProgress,
        completed: nextCompleted,
        completedLessons: nextSet,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return { progress: nextProgress, completed: nextCompleted, completedLessons: nextSet };
}