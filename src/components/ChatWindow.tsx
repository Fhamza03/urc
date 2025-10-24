import { Paper, Typography } from "@mui/material";
import { useChatStore, ChatType } from "../store/chatStore";
import { MessageList } from "./MessageList";

export const ChatWindow: React.FC = () => {
  const { selectedChat } = useChatStore();

  if (!selectedChat) {
    return (
      <Paper sx={{ flex: 1, p: 3, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#e0e0e0" }}>
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un salon ou un utilisateur pour commencer à discuter 💬
        </Typography>
      </Paper>
    );
  }

  // Déterminer le nom à afficher
  const chatName = "name" in selectedChat ? selectedChat.name : selectedChat.username;

  return (
    <Paper sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f0f4f8" }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: "1px solid #ccc", fontWeight: "bold" }}>
        {chatName}
      </Typography>
      <MessageList />
    </Paper>
  );
};
