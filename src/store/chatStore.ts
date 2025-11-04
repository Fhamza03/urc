import { create } from "zustand";

export interface Message {
  id?: number | string; 
  senderId?: number | string; 
  sender_id?: number | string; 
  receiverId?: number; 
  room_id?: number; 
  content: string;
  imageUrl?: string; 
  sent_at?: string; 
  timestamp?: string; 
  sender_username?: string; 
}

export interface Chat {
  id: number;
  name: string;
  messages: Message[];
  isMember: boolean; 
}

export interface User {
  id: number;
  username: string;
  last_login?: string;
  messages?: Message[];
}

export type ChatType = Chat | (User & { messages: Message[] });

interface ChatState {
  rooms: Chat[];
  users: User[];
  selectedChat: ChatType | null;
  setRooms: (rooms: Chat[]) => void;
  setUsers: (users: User[]) => void;
  selectChat: (chat: ChatType) => void;
  updateMessagesInChat: (chatId: number, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  users: [],
  selectedChat: null,

  setRooms: (rooms) => set({ rooms }),
  setUsers: (users) => set({ users }),

  selectChat: (chat) => {
    if (chat.id != null) set({ selectedChat: chat });
  },

  updateMessagesInChat: (chatId, messages) => {
    const rooms = get().rooms.map((room) =>
      room.id === chatId ? { ...room, messages } : room
    );
    const users = get().users.map((user) =>
      user.id === chatId ? { ...user, messages } : user
    );

    const selectedChat =
      get().selectedChat?.id === chatId
        ? { ...get().selectedChat!, messages }
        : get().selectedChat;

    set({ rooms, users, selectedChat });
  },
}));
