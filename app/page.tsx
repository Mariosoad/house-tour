"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(() => import("@/components/Experience").then((m) => m.Experience), {
  ssr: false,
});

export default function Home() {
  return (
    <main style={{ width: "100%", height: "100vh", margin: 0, overflow: "hidden" }}>
      <Experience />
    </main>
  );
}
