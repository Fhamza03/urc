import {
  Box,
  Paper,
  Typography,
  Divider,
  Avatar,
  Button,
  List,
  ListItem, 
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import { useChatStore, Chat, User, Message } from "../store/chatStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

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
  const theme = useTheme();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

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

  const getAvatarColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    const color = `hsl(${hash % 360}, 60%, 50%)`;
    return color;
  };

  return (
    <Paper
      sx={{
        width: { xs: '100%', sm: 320 }, 
        height: "100%", 
        minHeight: "100vh",
        overflowY: "auto",
        p: 0, 
        bgcolor: theme.palette.background.paper, 
        display: "flex",
        flexDirection: "column",
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center' }}>
          <ChatBubbleOutlineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
              Chat App
          </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ p: '10px 16px', textTransform: 'uppercase', fontWeight: 600 }}
          >
              Utilisateurs ({users.length})
          </Typography>
          <List disablePadding>
              {users.map((user) => (
                  <ListItem
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      disablePadding
                      sx={{
                          cursor: 'pointer',
                          p: 1,
                          '&:hover': {
                              bgcolor: theme.palette.action.hover,
                          },
                          transition: 'background-color 0.2s',
                          borderLeft: `3px solid transparent`, // Laisse de l'espace pour l'indicateur actif
                          // Ajouter une classe si c'est l'utilisateur actif
                          // '&.Mui-selected': { bgcolor: theme.palette.primary.light + '20', borderLeftColor: theme.palette.primary.main },
                      }}
                  >
                      <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getAvatarColor(user.username), width: 44, height: 44 }}>
                              {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                          primary={
                              <Typography variant="body1" fontWeight={500}>
                                  {user.username}
                              </Typography>
                          }
                          secondary={
                              user.last_login
                                  ? `Dernière connexion : ${new Date(user.last_login).toLocaleTimeString()}`
                                  : "Jamais connecté"
                          }
                          secondaryTypographyProps={{ 
                              noWrap: true, 
                              sx: { fontSize: '0.75rem' } 
                          }}
                      />
                  </ListItem>
              ))}
          </List>

          <Divider sx={{ my: 1 }} />

          <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ p: '10px 16px', textTransform: 'uppercase', fontWeight: 600 }}
          >
              Salons de discussion ({rooms.length})
          </Typography>
          <List disablePadding>
              {rooms.map((room) => (
                  <ListItem
                      key={room.id}
                      disablePadding
                      sx={{
                          p: 1,
                          '&:hover': {
                              bgcolor: theme.palette.action.hover,
                          },
                          transition: 'background-color 0.2s',
                      }}
                  >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                          <GroupOutlinedIcon color={room.isMember ? "primary" : "action"} />
                      </ListItemIcon>
                      <ListItemText
                          primary={
                              <Typography variant="body1" fontWeight={room.isMember ? 600 : 500}>
                                  {room.name}
                              </Typography>
                          }
                          secondary={room.isMember ? "Membre" : "Non-membre"}
                      />

                      <Box sx={{ flexShrink: 0 }}>
                          {!room.isMember ? (
                              <Button 
                                  size="small" 
                                  variant="contained" 
                                  onClick={() => handleJoinRoom(room)}
                                  sx={{ 
                                      whiteSpace: 'nowrap', 
                                      bgcolor: theme.palette.success.main,
                                      '&:hover': { bgcolor: theme.palette.success.dark } 
                                  }}
                              >
                                  Rejoindre
                              </Button>
                          ) : (
                              <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleSelectRoom(room)}
                                  startIcon={<MeetingRoomOutlinedIcon />}
                              >
                                  Accéder
                              </Button>
                          )}
                      </Box>
                  </ListItem>
              ))}
          </List>
      </Box>

      <Divider sx={{ mt: 1 }} />
      <Box sx={{ p: 2, flexShrink: 0 }}>
          <Button 
              variant="contained"
              color="error" 
              onClick={handleLogout} 
              fullWidth
              startIcon={<LogoutIcon />}
          >
              Déconnexion
          </Button>
      </Box>
    </Paper>
  );
}