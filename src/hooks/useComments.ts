import { useState, useCallback } from 'react';
import type { RedditComment } from '../services/redditService';

// Interface for tracking seen comment IDs by post permalink
interface SeenComments {
  [postPermalink: string]: {
    commentIds: string[];
    lastFetchTime: number;
  };
}

export const useComments = () => {
  // Initialize seenComments from localStorage if available
  const [seenComments, setSeenComments] = useState<SeenComments>(() => {
    const savedSeenComments = localStorage.getItem('seenComments');
    return savedSeenComments ? JSON.parse(savedSeenComments) : {};
  });

  // Helper function to recursively mark new comments by comparing with seen comments
  const markNewComments = useCallback(
    (comments: RedditComment[], postPermalink: string): RedditComment[] => {
      if (!comments || !Array.isArray(comments)) return [];

      // Check if this is the first time we're seeing this thread
      const isFirstTimeSeenThread = !seenComments[postPermalink];
      const postSeenComments = seenComments[postPermalink]?.commentIds || [];

      return comments.map((comment) => {
        // Only mark as new if:
        // 1. This is NOT the first time we're seeing this thread AND
        // 2. This comment ID hasn't been seen before
        const isNew =
          !isFirstTimeSeenThread && !postSeenComments.includes(comment.id);

        // Recursively process replies
        const processedReplies = comment.replies
          ? markNewComments(comment.replies, postPermalink)
          : [];

        return {
          ...comment,
          isNew,
          replies: processedReplies,
        };
      });
    },
    [seenComments]
  );

  // Function to collect all comment IDs from a post
  const collectCommentIds = useCallback((comments: RedditComment[]): string[] => {
    const ids: string[] = [];

    const processComment = (comment: RedditComment) => {
      if (!ids.includes(comment.id)) {
        ids.push(comment.id);
      }

      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(processComment);
      }
    };

    comments.forEach(processComment);
    return ids;
  }, []);

  // Helper function to check if a comment thread has any new comments
  const checkForNewComments = useCallback(
    (comments: RedditComment[]): boolean => {
      if (!comments || !Array.isArray(comments)) return false;

      for (const comment of comments) {
        if (comment.isNew) return true;

        if (comment.replies && comment.replies.length > 0) {
          const hasNewReplies = checkForNewComments(comment.replies);
          if (hasNewReplies) return true;
        }
      }

      return false;
    },
    []
  );

  // Function to update the seen comments for a post
  const updateSeenComments = useCallback((postPermalink: string, commentIds: string[]) => {
    setSeenComments((prev) => {
      const updated = {
        ...prev,
        [postPermalink]: {
          commentIds,
          lastFetchTime: Date.now(),
        },
      };
      
      // Save to localStorage
      localStorage.setItem('seenComments', JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Function to mark all comments for a post as seen
  const markAllCommentsAsSeen = useCallback((postPermalink: string, comments: RedditComment[]) => {
    const allCommentIds = collectCommentIds(comments);
    updateSeenComments(postPermalink, allCommentIds);
  }, [collectCommentIds, updateSeenComments]);

  // Count new comments in a thread
  const countNewComments = useCallback((comments: RedditComment[]): number => {
    if (!comments || !Array.isArray(comments)) return 0;
    
    let count = 0;
    
    const countNew = (commentList: RedditComment[]) => {
      if (!commentList) return;
      
      for (const comment of commentList) {
        if (comment.isNew) count++;
        if (comment.replies && comment.replies.length > 0) {
          countNew(comment.replies);
        }
      }
    };
    
    countNew(comments);
    return count;
  }, []);

  return {
    seenComments,
    markNewComments,
    collectCommentIds,
    checkForNewComments,
    updateSeenComments,
    markAllCommentsAsSeen,
    countNewComments
  };
}; 