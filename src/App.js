import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import {Login} from "./user/Login";
import Chat from './user/Chat';
import { Register } from './user/Register';

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
      
    </>
  );
}

export default App;
