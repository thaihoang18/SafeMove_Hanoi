import { sql } from "../db.mjs";
import { assert, isNonEmptyString } from "../utils/validation.mjs";

function normalizeAuthor(row) {
  const fullName = typeof row.full_name === "string" ? row.full_name.trim() : "";
  const emailPrefix = typeof row.email === "string" ? row.email.split("@")[0]?.trim() : "";

  return fullName || emailPrefix || "Ẩn danh";
}

function toReview(row) {
  return {
    id: row.id,
    location_id: row.location_id,
    user_id: row.user_id,
    author: normalizeAuthor(row),
    rating: Number(row.rating),
    content: row.content,
    helpful_count: Number(row.helpful_count ?? 0),
    is_hidden: Boolean(row.is_hidden),
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata ?? {},
  };
}

export async function listLocationReviewsController(locationId) {
  const reviews = await sql`
    select
      lr.id,
      lr.location_id,
      lr.user_id,
      lr.rating,
      lr.content,
      lr.helpful_count,
      lr.is_hidden,
      lr.created_at,
      lr.updated_at,
      lr.metadata,
      u.full_name,
      u.email
    from airpath.location_reviews lr
    join airpath.users u on u.id = lr.user_id
    where lr.location_id = ${locationId}
      and lr.is_hidden = false
    order by lr.created_at desc
    limit 100
  `;

  return { reviews: reviews.map(toReview) };
}

export async function createLocationReviewController(locationId, body) {
  assert(isNonEmptyString(body.userId), "userId is required.");
  assert(isNonEmptyString(body.content), "content is required.");

  const rating = Number(body.rating);
  assert(Number.isInteger(rating) && rating >= 1 && rating <= 5, "rating must be between 1 and 5.");

  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

  const [review] = await sql`
    insert into airpath.location_reviews (
      location_id,
      user_id,
      rating,
      content,
      metadata
    ) values (
      ${locationId},
      ${body.userId.trim()},
      ${rating},
      ${body.content.trim()},
      ${JSON.stringify(metadata)}::jsonb
    )
    returning id, location_id, user_id, rating, content, helpful_count, is_hidden, created_at, updated_at, metadata
  `;

  const [authorRow] = await sql`
    select
      u.full_name,
      u.email
    from airpath.users u
    where u.id = ${review.user_id}
  `;

  return {
    review: {
      ...toReview({ ...review, ...(authorRow ?? {}) }),
    },
  };
}