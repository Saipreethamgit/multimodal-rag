"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [refreshDocs, setRefreshDocs] = useState(0);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar onUploadSuccess={() => setRefreshDocs((n) => n + 1)} refreshKey={refreshDocs} />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <ChatPanel />
      </main>
    </div>
  );
}
