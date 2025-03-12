export interface Message {
  id: string,
  sender: string;
  message: string;
  date: string;
  reactions?: { user: string; reaction: string }[];
}