export interface Comment {
  comment: string; 
  username: string; 
  date: string; 
  likes: number;
  likedBy: string[];
  profilePicture?: string;
}