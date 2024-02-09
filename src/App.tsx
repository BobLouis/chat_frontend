import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Chat } from "./components/Chat";
import { Login } from "./components/Login";
import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route path="" element={<Chat />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}