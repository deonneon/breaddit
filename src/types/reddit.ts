export interface RedditPost {
  title: string;
  url: string;
  author: string;
  score: number;
  created_utc: number;
  num_comments: number;
  subreddit: string;
  selftext?: string;
}

export interface SubredditData {
  name: string;
  displayName: string;
  subscribers?: number;
}
