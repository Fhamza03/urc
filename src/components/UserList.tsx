import { List, ListItem, ListItemText, ListItemButton, Paper, Typography, Divider, Avatar, Box } from "@mui/material";
import { useChatStore } from "../store/chatStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function UserList() {
  const { rooms, setRooms, selectChat, selectedChat, users, setUsers } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    fetch("/api/rooms", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject("Non autorisé"))
      .then(data => setRooms(data.map((room: any) => ({ ...room, messages: [] }))))
      .catch(err => console.error("Erreur fetch rooms:", err));

    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject("Non autorisé"))
      .then(data => setUsers(data))
      .catch(err => console.error("Erreur fetch users:", err));
  }, [setRooms, setUsers]);

  return (
    <Paper sx={{ width: 280, height: "100%", overflowY: "auto", p: 2, bgcolor: "#fff", boxShadow: 3 }}>
      <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontWeight: "bold" }}>Salons</Typography>
      <List>
        {rooms.map(room => (
          <ListItem key={room.id} disablePadding>
            <ListItemButton
              selected={selectedChat?.id === room.id}
              onClick={() => {
                selectChat(room);
                navigate(`/chatPage/room/${room.id}`);
              }}
            >
              <ListItemText primary={room.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontWeight: "bold" }}>Utilisateurs</Typography>
      <List>
        {users.map(user => (
          <ListItem key={user.id} disablePadding>
            <ListItemButton
              onClick={() => {
                selectChat({ id: user.id, name: user.username, messages: [] });
                navigate(`/chatPage/user/${user.id}`);
              }}
            >
              <Avatar sx={{ mr: 1, bgcolor: "#1976d2", width: 32, height: 32 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body1">{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.last_login ? `Dernière connexion : ${new Date(user.last_login).toLocaleString()}` : "Jamais connecté"}
                </Typography>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
