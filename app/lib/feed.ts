

const asObject = (v: RawAuthor | string | null | undefined): RawAuthor | undefined =>
  v && typeof v === "object" ? v : undefined;

const asId = (v: RawAuthor | string | null | undefined): string | undefined =>
  typeof v === "string" ? v : undefined;

/** The author of a post: id and username identify them, and the THEME comes from the user. */
export function getAuthor(raw: RawPost): FeedAuthor {
  const populated = asObject(raw.user) ?? asObject(raw.userId);
  return {
    id: populated?.id ?? populated?._id ?? asId(raw.user) ?? asId(raw.userId),
    username: populated?.username ?? raw.username,
    theme: populated?.theme,
  };
}

export function toPost(raw: RawPost): FeedPost {
  const author = getAuthor(raw);
  return {
    id: raw.id ?? raw._id ?? `${author.id ?? author.username ?? "post"}-${raw.createdAt}`,
    content: raw.content,
    createdAt: raw.createdAt,
    passage: raw.passage,
    author,
  };
}

/**
 * A post is the signed-in user's own when its author's id OR username equals theirs.
 * Each side is only compared when both values exist, so two missing ids never "match".
 */
export function isOwnPost(post: FeedPost, me: { id?: string; username?: string } | null | undefined): boolean {
  if (!me) return false;
  const sameId = !!post.author.id && !!me.id && post.author.id === me.id;
  const sameName = !!post.author.username && !!me.username && post.author.username === me.username;
  return sameId || sameName;
}

const time = (iso: string) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Turns an API response into posts sorted oldest first, which is how a chat reads. */
export function parsePage(data: RawPage | RawPost[]): { posts: FeedPost[]; nextCursor: string | null } {
  const list = Array.isArray(data) ? data : data.posts;
  const nextCursor = Array.isArray(data) ? null : (data.nextCursor ?? null);
  return {
    posts: list.map(toPost).sort((a, b) => time(a.createdAt) - time(b.createdAt)),
    nextCursor,
  };
}