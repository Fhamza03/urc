// Fichier : src/components/MessageList.tsx

import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useChatStore, Chat, Message } from "../store/chatStore";
import { useState, useRef, useEffect } from "react";

export function MessageList() {
  const { selectedChat, updateMessagesInChat } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isRoom = (chat: any): chat is Chat => chat && "messages" in chat;

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

  useEffect(() => {
    // Fait défiler vers le bas à chaque fois que la liste des messages change
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
      let apiUrl: string;
      let body: any;

      if (isRoom(selectedChat)) {
        apiUrl = "/api/roomMessages";
        body = { roomId: selectedChat.id, content: newMessage };
      } else {
        apiUrl = "/api/message";
        body = { receiverId: selectedChat.id, content: newMessage };
      }

      // 1. Ajout du message localement (pour une réponse utilisateur instantanée)
      const temporaryMessage: Message = {
        id: Math.random().toString(), 
        senderId: currentUser.id, 
        content: newMessage,
        sent_at: new Date().toISOString(),
        sender_username: currentUser.username, 
      };

      // Met à jour le store avec le message temporaire
      updateMessagesInChat(selectedChat.id, [...selectedChat.messages, temporaryMessage]);
      setNewMessage("");

      // 2. Envoi au serveur
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur envoi message");

      // 3. Re-fetch les messages pour la synchronisation (incluant le nouveau message avec son ID serveur)
      const fetchUrl = isRoom(selectedChat)
        ? `/api/roomMessages?roomId=${selectedChat.id}`
        : `/api/message?userId=${selectedChat.id}`;

      const fetchRes = await fetch(fetchUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (fetchRes.ok) {
        const fetchedData = await fetchRes.json();
        // Remplace les messages temporaires par la liste fraîche du serveur
        updateMessagesInChat(selectedChat.id, fetchedData.messages || fetchedData); 
      }
    } catch (err) {
      console.error(err);
      // OPTIONNEL: En cas d'échec, vous pourriez vouloir retirer le message temporaire.
    }
  };

  return (
    <Paper sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f0f4f8", p: 2 }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }} ref={scrollRef}>
        {selectedChat.messages.map((msg: Message, index: number) => {
          
          let msgSenderIdRaw = msg.senderId || msg.sender_id; 
          
          if (msgSenderIdRaw === "me") {
            msgSenderIdRaw = currentUser.id;
          } else if (msgSenderIdRaw === undefined || msgSenderIdRaw === null) {
            msgSenderIdRaw = 0; 
          }
          
          const currentUserId = parseInt(currentUser.id, 10);
          const msgSenderId = parseInt(String(msgSenderIdRaw), 10); 
          
          const isMine = msgSenderId === currentUserId;

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
                {!isMine && isRoom(selectedChat) && (
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 'bold', mb: 0.5, color: '#333' }}>
                    {msg.sender_username || "Inconnu"} 
                  </Typography>
                )}
                
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" sx={{ display: "block", textAlign: "right", opacity: 0.8, mt: 0.5, fontSize: '0.65rem' }}>
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