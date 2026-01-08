import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { AnalyticsModule } from "./components/modules/Analytics";
import { CostsModule } from "./components/modules/Costs";
import { ServicesModule } from "./components/modules/Services";
import { ClientsModule } from "./components/modules/Clients";
import { QuotesModule } from "./components/modules/Quotes";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true, // Ruta por defecto (ej. /liu-finance-2026/)
          element: <AnalyticsModule />,
        },
        { path: "finances", element: <CostsModule /> },
        { path: "services", element: <ServicesModule /> },
        { path: "clients", element: <ClientsModule /> },
        { path: "quotes", element: <QuotesModule /> },
      ],
    },
  ],
  {
    basename: "/liu-finance-2026/",
  }
);