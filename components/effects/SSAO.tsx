/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ref, forwardRef, useContext, useMemo } from 'react'
import { SSAOEffect, BlendFunction } from 'postprocessing'
import { EffectComposerContext } from '../EffectComposer'

// first two args are camera and texture
type SSAOProps = ConstructorParameters<typeof SSAOEffect>[2]

export const SSAO = forwardRef<SSAOEffect, SSAOProps>(function SSAO(props: SSAOProps, ref: Ref<SSAOEffect>) {
  const { camera, normalPass, downSamplingPass, resolutionScale } = useContext(EffectComposerContext)
  const opts = props as Record<string, unknown>
  const radius = opts.radius as number | undefined
  const intensity = opts.intensity as number | undefined
  const samples = opts.samples as number | undefined
  const rings = opts.rings as number | undefined
  const bias = opts.bias as number | undefined
  const rangeFalloff = opts.rangeFalloff as number | undefined
  const luminanceInfluence = opts.luminanceInfluence as number | undefined
  const distanceThreshold = opts.distanceThreshold as number | undefined
  const distanceFalloff = opts.distanceFalloff as number | undefined
  const rangeThreshold = opts.rangeThreshold as number | undefined
  const effect = useMemo<SSAOEffect | object>(() => {
    if (normalPass === null && downSamplingPass === null) {
      console.error('Please enable the NormalPass in the EffectComposer in order to use SSAO.')
      return {}
    }
    return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: samples ?? 30,
      rings: rings ?? 4,
      distanceThreshold: distanceThreshold ?? 1.0,
      distanceFalloff: distanceFalloff ?? 0.0,
      rangeThreshold: rangeThreshold ?? 0.5,
      rangeFalloff: rangeFalloff ?? 0.1,
      luminanceInfluence: luminanceInfluence ?? 0.9,
      radius: radius ?? 20,
      bias: bias ?? 0.5,
      intensity: intensity ?? 1.0,
      color: undefined,
      // @ts-expect-error
      normalDepthBuffer: downSamplingPass ? downSamplingPass.texture : null,
      resolutionScale: resolutionScale ?? 1,
      depthAwareUpsampling: true,
      ...props,
    })
  }, [
    camera, normalPass, downSamplingPass, resolutionScale,
    radius, intensity, samples, rings, bias, rangeFalloff, luminanceInfluence,
    distanceThreshold, distanceFalloff, rangeThreshold,
  ])
  return <primitive ref={ref} object={effect} dispose={null} />
})
