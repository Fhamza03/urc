import { Box } from "@mui/material";
import { UserList } from "../components/UserList";
import { ChatWindow } from "../components/ChatWindow";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Client as PusherPushNotifications, TokenProvider } from "@pusher/push-notifications-web";

export default function ChatPage() {
  useEffect(() => {
    const initPush = async () => {
      const permission = await window.Notification.requestPermission();
      if (permission !== "granted") return;

      const userData = sessionStorage.getItem("user");
      if (!userData) return;
      const user = JSON.parse(userData);

      const beamsClient = new PusherPushNotifications({
        instanceId: process.env.REACT_APP_PUSHER_INSTANCE_ID!,
      });

      const tokenProvider = new TokenProvider({
        url: "/api/beams",
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });

      try {
        await beamsClient.start();
        await beamsClient.addDeviceInterest("global");
        await beamsClient.setUserId(user.externalId, tokenProvider);
        const deviceId = await beamsClient.getDeviceId();
        console.log("Push deviceId:", deviceId);
      } catch (err) {
        console.error("Erreur Pusher Beams:", err);
      }
    };

    initPush();
  }, []);

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f5f5f5" }}>
      <UserList />
      <Routes>
        <Route path="room/:roomId" element={<ChatWindow />} />
        <Route path="user/:userId" element={<ChatWindow />} />
      </Routes>
    </Box>
  );
}
