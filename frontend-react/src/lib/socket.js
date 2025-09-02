import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_REALTIME_ENDPOINT;
const socket = io(URL, {
    autoConnect: false
});

export default socket;