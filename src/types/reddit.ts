export interface RedditPost {
  title: string;
  url: string;
  author: string;
  score: number;
  created_utc: number;
  num_comments: number;
  subreddit: string;
  selftext?: string;
  isNewlyFetched?: boolean; // Flag to indicate if the post was newly fetched or loaded from cache
}

export interface SubredditData {
  name: string;
  displayName: string;
  subscribers?: number;
}
