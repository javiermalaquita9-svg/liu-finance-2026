import { createBrowserRouter } from "react-router-dom";
import App from "./App"; // Antes era "../App"
import { AnalyticsModule } from "./components/modules/Analytics"; // Antes era "../components..."
import { FinancesPage } from "./FinancesPage";
import { ServicesModule } from "./components/modules/ServicesModule";
import { ClientsModule } from "./components/modules/ClientsModule";
import { QuotesModule } from "./components/modules/Quotes";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true, 
          element: <AnalyticsModule />,
        },
        { path: "finances", element: <FinancesPage /> },
        { path: "services", element: <ServicesModule /> },
        { path: "clients", element: <ClientsModule /> },
        { path: "quotes", element: <QuotesModule /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);