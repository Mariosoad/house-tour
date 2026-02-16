"use client";

import { useEffect, useState, useCallback } from "react";
import type { SceneObjectInfo } from "@/lib/sceneObjects";

export function SceneObjectsPanel() {
  const [objects, setObjects] = useState<SceneObjectInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [onlyMeshes, setOnlyMeshes] = useState(true);

  useEffect(() => {
    const handler = (e: CustomEvent<{ objects: SceneObjectInfo[] }>) => {
      setObjects(e.detail.objects);
    };
    window.addEventListener("scene-objects-loaded", handler as EventListener);
    return () => window.removeEventListener("scene-objects-loaded", handler as EventListener);
  }, []);

  const filtered = objects.filter((o) => {
    if (onlyMeshes && !o.isMesh) return false;
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.path.toLowerCase().includes(q) ||
      (o.materialName && o.materialName.toLowerCase().includes(q))
    );
  });

  const copyName = useCallback((name: string) => {
    navigator.clipboard.writeText(name);
  }, []);

  if (objects.length === 0) return null;

  return (
    <div className="scene-objects-panel">
      <button
        type="button"
        className="scene-objects-panel-toggle overlay-glass"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Objetos Casona.gltf ({objects.length})
      </button>
      {open && (
        <div className="scene-objects-panel-content overlay-glass">
          <div className="scene-objects-panel-controls">
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="scene-objects-filter"
            />
            <label className="scene-objects-check">
              <input
                type="checkbox"
                checked={onlyMeshes}
                onChange={(e) => setOnlyMeshes(e.target.checked)}
              />
              Solo meshes
            </label>
          </div>
          <div className="scene-objects-list" role="list">
            {filtered.map((obj, i) => (
              <div
                key={`${obj.path}-${i}`}
                className="scene-objects-item"
                title={`Path: ${obj.path}${obj.materialName ? ` | Material: ${obj.materialName}` : ""}`}
              >
                <span className="scene-objects-name">{obj.name}</span>
                {obj.materialName && (
                  <span className="scene-objects-material">{obj.materialName}</span>
                )}
                <button
                  type="button"
                  className="scene-objects-copy"
                  onClick={() => copyName(obj.name)}
                  title="Copiar nombre"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="scene-objects-empty">Ningún objeto coincide con el filtro.</p>
          )}
        </div>
      )}
    </div>
  );
}
