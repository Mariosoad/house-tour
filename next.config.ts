import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // evita doble montaje que puede dejar la cámara en posición incorrecta en dev
};

export default nextConfig;
