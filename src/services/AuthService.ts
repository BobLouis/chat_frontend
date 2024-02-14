import axios from "axios";

import { UserModel } from "../models/User";

class AuthService {
    setUserInLocalStorage(data: UserModel) {
        localStorage.setItem("user", JSON.stringify(data));
    }

    async register(username: string, password: string): Promise<UserModel> {
        try {
            const response = await axios.post("http://127.0.0.1:8000/user/register/", { username, password });
            const data: UserModel = response.data;
            this.setUserInLocalStorage(data);
            return data;
        } catch (error) {
            // Handle error (e.g., username already exists)
            return Promise.reject(error);
        }
    }

    async login(username: string, password: string): Promise<UserModel> {
        try {
            const response = await axios.post("http://127.0.0.1:8000/user/login/", { username, password });
            const data: UserModel = response.data;
            this.setUserInLocalStorage(data);
            return data;
        } catch (error) {
            // Handle invalid credentials error
            return Promise.reject(error);
        }
    }

    logout() {
        localStorage.removeItem("user");
    }

    getCurrentUser() {
        const user = localStorage.getItem("user")!;
        return JSON.parse(user);
    }
}

export default new AuthService();