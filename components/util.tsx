"use client";

import React, { MutableRefObject } from "react";
import * as THREE from "three";
import { type ReactThreeFiber, extend, useThree } from "@react-three/fiber";
import type { Effect, BlendFunction } from "postprocessing";

export const resolveRef = <T,>(ref: T | React.MutableRefObject<T>) =>
  typeof ref === "object" && ref != null && "current" in ref ? (ref as React.MutableRefObject<T>).current : ref;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EffectConstructor = new (...args: any[]) => Effect;

export type EffectProps<T extends EffectConstructor> = ConstructorParameters<T>[0] & {
  blendFunction?: BlendFunction;
  opacity?: number;
  [key: string]: unknown;
};

let i = 0;
const components = new WeakMap<EffectConstructor, React.ExoticComponent<unknown> | string>();

export const wrapEffect = <T extends EffectConstructor>(effect: T, defaults?: EffectProps<T>) =>
  React.forwardRef<InstanceType<T>, EffectProps<T>>(function EffectComponent(
    { blendFunction = defaults?.blendFunction, opacity = defaults?.opacity, ...props },
    ref
  ) {
    let Component = components.get(effect);
    if (!Component) {
      const key = `postprocessing-effect-${effect.name}-${i++}`;
      extend({ [key]: effect } as Parameters<typeof extend>[0]);
      components.set(effect, (Component = key));
    }

    const camera = useThree((state) => state.camera);
    const args = React.useMemo(
      () => [
        ...((defaults?.args ?? []) as unknown[]),
        ...((props.args ?? [{ ...defaults, ...props }]) as unknown[]),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(props)]
    );

    const elementProps = {
      camera,
      "blendMode-blendFunction": blendFunction,
      "blendMode-opacity-value": opacity,
      ...props,
      ref,
      args,
    };
    return React.createElement(Component as React.ComponentType<typeof elementProps>, elementProps);
  });

export const useVector2 = (
  props: Record<string, unknown>,
  key: string
): THREE.Vector2 => {
  const value = props[key] as ReactThreeFiber.Vector2 | undefined;
  return React.useMemo(() => {
    if (typeof value === "number") return new THREE.Vector2(value, value);
    if (value) return new THREE.Vector2(...(value as [number, number]));
    return new THREE.Vector2();
  }, [value]);
};
