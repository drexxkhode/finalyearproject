import { BrowserRouter } from "react-router-dom";
import { AuthProvider }   from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Inner from "./routes/Inner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Inner />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}