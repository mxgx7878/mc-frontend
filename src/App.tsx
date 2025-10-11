// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./routes";
import ToasterProvider from "./components/common/Toaster"; // Changed from ToasterProvider
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToasterProvider />
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;