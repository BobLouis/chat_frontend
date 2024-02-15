import React, { useState, useContext } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import { MessageModel } from "../models/Message";
import { Message } from "./Message";
export function Chat() {
    const { conversationName } = useParams();
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [message, setMessage] = useState("");

    const [messageHistory, setMessageHistory] = useState<any>([]);
    const { user } = useContext(AuthContext);
    const webSocketUrl = user ? `ws://127.0.0.1:8000/chat/${conversationName}/?token=${user.token}` : null;
    const { readyState } = useWebSocket(webSocketUrl, {
        // queryParams: {
        //     token: user ? user.token : "",
        // },
        onOpen: () => {
            console.log("Connected!");
        },
        onClose: () => {
            console.log("Disconnected!");
        },
        onMessage: (e) => {
            const data = JSON.parse(e.data);
            switch (data.type) {
                case "welcome_message":
                    setWelcomeMessage(data.message);
                    break;
                case 'chat_message_echo':
                    setMessageHistory((prev: any) => prev.concat(data.message));
                    break;
                case "last_50_messages":
                    setMessageHistory(data.messages);
                    break;
                default:
                    console.error("Unknown message type!");
                    break;
            }
        }
    });
    function handleChangeMessage(e: any) {
        setMessage(e.target.value);
    }


    function handleSubmit() {
        sendJsonMessage({
            type: "chat_message",
            message,
        });

        setMessage("");
    }



    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated"
    }[readyState];
    const { sendJsonMessage } = useWebSocket(webSocketUrl, {
        queryParams: {
            token: user ? user.token : "",
        }
    })

    return (
        <div>
            <span>The WebSocket is currently {connectionStatus}</span>
            {/* Display the welcome message */}
            {welcomeMessage && <p>{welcomeMessage}</p>}

            <button
                className="bg-gray-300 px-3 py-1"
                onClick={() => {
                    sendJsonMessage({
                        type: "greeting",
                        message: "Hi!"
                    });
                }}
            >
                Say Hi
            </button>

            <input
                name="message"
                placeholder='Message'
                onChange={handleChangeMessage}
                value={message}
                className="ml-2 shadow-sm sm:text-sm border-gray-300 bg-gray-100 rounded-md" />
            <button className='ml-3 bg-gray-300 px-3 py-1' onClick={handleSubmit}>
                Submit
            </button>
            <hr />

            <ul className="mt-3 flex flex-col-reverse relative w-full border border-gray-200 overflow-y-auto p-6">
                {messageHistory.map((message: MessageModel) => (
                    <Message key={message.id} message={message} />
                ))}
            </ul>

        </div>
    );
}
