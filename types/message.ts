export interface Message {
  id: string,
  sender: string;
  message: string;
  date: string;
  isCallMsg: boolean;
  reactions?: { user: string; reaction: string }[];
  groupId?: string;
}