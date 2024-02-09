import { AxiosRequestHeaders } from "axios";

export default function authHeader(): AxiosRequestHeaders {
    const localStorageUser = localStorage.getItem("user");
    let headers = {
        'Content-Type': 'application/json',
    } as AxiosRequestHeaders;
    if (localStorageUser) {

        const user = JSON.parse(localStorageUser);
        headers = {
            'Authorization': `Token ${user.token}`,
            'Content-Type': 'application/json',
        } as AxiosRequestHeaders;
    }



    return headers;
}
