import axios, { AxiosInstance } from "axios";
import React, { createContext, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserModel } from "../models/User";
import authHeader from "../services/AuthHeader";
import AuthService from "../services/AuthService";

const DefaultProps = {
    register: () => null,
    login: () => null,
    logout: () => null,
    authAxios: axios,
    user: null
};

export interface AuthProps {
    register: (username: string, password: string) => any;
    login: (username: string, password: string) => any;
    logout: () => void;
    authAxios: AxiosInstance;
    user: UserModel | null;
}

export const AuthContext = createContext<AuthProps>(DefaultProps);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => AuthService.getCurrentUser());


    async function register(username: string, password: string) {
        try {
            const data = await AuthService.register(username, password);
            setUser(data);
            navigate("/"); // Navigate to home or dashboard after successful registration
        } catch (error) {
            // Handle error (e.g., show error message)
        }
    }
    async function login(username: string, password: string) {
        try {
            const data = await AuthService.login(username, password);
            setUser(data);
            navigate("/"); // Navigate to home or dashboard after successful login
        } catch (error) {
            // Handle error (e.g., show error message)
        }
    }

    function logout() {
        AuthService.logout();
        setUser(null);
        navigate("/login");
    }

    // axios instance for making requests
    const authAxios = axios.create();

    // request interceptor for adding token
    authAxios.interceptors.request.use((config) => {
        // add token to request headers
        config.headers = authHeader();
        return config;
    });

    authAxios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response.status === 401) {
                logout();
            }
            return Promise.reject(error);
        }
    );

    return (
        <AuthContext.Provider value={{ user, login, logout, register, authAxios }}>
            {children}
        </AuthContext.Provider>
    );
};