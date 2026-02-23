import "./App.css";
import { TamboProvider } from "@tambo-ai/react";
import { components as tamboComponents } from "./components/tambo/components";
import { MessageThreadFull } from "./components/tambo/message-thread-full";

import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

import { PersistentCart } from "./components/PersistentCart/PersistentCart";
import { cartLoader } from "./components/PersistentCart/loader";
import { cartAction } from "./components/PersistentCart/action";
import { InventoryStatus } from "./components/InventoryStatus/InventoryStatus";
import { inventoryLoader } from "./components/InventoryStatus/loader";
import { inventoryAction } from "./components/InventoryStatus/action";

import { CustomerLoyaltyCard } from "./components/CustomerLoyalty/CustomerLoyalty";
import { customerLoader } from "./components/CustomerLoyalty/loader";
import { customerAction } from "./components/CustomerLoyalty/action";

import { SalesToday } from "./components/SalesChart/SalesChart";
import { salesTodayAction } from "./components/SalesChart/action";
import { salesTodayLoader } from "./components/SalesChart/loader";

import { addToCartTool } from "./ai/tools/cartTools/addToCartTools";
import { removeFromCartTool } from "./ai/tools/cartTools/removeFromCartTools";
import { searchProductsTool } from "./ai/tools/searchProductTools";
import { checkoutCartTool } from "./ai/tools/checkoutTool";
import { getInventoryTool } from "./ai/tools/inventoryTools";
import { createCartTool } from "./ai/tools/cartTools/createCartTool";

function AppShell() {
  const tools = [
    addToCartTool,
    searchProductsTool,
    checkoutCartTool,
    getInventoryTool,
    removeFromCartTool,
    createCartTool,
  ];
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left: Persistent cart */}
      <div
        style={{ width: 420, borderRight: "1px solid #e5e7eb", padding: 16 }}
      >
        <PersistentCart />
      </div>

      {/* Right: Tambo chat */}
      <div style={{ flex: 1, padding: 16 }}>
        <TamboProvider
          apiKey={import.meta.env.VITE_TAMBO_API_KEY ?? ""}
          components={tamboComponents}
          tools={tools}
          userKey="dev-user-1"
        >
          <MessageThreadFull />
        </TamboProvider>

        {/* If you add more routes later, they render here */}
        <Outlet />
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    loader: cartLoader,
    action: cartAction,
    children: [
      {
        path: "inventory",
        element: <InventoryStatus />,
        loader: inventoryLoader,
        action: inventoryAction,
      },
      {
        path: "customers",
        element: <CustomerLoyaltyCard />,
        loader: customerLoader,
        action: customerAction,
      },
      {
        path: "reports/today",
        element: <SalesToday />,
        loader: salesTodayLoader,
        action: salesTodayAction,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
