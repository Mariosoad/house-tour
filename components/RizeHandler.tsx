import { useEffect } from "react";

export type ResizeHandlerProps = {
  quality: "default" | "high";
  rendererRef: React.RefObject<unknown>;
};

export function ResizeHandler({ quality, rendererRef }: ResizeHandlerProps) {
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [quality]);

  return null;
}
