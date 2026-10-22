/**
 * Curated rating dataset for Cinemetric.
 * 10 users × 13 catalog movies with ~55% density.
 * Clear taste clusters:
 *   Cluster 1 (u1-u5): Sci-Fi / Action / Nolan enthusiasts
 *   Cluster 2 (u6-u10): Drama / Romance / Animation / Indie enthusiasts
 * Movie m14 (Chronopolis) is intentionally unrated (cold-start item).
 */

export interface Rating {
  userId: string;
  movieId: string;
  rating: number; // 1 to 5 scale
}

export interface User {
  id: string;
  name: string;
  cluster: "Sci-Fi / Action" | "Drama / Romance";
}

export const USERS: User[] = [
  { id: "u1", name: "Alex Chen (Target)", cluster: "Sci-Fi / Action" },
  { id: "u2", name: "Jordan Reed", cluster: "Sci-Fi / Action" },
  { id: "u3", name: "Taylor Vance", cluster: "Sci-Fi / Action" },
  { id: "u4", name: "Morgan Scott", cluster: "Sci-Fi / Action" },
  { id: "u5", name: "Casey Brooks", cluster: "Sci-Fi / Action" },
  { id: "u6", name: "Riley Harper", cluster: "Drama / Romance" },
  { id: "u7", name: "Sam Patel", cluster: "Drama / Romance" },
  { id: "u8", name: "Jamie Lin", cluster: "Drama / Romance" },
  { id: "u9", name: "Avery Zhao", cluster: "Drama / Romance" },
  { id: "u10", name: "Quinn Diaz", cluster: "Drama / Romance" },
];

export const TARGET_USER_ID = "u1";
export const TARGET_USER = USERS[0];

// Training ratings (55 active entries, ~53% density across 13 movies)
export const TRAIN_RATINGS: Rating[] = [
  // Cluster 1: Sci-Fi / Action
  // u1 (Alex Chen - Target User: 6 observed ratings)
  { userId: "u1", movieId: "m1", rating: 5 },
  { userId: "u1", movieId: "m2", rating: 5 },
  { userId: "u1", movieId: "m3", rating: 5 },
  { userId: "u1", movieId: "m5", rating: 4 },
  { userId: "u1", movieId: "m7", rating: 2 },
  { userId: "u1", movieId: "m9", rating: 3 },

  // u2
  { userId: "u2", movieId: "m1", rating: 5 },
  { userId: "u2", movieId: "m2", rating: 4 },
  { userId: "u2", movieId: "m4", rating: 5 },
  { userId: "u2", movieId: "m5", rating: 5 },
  { userId: "u2", movieId: "m6", rating: 4 },
  { userId: "u2", movieId: "m8", rating: 1 },
  { userId: "u2", movieId: "m13", rating: 3 },

  // u3
  { userId: "u3", movieId: "m1", rating: 4 },
  { userId: "u3", movieId: "m3", rating: 5 },
  { userId: "u3", movieId: "m4", rating: 4 },
  { userId: "u3", movieId: "m6", rating: 5 },
  { userId: "u3", movieId: "m10", rating: 2 },
  { userId: "u3", movieId: "m12", rating: 3 },

  // u4
  { userId: "u4", movieId: "m2", rating: 5 },
  { userId: "u4", movieId: "m3", rating: 4 },
  { userId: "u4", movieId: "m5", rating: 5 },
  { userId: "u4", movieId: "m6", rating: 4 },
  { userId: "u4", movieId: "m7", rating: 1 },
  { userId: "u4", movieId: "m9", rating: 2 },
  { userId: "u4", movieId: "m11", rating: 2 },

  // u5
  { userId: "u5", movieId: "m1", rating: 5 },
  { userId: "u5", movieId: "m2", rating: 4 },
  { userId: "u5", movieId: "m3", rating: 5 },
  { userId: "u5", movieId: "m4", rating: 5 },
  { userId: "u5", movieId: "m5", rating: 4 },
  { userId: "u5", movieId: "m6", rating: 5 },
  { userId: "u5", movieId: "m13", rating: 2 },

  // Cluster 2: Drama / Romance / Animation / Indie
  // u6
  { userId: "u6", movieId: "m1", rating: 2 },
  { userId: "u6", movieId: "m7", rating: 5 },
  { userId: "u6", movieId: "m8", rating: 5 },
  { userId: "u6", movieId: "m9", rating: 4 },
  { userId: "u6", movieId: "m10", rating: 5 },
  { userId: "u6", movieId: "m11", rating: 4 },
  { userId: "u6", movieId: "m12", rating: 4 },

  // u7
  { userId: "u7", movieId: "m3", rating: 2 },
  { userId: "u7", movieId: "m7", rating: 5 },
  { userId: "u7", movieId: "m8", rating: 4 },
  { userId: "u7", movieId: "m10", rating: 5 },
  { userId: "u7", movieId: "m11", rating: 5 },
  { userId: "u7", movieId: "m12", rating: 5 },
  { userId: "u7", movieId: "m13", rating: 4 },

  // u8
  { userId: "u8", movieId: "m2", rating: 1 },
  { userId: "u8", movieId: "m7", rating: 4 },
  { userId: "u8", movieId: "m8", rating: 5 },
  { userId: "u8", movieId: "m9", rating: 5 },
  { userId: "u8", movieId: "m10", rating: 4 },
  { userId: "u8", movieId: "m12", rating: 4 },
  { userId: "u8", movieId: "m13", rating: 5 },

  // u9
  { userId: "u9", movieId: "m5", rating: 2 },
  { userId: "u9", movieId: "m7", rating: 5 },
  { userId: "u9", movieId: "m8", rating: 4 },
  { userId: "u9", movieId: "m9", rating: 4 },
  { userId: "u9", movieId: "m11", rating: 5 },
  { userId: "u9", movieId: "m12", rating: 5 },
  { userId: "u9", movieId: "m13", rating: 4 },

  // u10
  { userId: "u10", movieId: "m4", rating: 2 },
  { userId: "u10", movieId: "m7", rating: 4 },
  { userId: "u10", movieId: "m8", rating: 5 },
  { userId: "u10", movieId: "m9", rating: 4 },
  { userId: "u10", movieId: "m10", rating: 5 },
  { userId: "u10", movieId: "m11", rating: 4 },
  { userId: "u10", movieId: "m12", rating: 5 },
  { userId: "u10", movieId: "m13", rating: 5 },
];

