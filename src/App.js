import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./user/Login";
import ChatPage from "./user/ChatPage";
import { Register } from "./user/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chatPage/*" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
