import "./App.css";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./lib/tambo";
import { MessageThreadFull } from "./components/tambo/message-thread-full";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PersistentCart } from "./components/PersistentCart/PersistentCart";
import { cartLoader } from "./components/PersistentCart/Loader";
import { cartAction } from "./components/PersistentCart/Action";

export default function App() {
  // other code
  const router = createBrowserRouter([
    {
      path: "/cart/:cartId",
      element: <PersistentCart />,
      loader: cartLoader,
      action: cartAction,
    },
  ]);
  return (
    <div>
      {/* other components */}
      <TamboProvider
        apiKey={import.meta.env.VITE_TAMBO_API_KEY ?? ""}
        components={components}
      >
        {/* Tambo components */}
        <MessageThreadFull />
        {/* other Tambo components */}
      </TamboProvider>
      {/* other components */}
      <RouterProvider router={router} />
    </div>
  );
}
