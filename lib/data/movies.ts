/**
 * Curated movie catalog for Cinemetric simulator.
 * 14 items with rich overlapping metadata across genres, directors, cast, and keywords.
 * Movie #14 is an unrated new release flagged with `cold: true`.
 */

export interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  director: string;
  cast: [string, string, string];
  keywords: string[];
  cold?: boolean;
}

export const MOVIES: Movie[] = [
  {
    id: "m1",
    title: "Inception",
    year: 2010,
    genres: ["Sci-Fi", "Action", "Thriller"],
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    keywords: ["dream", "heist", "subconscious", "mind-bending"],
  },
  {
    id: "m2",
    title: "The Matrix",
    year: 1999,
    genres: ["Sci-Fi", "Action"],
    director: "Lana Wachowski",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
    keywords: ["simulation", "cyberpunk", "artificial intelligence", "rebellion"],
  },
  {
    id: "m3",
    title: "Interstellar",
    year: 2014,
    genres: ["Sci-Fi", "Drama"],
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    keywords: ["black hole", "space exploration", "relativity", "time travel", "wormhole"],
  },
  {
    id: "m4",
    title: "Blade Runner 2049",
    year: 2017,
    genres: ["Sci-Fi", "Drama", "Thriller"],
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
    keywords: ["dystopia", "replicant", "cyberpunk", "identity", "future"],
  },
  {
    id: "m5",
    title: "The Dark Knight",
    year: 2008,
    genres: ["Action", "Drama", "Thriller"],
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    keywords: ["vigilante", "chaos", "gotham", "moral dilemma", "hero"],
  },
  {
    id: "m6",
    title: "Dune",
    year: 2021,
    genres: ["Sci-Fi", "Action", "Drama"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Rebecca Ferguson", "Zendaya"],
    keywords: ["desert planet", "spice", "prophecy", "empire", "sandworm"],
  },
  {
    id: "m7",
    title: "La La Land",
    year: 2016,
    genres: ["Romance", "Drama"],
    director: "Damien Chazelle",
    cast: ["Ryan Gosling", "Emma Stone", "John Legend"],
    keywords: ["jazz", "hollywood", "nostalgia", "musical", "dreams"],
  },
  {
    id: "m8",
    title: "Past Lives",
    year: 2023,
    genres: ["Romance", "Drama"],
    director: "Celine Song",
    cast: ["Greta Lee", "Teo Yoo", "John Magaro"],
    keywords: ["childhood sweetheart", "destiny", "immigrant", "in-yun", "longing"],
  },
  {
    id: "m9",
    title: "Her",
    year: 2013,
    genres: ["Sci-Fi", "Romance", "Drama"],
    director: "Spike Jonze",
    cast: ["Joaquin Phoenix", "Scarlett Johansson", "Amy Adams"],
    keywords: ["artificial intelligence", "loneliness", "future", "virtual romance", "connection"],
  },
  {
    id: "m10",
    title: "Eternal Sunshine of the Spotless Mind",
    year: 2004,
    genres: ["Sci-Fi", "Romance", "Drama"],
    director: "Michel Gondry",
    cast: ["Jim Carrey", "Kate Winslet", "Kirsten Dunst"],
    keywords: ["memory erase", "heartbreak", "subconscious", "second chance"],
  },
  {
    id: "m11",
    title: "Your Name",
    year: 2016,
    genres: ["Animation", "Romance", "Drama"],
    director: "Makoto Shinkai",
    cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Ryo Narita"],
    keywords: ["body swap", "comet", "fate", "tokyo", "time slip"],
  },
  {
    id: "m12",
    title: "Spirited Away",
    year: 2001,
    genres: ["Animation", "Drama"],
    director: "Hayao Miyazaki",
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
    keywords: ["spirit world", "bathhouse", "courage", "witch", "magic"],
  },
  {
    id: "m13",
    title: "Whiplash",
    year: 2014,
    genres: ["Drama"],
    director: "Damien Chazelle",
    cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser"],
    keywords: ["jazz drumming", "obsession", "perfectionism", "mentorship", "ambition"],
  },
  {
    id: "m14",
    title: "Chronopolis",
    year: 2026,
    genres: ["Sci-Fi", "Action", "Thriller"],
    director: "Christopher Nolan",
    cast: ["Timothée Chalamet", "Jessica Chastain", "Keanu Reeves"],
    keywords: ["time dilation", "cyberpunk", "space exploration", "simulation", "black hole"],
    cold: true,
  },
];

export const COLD_MOVIE = MOVIES.find((m) => m.cold) ?? MOVIES[MOVIES.length - 1];
export const COLD_MOVIE_ID = COLD_MOVIE.id;
