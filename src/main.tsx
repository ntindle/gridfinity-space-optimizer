import ReactDOM from "react-dom/client";
import App from "./App";
import { initAnalytics } from "@/services/analytics";
import "./index.css";

void initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);