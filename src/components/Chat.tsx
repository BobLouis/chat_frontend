import React, { useState, useContext, useEffect, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import { MessageModel } from "../models/Message";
import { ConversationModel } from "../models/Conversation";
import { Message } from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";
import { ChatLoader } from "./ChatLoader";
import { useHotkeys } from "react-hotkeys-hook";

export function Chat() {
    const { conversationName } = useParams();
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [message, setMessage] = useState("");

    const [messageHistory, setMessageHistory] = useState<any>([]);
    const { user } = useContext(AuthContext);

    const [page, setPage] = useState(2);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);

    const [participants, setParticipants] = useState<string[]>([]);
    const [conversation, setConversation] = useState<ConversationModel | null>(null);

    const [meTyping, setMeTyping] = useState(false);
    const [typing, setTyping] = useState(false);

    const timeout = useRef<any>();
    const inputReference = useRef<HTMLInputElement>(null);

    function timeoutFunction() {
        setMeTyping(false);
        sendJsonMessage({ type: "typing", typing: false });
    }

    function updateTyping(event: { user: string; typing: boolean }) {
        if (event.user !== user!.username) {
            setTyping(event.typing);
        }
    }

    function onType() {
        if (meTyping === false) {
            setMeTyping(true);
            sendJsonMessage({ type: "typing", typing: true });
            timeout.current = setTimeout(timeoutFunction, 5000);
        } else {
            clearTimeout(timeout.current);
            timeout.current = setTimeout(timeoutFunction, 5000);
        }
    }

    useEffect(() => () => clearTimeout(timeout.current), []);






    useEffect(() => {
        async function fetchConversation() {
            const apiRes = await fetch(`http://127.0.0.1:8000/chats/conversations/${conversationName}/`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `token ${user?.token}`
                }
            });
            if (apiRes.status === 200) {
                const data: ConversationModel = await apiRes.json();
                setConversation(data);
            }
        }
        fetchConversation();
    }, [conversationName, user]);

    useEffect(() => {
        (inputReference.current as HTMLElement).focus();
    }, [inputReference]);

    useHotkeys(
        "enter",
        () => {
            handleSubmit();
        },
        [],
        [inputReference] // Dependency array
    );



    async function fetchMessages() {
        const apiRes = await fetch(
            `http://127.0.0.1:8000/chats/messages/?conversation=${conversationName}&page=${page}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `token ${user?.token}`
                }
            }
        );
        if (apiRes.status === 200) {
            const data: {
                count: number;
                next: string | null; // URL
                previous: string | null; // URL
                results: MessageModel[];
            } = await apiRes.json();
            setHasMoreMessages(data.next !== null);
            setPage(page + 1);
            setMessageHistory((prev: MessageModel[]) => prev.concat(data.results));
        }
    }


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
                    // setMessageHistory((prev: any) => prev.concat(data.message));
                    setMessageHistory((prev: any) => [data.message, ...prev]);
                    sendJsonMessage({ type: "read_messages" });
                    break;
                case "last_50_messages":
                    setMessageHistory(data.messages);
                    setHasMoreMessages(data.has_more);
                    break;

                case "user_join":
                    setParticipants((pcpts: string[]) => {
                        if (!pcpts.includes(data.user)) {
                            return [...pcpts, data.user];
                        }
                        return pcpts;
                    });
                    break;
                case "user_leave":
                    setParticipants((pcpts: string[]) => {
                        const newPcpts = pcpts.filter((x) => x !== data.user);
                        return newPcpts;
                    });
                    break;
                case "online_user_list":
                    setParticipants(data.users);
                    break;
                case 'typing':
                    updateTyping(data);
                    break;
                default:
                    console.error("Unknown message type!");
                    break;
            }
        }
    });
    function handleChangeMessage(e: React.ChangeEvent<HTMLInputElement>) {
        setMessage(e.target.value);
        onType();
    }

    function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && message.trim()) {
            handleSubmit();
        }
    }


    function handleSubmit() {
        if (message.length === 0) return;
        if (message.length > 512) return;
        sendJsonMessage({
            type: "chat_message",
            message,
        });

        setMessage("");
        clearTimeout(timeout.current);
        timeoutFunction();
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


    //mark as read
    useEffect(() => {
        if (connectionStatus === "Open") {
            sendJsonMessage({
                type: "read_messages"
            });
        }
    }, [connectionStatus, sendJsonMessage]);


    return (
        <div>
            <span>The WebSocket is currently {connectionStatus}</span>
            {/* Display the welcome message */}
            {welcomeMessage && <p>{welcomeMessage}</p>}
            {
                conversation && (
                    <div className="py-6">
                        <h3 className="text-3xl font-semibold text-gray-900">
                            Chat with user: {conversation.other_user.username}
                        </h3>
                        <span className="text-sm">
                            {conversation.other_user.username} is currently
                            {participants.includes(conversation.other_user.username) ? " online" : " offline"}
                        </span>
                    </div>
                )
            }

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



            <div className="flex w-full items-center justify-between border border-gray-200 p-3">
                <input
                    type="text"
                    placeholder="Message"
                    className="block w-full rounded-full bg-gray-100 py-2 outline-none focus:text-gray-700"
                    name="message"
                    value={message}
                    onChange={handleChangeMessage}
                    onKeyPress={handleKeyPress}
                    required
                    ref={inputReference}
                    maxLength={511}
                />
                <button className="ml-3 bg-gray-300 px-3 py-1" onClick={handleSubmit}>
                    Submit
                </button>
            </div>



            <hr />

            {
                typing && <p className="truncate text-sm text-gray-500">typing...</p>
            }

            <div
                id="scrollableDiv"
                className="h-[20rem] mt-3 flex flex-col-reverse relative w-full border border-gray-200 overflow-y-auto p-6"
            >
                <div>
                    {/* Put the scroll bar always on the bottom */}
                    <InfiniteScroll
                        dataLength={messageHistory.length}
                        next={fetchMessages}
                        className="flex flex-col-reverse" // To put endMessage and loader to the top
                        inverse={true}
                        hasMore={hasMoreMessages}
                        loader={<ChatLoader />}
                        scrollableTarget="scrollableDiv"
                    >
                        {messageHistory.map((message: MessageModel) => (
                            <Message key={message.id} message={message} />
                        ))}
                    </InfiniteScroll>
                </div>
            </div>

        </div>
    );
}
