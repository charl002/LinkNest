import { Comment } from './comment';
export interface PostType {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: Comment[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  profilePicture: string;
  postType: 'posts' | 'bluesky' | 'news';
  likedBy: string[];
  sessionUsername: string;
}