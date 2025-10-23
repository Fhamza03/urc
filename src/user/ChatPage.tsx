import { Box } from "@mui/material";
import { UserList } from "../components/UserList";
import { ChatWindow } from "../components/ChatWindow";
import { Routes, Route } from "react-router-dom";

export default function ChatPage() {
  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f5f5f5" }}>
      <UserList /> {/* Liste des salons et utilisateurs */}
      <Routes>
        <Route path="room/:roomId" element={<ChatWindow />} />
        <Route path="user/:userId" element={<ChatWindow />} />
      </Routes>
    </Box>
  );
}
