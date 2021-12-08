import * as THREE from 'three'
import '/public/style.css'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { updateSize, animate, setupLighting, setupFog, setupPlane } from "./app"
import { setupGamepadAndListeners } from './movement'
import { camOffsetX, camOffsetY, camOffsetZ } from './config'
import Stats from '/../node_modules/stats.js/src/Stats.js'

function main() {
    // Listeners
    window.addEventListener('resize', updateSizeOnWindowResize)
    function updateSizeOnWindowResize() {
        updateSize(renderer, camera)
    }

    // Statistics Tracking
    const stats = new Stats()
    stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom)

    // Camera setup
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 1000)
    camera.position.set(camOffsetX, camOffsetY, camOffsetZ)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#cityscape'),
    })

    // Controls setup
    const orbitControls = new OrbitControls(camera, renderer.domElement)

    // Scene setup
    const scene = new THREE.Scene()
    setupLighting(renderer, scene)
    setupFog(scene)
    setupPlane(scene)

    // Start the loop.
    setupGamepadAndListeners()
    animate(stats, scene, renderer, camera, 0)
}

main()