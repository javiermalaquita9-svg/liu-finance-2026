import { createBrowserRouter } from "react-router-dom";
import App from "./App";

export const router = createBrowserRouter(
  [
    {
      // Hacemos que todas las rutas (incluyendo sub-rutas como /finances, /clients, etc.)
      // sean manejadas por el componente principal App.
      path: "/*",
      element: <App />,
    },
  ],
  {
    basename: "/liu-finance-2026/",
  }
);