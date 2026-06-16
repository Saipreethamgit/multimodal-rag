"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [refreshDocs, setRefreshDocs] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onUploadSuccess={() => setRefreshDocs((n) => n + 1)} refreshKey={refreshDocs} />
      <main className="flex flex-col flex-1 overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  );
}
