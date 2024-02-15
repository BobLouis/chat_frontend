import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Chat } from "./components/Chat";
import { Register } from "./components/Register";
import { Login } from "./components/Login";
import { Navbar } from "./components/Navbar";
import { Conversations } from "./components/Conversations";
import { AuthContextProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ActiveConversations } from "./components/ActiveConversation";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AuthContextProvider>
              <Navbar />
            </AuthContextProvider>
          }
        >
          <Route
            path=""
            element={
              <ProtectedRoute>
                <Conversations />
              </ProtectedRoute>
            }
          />
          <Route
            path="chats/:conversationName"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="conversations/"
            element={
              <ProtectedRoute>
                <ActiveConversations />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="chats/"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          /> */}
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}