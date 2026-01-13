import "./index.css";
import "react-quill-new/dist/quill.snow.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import "@ant-design/v5-patch-for-react-19";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { AppThemeProvider } from "@/contexts/AntdThemeProvider.tsx";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      retry: 3,
      staleTime: 0,
      refetchInterval: 10000 * 60,
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
