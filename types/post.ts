export interface PostType {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: { comment: string; username: string; date: string; likes: number, likedBy: string[] }[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  profilePicture: string;
  postType: 'posts' | 'bluesky' | 'news';
  likedBy: string[];
}