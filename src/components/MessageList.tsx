import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useChatStore } from "../store/chatStore";
import { useState, useRef, useEffect } from "react";

export function MessageList() {
  const { selectedChat, sendMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [selectedChat?.messages]);

  if (!selectedChat) return null;

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(selectedChat.id, {
      id: Date.now(),
      sender: "Moi",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setNewMessage("");
  };

  return (
    <Paper sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f0f4f8", p: 2 }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }} ref={scrollRef}>
        {selectedChat.messages.map(msg => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              justifyContent: msg.sender === "Moi" ? "flex-end" : "flex-start",
              mb: 1,
            }}
          >
            <Box
              sx={{
                maxWidth: "70%",
                p: 1.5,
                borderRadius: 2,
                bgcolor: msg.sender === "Moi" ? "#1976d2" : "#e0e0e0",
                color: msg.sender === "Moi" ? "#fff" : "#000",
                wordBreak: "break-word",
              }}
            >
              <Typography variant="body2">{msg.content}</Typography>
              <Typography variant="caption" sx={{ display: "block", textAlign: "right" }}>
                {msg.timestamp}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          Envoyer
        </Button>
      </Box>
    </Paper>
  );
}
