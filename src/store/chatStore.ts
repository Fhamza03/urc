// src/store/chatStore.ts
import { create } from "zustand";

// Messages
export interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

// Salons / Chats
export interface Chat {
  id: number;
  name: string;
  messages: Message[];
}

// Utilisateurs
export interface User {
  id: number;
  username: string;
  last_login?: string;
}

interface ChatState {
  rooms: Chat[];
  selectedChat: Chat | null;
  users: User[];
  setRooms: (rooms: Chat[]) => void;
  selectChat: (chat: Chat) => void;
  sendMessage: (chatId: number, message: Message) => void;
  setUsers: (users: User[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  selectedChat: null,
  users: [],

  setRooms: (rooms: Chat[]) => set({ rooms }),
  selectChat: (chat: Chat) => set({ selectedChat: chat }),
  sendMessage: (chatId: number, message: Message) => {
    const rooms = get().rooms.map((room) =>
      room.id === chatId ? { ...room, messages: [...room.messages, message] } : room
    );
    set({ rooms });
  },
  setUsers: (users: User[]) => set({ users }),
}));
