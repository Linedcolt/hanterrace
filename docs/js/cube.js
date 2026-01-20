// cube.js
// Minimal spinning cube with a video texture that works on GitHub Pages.
// Expects THREE to be loaded globally and the video at "images/hanterrace.mp4".

(function () {
  // Config
  const VIDEO_SRC = "images/hanterrace.mp4"; // relative path from your HTML file (docs/)
  const CONTAINER_ID = "three-container"; // optional container id; if not present we'll append to body

  // Helpers: create container if missing
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    // make sure it fills the screen so canvas auto-sizes
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.zIndex = "0";
    document.body.appendChild(container);
  }

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Scene + camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 3);

  // Simple geometry + will set material when video texture is ready
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  // start with a simple placeholder material so the mesh is never null
  const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const cube = new THREE.Mesh(geometry, placeholderMat);
  scene.add(cube);

  // Create video element (not added to DOM)
  const video = document.createElement("video");
  video.src = VIDEO_SRC;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true; // required for autoplay in many browsers
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("webkit-playsinline", ""); // iOS

  // Overlay play hint (shows only if autoplay is blocked)
  const overlay = document.createElement("button");
  overlay.innerText = "▶ Click to play video";
  Object.assign(overlay.style, {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    padding: "10px 18px",
    fontSize: "16px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    cursor: "pointer",
    zIndex: "9999",
    backdropFilter: "blur(4px)",
  });
  overlay.addEventListener("click", tryPlay, { once: true });
  document.body.appendChild(overlay);

  // Attempt autoplay right away (many browsers allow muted autoplay)
  let videoTexture;
  let materialSet = false;

  video.play()
    .then(() => {
      setupVideoTexture();
      hideOverlay();
    })
    .catch(() => {
      // autoplay blocked — overlay will let the user start playback
      console.info("Autoplay blocked — click to play the video.");
    });

  // Try play on user interaction
  function tryPlay() {
    video.play().then(() => {
      setupVideoTexture();
      hideOverlay();
    }).catch((err) => {
      console.warn("Playback still blocked:", err);
    });
  }

  function hideOverlay() {
    overlay.style.display = "none";
  }

  function setupVideoTexture() {
    if (materialSet) return;
    // Create VideoTexture (three.js knows how to handle it)
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;
    // Use correct color space
    if ("colorSpace" in videoTexture) {
      // newer three.js versions
      videoTexture.colorSpace = "srgb";
    } else {
      videoTexture.encoding = THREE.sRGBEncoding;
    }

    const mat = new THREE.MeshBasicMaterial({ map: videoTexture });
    mat.needsUpdate = true;
    cube.material = mat;
    materialSet = true;
    console.info("Video texture applied to cube.");
  }

  // Resize handler
  function onResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize, { passive: true });
  onResize();

  // Simple animation loop
  let last = performance.now();
  function animate(t) {
    requestAnimationFrame(animate);
    const dt = (t - last) / 1000;
    last = t;

    // rotate nicely
    cube.rotation.x += dt * 0.35;
    cube.rotation.y += dt * 0.6;

    // If using a VideoTexture, three.js handles updates automatically.
    // But forcing needsUpdate on older builds can help:
    if (videoTexture && video.readyState >= 2) {
      videoTexture.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  // Helpful debug function: open console and run showVideoURL()
  window.showVideoURL = () => {
    console.log("Video src:", video.src);
    console.log("Attempt to open this URL in a new tab to confirm it's reachable:");
    console.log(location.origin + "/" + VIDEO_SRC.replace(/^\//, ""));
  };

  // Expose a tiny API for debugging
  window.__threeCube = {
    video,
    cube,
    renderer,
    scene,
    camera,
  };

  // If the user navigates direct to the video path, give a hint in console
  console.info("cube.js loaded — video path:", VIDEO_SRC);
})();
