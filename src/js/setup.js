import * as THREE from 'three'
import { CAMERA_POSITION, NEAR_PLANE, FAR_PLANE, MIN_ZOOM, MAX_ZOOM } from '/js/config'
import { setupGrid } from '/js/grid'
import { setupGUI } from '/js/gui'
import { setupLighting } from '/js/lighting'
import { setupMovement } from '/js/movement'
import { setupClick } from '/js/click'
import { setupRain, setupClouds } from '/js/weather'

import Stats from 'three/examples/js/libs/stats.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// Shaders
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`
const fragmentShader = `
  uniform int renderType;
  uniform float cloudOpacity;
  uniform sampler2D cloudTexture;
  uniform sampler2D bloomTexture;
  uniform sampler2D boxesTexture;
  varying vec2 vUv;
  void main() {
    vec4 cloudColor = texture2D( cloudTexture, vUv );
    vec4 bloomColor = texture2D( bloomTexture, vUv );
    vec4 boxesColor = texture2D( boxesTexture, vUv );

    switch (renderType) {
      // Bloom + scene
      case 0: {
        if (boxesColor.x < 0.005 && boxesColor.y < 0.005 && boxesColor.z < 0.005) {
          gl_FragColor = boxesColor + 0.2 * bloomColor + 0.5 * cloudOpacity * cloudColor;
        } else {
          gl_FragColor = boxesColor + bloomColor + cloudOpacity * cloudColor;
        }
        return;
      }
      // Bloom only
      case 1: {
        gl_FragColor = bloomColor;
        return;
      }
      // Scene only
      case 2: {
        gl_FragColor = boxesColor;
        return;
      }
      // Clouds only
      case 3: {
        gl_FragColor = cloudColor;
        return;
      }
    }
    
  }
`

// Setup function
export function setup(cityscape) {
  // Stats
  cityscape.stats = new Stats()
  cityscape.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(cityscape.stats.dom)

  // Setup GUI and parameters
  setupGUI(cityscape)

  // Setup basic stuff
  setupCameraSceneRendererComposer(cityscape)

  // Setup gamepad and listeners
  setupMovement(cityscape)

  // Setup click
  setupClick(cityscape)
  // Setup geometry
  setupGrid(cityscape)

  // Setup lights
  setupLighting(cityscape)

  // Setup weather
  setupRain(cityscape)
  setupClouds(cityscape)
}

// Setup helper
function setupCameraSceneRendererComposer(cityscape) {
  // Dimensions
  const screenX = cityscape.container.clientWidth
  const screenY = cityscape.container.clientHeight
  cityscape.screenResolution = new THREE.Vector2(screenX, screenY)
  const aspectRatio = screenX / screenY

  // Camera
  cityscape.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, NEAR_PLANE, FAR_PLANE)
  cityscape.camera.zoom = cityscape.params.zoom
  cityscape.camera.position.copy(CAMERA_POSITION)
  cityscape.camera.lookAt(0, 0, 0)
  cityscape.camera.updateProjectionMatrix()

  // Scene
  cityscape.scene = new THREE.Scene()

  // Renderer
  cityscape.renderer = new THREE.WebGLRenderer({ canvas: cityscape.canvas })
  cityscape.renderer.toneMapping = THREE.LinearToneMapping
  cityscape.renderer.toneMappingExposure = cityscape.params.exposure
  cityscape.renderer.setPixelRatio(window.devicePixelRatio)
  cityscape.renderer.setClearColor(0x000000)
  cityscape.renderer.setSize(screenX, screenY)

  // A. Render pass
  const renderPass = new RenderPass(cityscape.scene, cityscape.camera)

  // B. Bloom pass
  const unrealBloomPass = new UnrealBloomPass(
    cityscape.screenResolution,
    cityscape.params.bloomStrength,
    cityscape.params.bloomRadius,
    cityscape.params.bloomThreshold
  )

  // Cloud composer (A)
  cityscape.cloudComposer = new EffectComposer(cityscape.renderer)
  cityscape.cloudComposer.renderToScreen = false // will render to cityscape.cloudComposer.renderTarget2.texture
  cityscape.cloudComposer.addPass(renderPass)
  cityscape.cloudComposer.addPass(unrealBloomPass)

  // Bloom composer (A + B)
  cityscape.bloomComposer = new EffectComposer(cityscape.renderer)
  cityscape.bloomComposer.renderToScreen = false // will render to cityscape.bloomComposer.renderTarget2.texture
  cityscape.bloomComposer.addPass(renderPass)
  cityscape.bloomComposer.addPass(unrealBloomPass)

  // C. Shader pass
  const shaderPass = makeNewShaderPass(cityscape)

  // Shader composer (A + C, dependent on cloud and bloom composers)
  cityscape.shaderComposer = new EffectComposer(cityscape.renderer)
  cityscape.shaderComposer.addPass(renderPass)
  cityscape.shaderComposer.addPass(shaderPass)

  // Orbit controls
  cityscape.orbitControls = new OrbitControls(cityscape.camera, cityscape.renderer.domElement)
  cityscape.orbitControls.minZoom = MIN_ZOOM
  cityscape.orbitControls.maxZoom = MAX_ZOOM
  cityscape.orbitControls.addEventListener('change', () => {
    cityscape.params.zoom = cityscape.camera.zoom
  })
  cityscape.orbitControls.enableDamping = true
  cityscape.orbitControls.dampingFactor = 0.1
  cityscape.orbitControls.autoRotate = false
  cityscape.orbitControls.autoRotateSpeed = 2
  cityscape.orbitControls.enablePan = false
}

// Shader pass creator
export function makeNewShaderPass(cityscape, uniformModifications) {
  return new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        renderType: { value: 0 },
        cloudOpacity: { value: cityscape.params.cloudOpacity },
        cloudTexture: { value: cityscape.cloudComposer.renderTarget2.texture },
        bloomTexture: { value: cityscape.bloomComposer.renderTarget2.texture },
        boxesTexture: { value: null }, // texture from its own earlier passes
        ...uniformModifications,
      },
      vertexShader,
      fragmentShader,
    }),
    'boxesTexture' // texture from its own earlier passes
  )
}
