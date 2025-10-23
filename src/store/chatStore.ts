// src/store/chatStore.ts
import { create } from "zustand";

// Messages
export interface Message {
  senderId: number | "me";
  receiverId?: number;
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
  updateMessagesInChat: (chatId: number, messages: Message[]) => void;
  setUsers: (users: User[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  selectedChat: null,
  users: [],

  setRooms: (rooms) => set({ rooms }),

  selectChat: (chat) => {
    if (chat.id != null && chat.name) {
      set({ selectedChat: chat });
    }
  },

  updateMessagesInChat: (chatId, messages) => {
    const rooms = get().rooms.map((room) =>
      room.id === chatId ? { ...room, messages } : room
    );

    const users = get().users.map((user) =>
      user.id === chatId ? { ...user, messages } : user
    );

    const selectedChat = get().selectedChat?.id === chatId
      ? { ...get().selectedChat!, messages }
      : get().selectedChat;

    set({ rooms, users, selectedChat });
  },

  setUsers: (users) => set({ users }),
}));
