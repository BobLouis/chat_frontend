import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

interface UserResponse {
    username: string;
    name: string;
    url: string;
}

export function Conversations() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState<UserResponse[]>([]); //fetch all users

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch("http://127.0.0.1:8000/user/all/", {
                    headers: {
                        Authorization: `token ${user?.token}` // Ensure this matches the expected format
                    }
                });
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.error('Fetch error:', error);
            }
        }

        if (user) {
            fetchUsers();
        }
    }, [user]);

    function createConversationName(username: string) {
        const namesAlph = [user?.username, username].sort();
        return `${namesAlph[0]}__${namesAlph[1]}`;
    }

    return (
        <div>
            {users
                .filter((u: UserResponse) => u.username !== user?.username)
                .map((u: UserResponse) => (
                    <Link key={u.username} to={`chats/${createConversationName(u.username)}`}>
                        <div>{u.username}</div>
                    </Link>
                ))}
        </div>
    );
}
