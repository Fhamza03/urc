import {
  Box,
  Typography,
  TextField,
  Paper,
  IconButton,
} from "@mui/material";
import { Image, Send } from "@mui/icons-material";
import { useChatStore, Chat, Message } from "../store/chatStore";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom"; 

export function MessageList() {
  const { selectedChat, updateMessagesInChat } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); 

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [selectedChat?.messages]);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch {
        console.error("Erreur parsing user session");
      }
    }
  }, []);

  if (!selectedChat || !currentUser) return null;

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !imageFile) return;

    try {
      const token = sessionStorage.getItem("token");
      let apiUrl: string;
      let body: any = {};

      const isRoom = location.pathname.startsWith("/chatPage/room/");
      if (isRoom) {
        apiUrl = "/api/roomMessages";
        body = { roomId: selectedChat.id, content: newMessage };
      } else {
        apiUrl = "/api/message";
        body = { receiverId: selectedChat.id, content: newMessage };
      }

      if (imageFile) {
        const base64 = await toBase64(imageFile);
        body.imageUrl = base64;
      }

      const temporaryMessage: Message = {
        id: Math.random().toString(),
        senderId: currentUser.id,
        content: newMessage || "",
        sent_at: new Date().toISOString(),
        sender_username: currentUser.username,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
      };

      updateMessagesInChat(selectedChat.id, [
        ...selectedChat.messages,
        temporaryMessage,
      ]);
      setNewMessage("");
      setImageFile(null);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur envoi message");

      const fetchUrl = isRoom
        ? `/api/roomMessages?roomId=${selectedChat.id}`
        : `/api/message?userId=${selectedChat.id}`;

      const fetchRes = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fetchRes.ok) {
        const fetchedData = await fetchRes.json();
        updateMessagesInChat(
          selectedChat.id,
          fetchedData.messages || fetchedData
        );
      }
    } catch (err) {
      console.error("Erreur handleSend:", err);
    }
  };

  return (
    <Paper
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f0f4f8",
        p: 2,
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }} ref={scrollRef}>
        {selectedChat.messages.map((msg: Message, index: number) => {
          const msgSenderId = parseInt(String(msg.senderId || msg.sender_id));
          const currentUserId = parseInt(currentUser.id, 10);
          const isMine = msgSenderId === currentUserId;
          const isRoom = location.pathname.startsWith("/chatPage/room/");

          return (
            <Box
              key={msg.id || index}
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
                  boxShadow: 1,
                }}
              >
                {!isMine && isRoom && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontWeight: "bold",
                      mb: 0.5,
                      color: "#333",
                    }}
                  >
                    {msg.sender_username || "Inconnu"}
                  </Typography>
                )}

                {msg.content && <Typography variant="body2">{msg.content}</Typography>}

                {msg.imageUrl && (
                  <Box
                    sx={{
                      mt: msg.content ? 1 : 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={msg.imageUrl}
                      alt=""
                      style={{ maxWidth: "180px", borderRadius: "8px", cursor: "pointer" }}
                    />
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "right", opacity: 0.8, mt: 0.5, fontSize: "0.65rem" }}
                >
                  {new Date(msg.sent_at || msg.timestamp || new Date().toISOString()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton color="primary" component="label">
          <Image />
          <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
        </IconButton>

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder={imageFile ? `Image sélectionnée: ${imageFile.name}` : "Écrire..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <IconButton color="primary" onClick={handleSend}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
}
