import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useChatStore } from "../store/chatStore";
import { useState, useRef, useEffect } from "react";

export function MessageList() {
  const { selectedChat, updateMessagesInChat } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charger l'utilisateur connecté depuis sessionStorage
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch {
        console.error("Erreur parsing user session");
      }
    }
  }, []);

  // Auto-scroll quand de nouveaux messages arrivent
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [selectedChat?.messages]);

  if (!selectedChat || !currentUser) return null;

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = sessionStorage.getItem("token");

      // Envoi du message
      const res = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedChat.id,
          content: newMessage,
        }),
      });

      if (!res.ok) throw new Error("Erreur envoi message");
      const data = await res.json();

      // Ajouter le message localement
      const updatedMessages = [
        ...selectedChat.messages,
        { ...data.message, senderId: currentUser.id },
      ];
      updateMessagesInChat(selectedChat.id, updatedMessages);

      setNewMessage("");

      // Re-fetch messages du serveur après envoi (optionnel)
      const fetchRes = await fetch(`/api/message?userId=${selectedChat.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fetchRes.ok) {
        const fetchedData = await fetchRes.json();
        updateMessagesInChat(selectedChat.id, fetchedData.messages);
      }

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Paper sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f0f4f8", p: 2 }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }} ref={scrollRef}>
        {selectedChat.messages.map((msg, index) => {
          const isMine = msg.senderId === currentUser.id;

          return (
            <Box
              key={msg.timestamp + msg.senderId + index}
              sx={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: "70%",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isMine ? "#1976d2" : "#e0e0e0",
                  color: isMine ? "#fff" : "#000",
                  wordBreak: "break-word",
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "right" }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          Envoyer
        </Button>
      </Box>
    </Paper>
  );
}
