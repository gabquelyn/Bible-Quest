
export const MIN_POST_LENGTH = 30;
export const MAX_POST_LENGTH = 500;

const key = (username: string) => `bible-quest:posts:${username}`;

export function loadPosts(username: string): PostsByDate {
  try {
    const raw = localStorage.getItem(key(username));
    return raw ? (JSON.parse(raw) as PostsByDate) : {};
  } catch {
    return {};
  }
}

export function savePosts(username: string, posts: PostsByDate) {
  try {
    localStorage.setItem(key(username), JSON.stringify(posts));
  } catch {
    /* storage unavailable, keep working in memory */
  }
}