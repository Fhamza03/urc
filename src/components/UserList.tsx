import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Typography,
  Divider,
  Avatar,
  Box,
  Button,
} from "@mui/material";
import { useChatStore, Chat } from "../store/chatStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function UserList() {
  const {
    rooms,
    setRooms,
    selectChat,
    users,
    setUsers,
    updateMessagesInChat,
  } = useChatStore();

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    // Fetch rooms (avec is_member)
    fetch("/api/rooms", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject("Non autorisé")))
      .then((data) =>
        setRooms(
          data.map((room: any) => ({
            ...room,
            messages: [],
            isMember: room.is_member || false,
          }))
        )
      )
      .catch((err) => console.error("Erreur fetch rooms:", err));

    // Fetch utilisateurs
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject("Non autorisé")))
      .then((data) => setUsers(data))
      .catch((err) => console.error("Erreur fetch users:", err));
  }, [setRooms, setUsers]);

  const handleSelectUser = async (user: any) => {
    if (!user.id || !user.username) return;

    const userChat: Chat = {
      id: user.id,
      name: user.username,
      messages: [],
      isMember: true,
    };
    selectChat(userChat);
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

  const handleJoinRoom = async (room: any) => {
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

      if (!res.ok && res.status !== 200) throw new Error("Erreur join room");

      // Mise à jour du store
      setRooms(
        rooms.map((r) => (r.id === room.id ? { ...r, isMember: true } : r))
      );

      selectChat({ ...room, isMember: true });
      navigate(`/chatPage/room/${room.id}`);

      // Fetch messages après avoir rejoint
      const msgsRes = await fetch(`/api/roomMessages?roomId=${room.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgsRes.ok) {
        const data = await msgsRes.json();
        updateMessagesInChat(room.id, data);
      }
    } catch (err) {
      console.error("Erreur join room:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");  
    sessionStorage.removeItem("externalId");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("username");
    setRooms([]);
    setUsers([]);
    navigate("/");
  };

  return (
    <Paper
      sx={{
        width: 280,
        height: "100vh",
        overflowY: "auto",
        p: 2,
        bgcolor: "#fff",
        boxShadow: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h6"
        textAlign="center"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Salons
      </Typography>

      <List sx={{ flexGrow: 1 }}>
        {rooms.map((room) => (
          <ListItem key={room.id} disablePadding>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
              <ListItemButton
                sx={{ flex: 1 }}
                disabled={!room.isMember}
                onClick={async () => {
                  if (!room.isMember) return;

                  selectChat(room);
                  navigate(`/chatPage/room/${room.id}`);

                  const token = sessionStorage.getItem("token");
                  const res = await fetch(`/api/roomMessages?roomId=${room.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    const data = await res.json();
                    updateMessagesInChat(room.id, data);
                  }
                }}
              >
                <ListItemText
                  primary={room.name}
                  secondary={!room.isMember ? "Non membre" : null}
                  sx={{
                    opacity: room.isMember ? 1 : 0.6,
                    "& .MuiListItemText-primary": {
                      fontWeight: room.isMember ? "bold" : "normal",
                    },
                  }}
                />
              </ListItemButton>

              {!room.isMember && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleJoinRoom(room)}
                >
                  Rejoindre
                </Button>
              )}
            </Box>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="h6"
        textAlign="center"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Utilisateurs
      </Typography>

      <List sx={{ flexGrow: 1 }}>
        {users.map((user) => (
          <ListItem key={user.id} disablePadding>
            <ListItemButton onClick={() => handleSelectUser(user)}>
              <Avatar sx={{ mr: 1, bgcolor: "#1976d2", width: 32, height: 32 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body1">{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.last_login
                    ? `Dernière connexion : ${new Date(
                        user.last_login
                      ).toLocaleString()}`
                    : "Jamais connecté"}
                </Typography>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Bouton de déconnexion */}
      <Box sx={{ textAlign: "center", mt: "auto" }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{ width: "100%" }}
        >
          Déconnexion
        </Button>
      </Box>
    </Paper>
  );
}
