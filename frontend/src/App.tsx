import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "../../lib/tambo";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export default function App() {
  // other code
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
    </div>
  );
}