// Fixed held-out test split (14 ground-truth ratings, ~20% of ratings)
export const HELD_OUT_RATINGS: Rating[] = [
  // Target user ground truth hits (Alex loved m4 Blade Runner 2049 and m6 Dune)
  { userId: "u1", movieId: "m4", rating: 5 },
  { userId: "u1", movieId: "m6", rating: 5 },

  // Other cluster 1 held-out items
  { userId: "u2", movieId: "m3", rating: 5 },
  { userId: "u3", movieId: "m2", rating: 4 },
  { userId: "u4", movieId: "m1", rating: 5 },
  { userId: "u5", movieId: "m9", rating: 2 },
  { userId: "u2", movieId: "m10", rating: 2 },

  // Cluster 2 held-out items
  { userId: "u6", movieId: "m13", rating: 5 },
  { userId: "u7", movieId: "m9", rating: 4 },
  { userId: "u8", movieId: "m11", rating: 4 },
  { userId: "u9", movieId: "m10", rating: 4 },
  { userId: "u10", movieId: "m1", rating: 2 },
  { userId: "u6", movieId: "m2", rating: 1 },
  { userId: "u7", movieId: "m5", rating: 2 },
];

/**
 * Builds a user-item 2D rating matrix (rows: users, cols: movies).
 * Missing entries are represented as null.
 */
export function buildRatingsMatrix(
  users: User[] = USERS,
  movieIds: string[] = [
    "m1", "m2", "m3", "m4", "m5", "m6",
    "m7", "m8", "m9", "m10", "m11", "m12", "m13"
  ],
  ratings: Rating[] = TRAIN_RATINGS
): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: users.length }, () =>
    Array.from({ length: movieIds.length }, () => null)
  );

  const userMap = new Map(users.map((u, i) => [u.id, i]));
  const movieMap = new Map(movieIds.map((m, i) => [m, i]));

  for (const r of ratings) {
    const uIdx = userMap.get(r.userId);
    const mIdx = movieMap.get(r.movieId);
    if (uIdx !== undefined && mIdx !== undefined) {
      matrix[uIdx][mIdx] = r.rating;
    }
  }

  return matrix;
}
