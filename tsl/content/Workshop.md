<page name="Introduction">

<page name="Welcome">

Welcome to the **TSL Workshop 2026**!

This workshop explores shader creation and visual effects using **TSL (Three.js Shading Language)** and **WebGPURenderer**.

We have two main formats to follow along:

- **TSL Guide Playground**: An interactive in-browser environment with live code execution.
  - Click the <i data-icon="terminal" style="width: 1rem; height: 1rem; display: inline-block; vertical-align: middle;"></i> button in the header to open it.
- **Workshop Repository**: Clone the repository to run the project locally:
  - [https://github.com/sunag/tsl-workshop-2026](https://github.com/sunag/tsl-workshop-2026).

</page>

</page>

<page name="Ground">

<page name="Ripples">

Procedural rain ripples simulate circular expanding wavefronts created by raindrops hitting the ground, inspired by [Shadertoy (ldfyzl)](https://www.shadertoy.com/view/ldfyzl).

- **World-Space Coordinates**: We derive continuous coordinates from `positionWorld.xz` so the ripple grid aligns seamlessly across any surface and remains independent of geometry UV layout.
- **Time Propagation & Volume**: The `time` node drives wave expansion, while `volume` (0.0 to 1.0) controls the density/frequency of active raindrops falling on each area.
- **Normal Perturbations**: The `ripples()` function generates procedural ripples and returns tangent-space normal vectors `vec3` ready to displace surface reflections and lighting.

#### Related
- [Node Material](?guide#node-material)
- [Coordinate Spaces](?guide#coordinate-spaces)
- [Position](?guide#position)
- [Normal](?guide#normal)
- [time](?guide#timer)

</page>

<page name="Reflector">

Building upon the procedural rain ripples from the previous step, real-time planar reflections capture mirror images of dynamic scene geometry onto flat surfaces and distort them using ripple normal vectors.

- **Planar Reflector**: The `reflector` node creates an offscreen render target and virtual camera tracked by the ground plane via `ground.add( reflection.target )`. Configured with `resolutionScale: 0.5` and `generateMipmaps: true` for crisp, blurred reflections.
- **Screen-Space UV & Mirror Alignment**: The `screenUV` coordinates are horizontally flipped using `flipX` to align the mirrored projection accurately with the ground plane.
- **Ripple Perturbations**: Animated rain ripple normal vectors perturb the reflection coordinates through `rippleOffset`, creating realistic optical water distortion.
- **Distance Attenuation**: Uses `rangeFogFactor( 0, 30 ).oneMinus()` to smoothly fade out ripple distortion over distance, eliminating sub-pixel shimmering in the background.
- **Bicubic Mipmap Filtering**: The `textureBicubic` node filters the distorted reflection texture across mipmap levels for smooth, artifact-free blurring.

#### Related
- [Screen](?guide#screen)
- [Texture](?guide#texture)
- [Fog](?guide#fog)
- [Coordinate Spaces](?guide#coordinate-spaces)

</page>

<page name="Collision Height">

A top-down orthographic camera captures the scene elevation into a floating-point collision height map. We then compare surface heights against the ground level using `pcfSoft` to generate a smooth, anti-aliased occlusion mask.

### Collision Height

The `collisionHeight` instance renders the scene from above using an orthographic camera to record world-space elevation:
- **Orthographic Top-Down Camera**: Positioned above the scene looking straight down along the Y axis to cover the gameplay area.
- **Elevation Encoding**: Uses `scene.overrideMaterial` with `outputNode = vec4( vec3( positionWorld.y ), 1 )` to write unclamped world Y coordinates directly into a `HalfFloatType` texture, bypassing tone mapping.
- **Coordinate Transformations**: The `getUV` method maps any world `XZ` position into normalized `[0, 1]` UV coordinates matching the collision camera bounds.

### Collision Mask & Filtering

- **Height Bias**: A `bias` offset avoids self-occlusion and ensures only objects elevated above the ground (like cars, roofs, and bridges) block raindrops.
- **PCFSoft Filtering**: The `pcfSoft` function samples a 16-tap rotated Vogel disk around the collision UV coordinates to smoothly filter the occlusion threshold without pixelated edges.

#### Related
- [Texture](?guide#texture)
- [Position](?guide#position)
- [Coordinate Spaces](?guide#coordinate-spaces)

</page>

<page name="Reflector Mask">

Combining the planar reflector with the collision mask allows rain ripples to only perturb reflections in open, exposed areas. Sheltered ground beneath cars, bridges, and roofs remains calm with crisp planar reflections.

- **Masked Ripples**: Multiplying the ripple displacement by `mask` ensures ripple normal offsets only distort the reflection where raindrops can freely reach the ground.
- **Occlusion Blend**: Sheltered areas transition smoothly into calm reflective surfaces without hard seams thanks to `pcfSoft` filtering.

#### Related
- [Texture](?guide#texture)
- [Screen](?guide#screen)
- [Position](?guide#position)
- [Coordinate Spaces](?guide#coordinate-spaces)

</page>

<page name="Ground Details">

PBR textures provide the base visual details for wet asphalt, configuring diffuse albedo, surface roughness, and normal bump maps.

- **Tiled Coordinates**: The `uv` is scaled and offset using `.mul( 25 ).add( 0.13 )` to repeat asphalt details seamlessly across the ground plane.
- **PBR Maps**: Samples `albedoMap`, `roughnessMap`, and `normalMapTex` to define surface appearance, reflectivity, and surface normals.

#### Related
- [Texture](?guide#texture)
- [UV](?guide#uv)
- [Node Material](?guide#node-material)

</page>

<page name="Ground Final">

The final ground material fuses all previously explored shading techniques into a complete, photorealistic wet asphalt shader with dynamic puddle reflections and procedural rain ripples.

- **PBR Surface Textures**: Tiled albedo, roughness, and normal maps define the asphalt and puddle material foundation.
- **Occluded Rain Ripples**: Procedural raindrop ripples perturb the ground normal map only in open areas verified by the `pcfSoft` collision mask.
- **Roughness-Aware Planar Reflection**: The planar mirror texture is blurred dynamically based on the surface roughness using `textureBicubic`, and masked by surface wetness.
- **PBR Material Integration**: Standard node material unifies lighting, diffuse color, perturbed normal vectors, and emissive mirror reflections into a single GPU pipeline.

#### Related
- [Node Material](?guide#node-material)
- [Texture](?guide#texture)
- [Screen](?guide#screen)
- [Coordinate Spaces](?guide#coordinate-spaces)

</page>

</page>

<page name="Scene">

<page name="Fog">

Volumetric height fog adds atmospheric depth and mood by combining camera distance attenuation with an exponential vertical height falloff. The fog gathers densely over the wet ground and gradually dissipates into the sky.

- **Camera Distance**: Uses `positionView.z.negate()` to measure planar depth directly in view space without spherical edge distortion. In world space, the equivalent calculation is `positionWorld.distance( cameraPosition )`.
- **Exponential Height Decay**: Calculates elevation above `fogFloor` and applies `.negate().exp()` to create dense low-altitude ground fog that smoothly thins out with height.
- **Global Scene Integration**: Setting `scene.fogNode = fog( fogColor, fogFactor )` automatically blends the atmospheric fog across all rendered materials in the scene.

#### Related
- [Fog](?guide#fog)
- [Position](?guide#position)
- [Math](?guide#math)
- [Camera](?guide#camera)

</page>

</page>

<page name="Simple Particle">

<page name="Smoke">

Procedural exhaust smoke particles are created using `SpriteNodeMaterial` and GPU instancing with `range`, driving complex particle lifetimes and animations directly in shader code without compute shaders or CPU loops.

- **GPU Instanced Sprites**: Setting `sprite.count = 60` instantiates 60 camera-facing billboard sprites rendered in a single draw call.
- **Instance Randomization**: The `range` node generates per-instance variations for particle lifetime, 3D velocity offsets, scaling, and rotation speed.
- **Procedural Lifetime Animation**: `time` combined with `.mod( 1 )` drives continuous emission cycles, while `smoothstep` and `.oneMinus()` create smooth spawn and dissipation alpha fades.
- **Texture UV Rotation**: The `rotateUV` node dynamically spins the smoke texture over time at randomized rates per puff.
- **Shared Material Architecture**: Both exhaust pipes attach separate instanced sprites while sharing the exact same `SpriteNodeMaterial` instance.

#### Related
- [Sprite Material](?guide#sprite-material)
- [Range](?guide#range)
- [UV](?guide#uv)
- [Math](?guide#math)

</page>

</page>

<page name="Compute Particle">

<page name="Compute">

Compute shaders in WebGPU enable high-performance general-purpose parallel computing directly on the GPU. Using GPU storage buffers `instancedArray` and compute nodes `Fn().compute()`, thousands of data elements can be calculated simultaneously in parallel without CPU overhead.

- **GPU Storage Buffers**: `instancedArray` allocates GPU memory buffers for instance data (like 3D positions) that persist across dispatches and can be read by shaders.
- **Compute Kernel**: `Fn()().compute( count )` creates an executable GPU compute shader dispatched across `count` parallel threads `instanceIndex`.
- **Parallel Randomization**: The `hash` TSL node produces pseudo-random numbers per invocation to scatter initial particle positions in 3D space.
- **Buffer Element Access**: `positionBuffer.element( instanceIndex )` indexes into the storage buffer to position each geometry instance during rendering.

#### Related
- [Compute](?guide#compute)
- [Instanced Array](?guide#instanced-array)
- [Hash](?guide#hash)
- [Fn](?guide#fn)

</page>

<page name="Rain">

Full GPU particle simulation with dynamic physics and real-time terrain collision detection. Using delta time integration and collision height sampling, raindrops fall, wrap infinitely around the camera, and collide with scene surfaces.

- **Delta Time Physics**: The `computeUpdate` shader advances particles every frame using `position.addAssign( velocity.mul( deltaTime ) )`.
- **Camera-Centered Area Positioning**: Spawns raindrops in a 3D box area around the camera using `area` and `uniform( camera.position )`.
- **Terrain Heightmap Collision**: Samples the ground collision texture using `collisionHeight.getUV()` to detect floor impacts.
- **Dynamic Respawn**: Droplets hitting surfaces respawn with randomized coordinates and velocities to prevent clumping.
- **Cylindrical Billboarding**: Renders each rain streak with cylindrical billboarding `horizontal: true` and distance-based opacity.

#### Related
- [Compute](?guide#compute)
- [Collision](?guide#collision)
- [Billboarding](?guide#billboarding)
- [Delta Time](?guide#delta-time)

</page>

<page name="Spritesheet">

Spritesheets pack multiple animation frames into a single texture atlas. Using the built-in `spritesheetUV` TSL node, we dynamically offset the UV coordinates across rows and columns over time to play flipbook animations with zero CPU overhead.

![Water Splash Spritesheet](../public/textures/water-splash.webp)

- **Texture Atlas**: Loads a spritesheet image `water-splash.webp` containing 5 horizontal animation frames of water droplets splashing.
- **spritesheetUV Node**: Calculates the current column/row UV offset automatically based on frame dimensions `vec2( 5, 1 )`, base UV coordinates `uv()`, and continuous time-driven frame progress `time.mul( 20 )`.
- **Billboarding**: Uses `billboarding()` to ensure the splash sprite always faces directly toward the camera regardless of viewpoint angle.

#### Related
- [Texture](?guide#texture)
- [UV](?guide#uv)
- [Timer](?guide#timer)

</page>

<page name="Splash">

Animated water splash particles generated on scene surfaces around the camera using compute shaders, collision height sampling, and spritesheets.

- **Animation Cycles**: Advances splash frames and picks a new random position every cycle using `splashCycleBuffer`.
- **Collision Snapping**: Uses `collisionHeight.getUV()` to place splashes directly on top of floors, cars, and buildings.
- **Radial Spawning**: Spawns splashes in a circle in front of the camera with `cos()`, `sin()`, and `cameraDirection`.
- **Automatic Billboarding**: Uses `SpriteNodeMaterial` and `THREE.Sprite` for native camera-facing sprites without manual vertex transformations.

#### Related
- [Compute](?guide#compute)
- [Spritesheet](?guide#spritesheet)
- [Collision](?guide#collision)
- [Sprite Material](?guide#sprite-material)

</page>

</page>

<page name="Render Pipeline">

<page name="Pass + MRT">

Multiple Render Targets (MRT) allow a single render pass to output multiple shader channels simultaneously into separate texture buffers, such as full scene color and isolated emissive lighting.

- **Single Pass Capture**: Uses `pass()` with `setMRT()` and `mrt()` to render color `output` and neon glow `emissive` in one GPU pass.
- **Texture Extraction**: `getTextureNode()` extracts individual texture channels `output` and `emissive` for post-processing.
- **Split-Screen Comparison**: Compares the full scene render with the isolated emissive channel side-by-side using `select()` and `screenUV`.

#### Related
- [Pass](?guide#pass)
- [MRT](?guide#mrt)
- [Screen](?guide#screen)
- [Render Pipeline](?guide#render-pipeline)

</page>

<page name="Post-Processing">

Assembles a complete cyberpunk post-processing pipeline combining selective neon bloom with depth attenuation, anamorphic lens flares, color balance grading, chromatic aberration, anti-aliasing, and cinematic film grain.

- **Selective Depth-Faded Bloom**: Attenuates distant emissive materials using `getLinearDepthNode()` and applies `bloom()` exclusively to isolated neon glow without washing out diffuse surfaces.
- **Lens Flare**: Generates cinematic ghost flares and light streaks from glowing lights using `lensflare()`.
- **Cyberpunk Grading**: Shifts the color balance towards magenta/cyan tones using `vec3()`, enhances vibrancy with `saturation()`, and focuses the viewpoint using a radial `screenUV` vignette.
- **Chromatic Aberration**: Adds radial lens color fringing using `chromaticAberration()` to separate RGB color channels towards the screen edges.
- **Anti-Aliasing & Film Grain**: Cleans specular edges with `smaa()` and adds cinematic film texture using `film()`.

#### Related
- [Pass](?guide#pass)
- [MRT](?guide#mrt)
- [Screen](?guide#screen)
- [Render Pipeline](?guide#render-pipeline)

</page>

</page>
