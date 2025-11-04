import {
  Box,
  Paper,
  Typography,
  Divider,
  Avatar,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useChatStore, Chat, User, Message } from "../store/chatStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface RoomFromAPI {
  id: number;
  name: string;
  created_on: string;
  created_by: string;
  is_member?: boolean;
}

export function UserList() {
  const { rooms, setRooms, selectChat, users, setUsers, updateMessagesInChat } =
    useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    // 🔹 Fetch rooms
    fetch("/api/rooms", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject("Non autorisé")))
      .then((data) => {
        if (data && Array.isArray(data.rooms)) {
          setRooms(
            data.rooms.map((room: RoomFromAPI): Chat => ({
              id: room.id,
              name: room.name,
              messages: [],
              isMember: room.is_member ?? false,
            }))
          );
        }
      })
      .catch((err) => console.error("Erreur fetch rooms:", err));

    // 🔹 Fetch users
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject("Non autorisé")))
      .then((data: User[]) => setUsers(data))
      .catch((err) => console.error("Erreur fetch users:", err));
  }, [setRooms, setUsers]);

  const handleSelectUser = async (user: User) => {
    if (!user.id || !user.username) return;

    selectChat({ id: user.id, name: user.username, messages: [], isMember: true });
    navigate(`/chatPage/user/${user.id}`);

    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/message?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur récupération messages");
      const data = await res.json();
      updateMessagesInChat(user.id, data.messages || []);
    } catch (err) {
      console.error("Erreur handleSelectUser:", err);
    }
  };

  const handleJoinRoom = async (room: Chat) => {
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch("/api/joinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId: room.id }),
    });

    if (!res.ok) throw new Error("Erreur join room");

    const data = await res.json();

    // Si déjà membre ou nouvellement joint, on update localement
    if (data.status === "joined" || data.status === "already_member") {
      setRooms(
        rooms.map((r) => (r.id === room.id ? { ...r, isMember: true } : r))
      );

      selectChat({ ...room, isMember: true });
      navigate(`/chatPage/room/${room.id}`);

      const msgsRes = await fetch(`/api/roomMessages?roomId=${room.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgsRes.ok) {
        const messages: Message[] = await msgsRes.json();
        updateMessagesInChat(room.id, messages);
      }
    }
  } catch (err) {
    console.error("Erreur join room:", err);
  }
};


  const handleSelectRoom = async (room: Chat) => {
    selectChat(room);
    navigate(`/chatPage/room/${room.id}`);
    const token = sessionStorage.getItem("token");
    const res = await fetch(`/api/roomMessages?roomId=${room.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: Message[] = await res.json();
      updateMessagesInChat(room.id, data);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setRooms([]);
    setUsers([]);
    navigate("/");
  };

  // Générer une couleur aléatoire pour les avatars
  const getAvatarColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    const color = `hsl(${hash % 360}, 60%, 50%)`;
    return color;
  };

  return (
    <Paper
      sx={{
        width: 300,
        height: "100vh",
        overflowY: "auto",
        p: 2,
        bgcolor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontWeight: "bold" }}>
        Salons
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {rooms.map((room) => (
          <Card
            key={room.id}
            variant="outlined"
            sx={{
              display: "flex",
              flexDirection: "column",
              "&:hover": { boxShadow: 4, cursor: "pointer" },
            }}
          >
            <CardContent
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}
            >
              <Typography variant="body1" fontWeight={room.isMember ? "bold" : "normal"}>
                {room.name}
              </Typography>

              {!room.isMember ? (
                <Button size="small" variant="contained" onClick={() => handleJoinRoom(room)}>
                  Rejoindre
                </Button>
              ) : null}
            </CardContent>
            {room.isMember && (
              <CardActions>
                <Button size="small" onClick={() => handleSelectRoom(room)}>
                  Accéder
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontWeight: "bold" }}>
        Utilisateurs
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {users.map((user) => (
          <Card key={user.id} variant="outlined" sx={{ display: "flex", alignItems: "center", p: 1, "&:hover": { boxShadow: 4 } }}>
            <Avatar
              sx={{ bgcolor: getAvatarColor(user.username), width: 40, height: 40, mr: 1 }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }} onClick={() => handleSelectUser(user)}>
              <Typography variant="body1">{user.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user.last_login
                  ? `Dernière connexion : ${new Date(user.last_login).toLocaleString()}`
                  : "Jamais connecté"}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Button variant="outlined" color="error" onClick={handleLogout} sx={{ width: "100%", mt: "auto" }}>
        Déconnexion
      </Button>
    </Paper>
  );
}
