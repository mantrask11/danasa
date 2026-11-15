// ======================================
// IMAGE SONIFIER
// ======================================

// ELEMENTS
const originalImg = document.getElementById("originalImg");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");

const chunkSlider = document.getElementById("chunkSlider");
const speedSlider = document.getElementById("speedSlider");

const logBox = document.getElementById("log");

// VARIABLES
let rawImageData = null;
let chunkNotes = [];
let activeSynth = null;

// MUSICAL SCALE
const scale = [
  "C2",
  "D2",
  "E2",
  "G2",
  "A2",
  "C3",
  "D3",
  "E3",
  "G3",
  "A3",
  "C4",
  "D4",
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "E5",
  "G5",
  "A5",
  "C6",
];

// ======================================
// 1. LOAD IMAGE
// ======================================

function loadImage() {
  originalImg.onload = () => {
    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(originalImg, 0, 0);

    rawImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    extractChunkData();
  };

  originalImg.onerror = () => {
    logBox.textContent = "Error loading image.";
  };

  // Handle images already loaded from cache
  if (originalImg.complete && originalImg.naturalWidth > 0) {
    originalImg.onload();
  }
}

// ======================================
// 2. EXTRACT RGB DATA
// ======================================

function extractChunkData() {
  if (!rawImageData) return;

  const w = canvas.width;
  const h = canvas.height;

  const data = rawImageData.data;

  const numChunks = Math.min(w, parseInt(chunkSlider.value, 10));

  const chunkWidth = w / numChunks;

  chunkNotes = [];

  for (let c = 0; c < numChunks; c++) {
    const startX = Math.floor(c * chunkWidth);
    const endX = Math.floor((c + 1) * chunkWidth);

    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let pixelCount = 0;

    // Read each vertical section
    for (let x = startX; x < endX; x++) {
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;

        rTotal += data[i];
        gTotal += data[i + 1];
        bTotal += data[i + 2];

        pixelCount++;
      }
    }

    // Average RGB
    const rAvg = rTotal / pixelCount;
    const gAvg = gTotal / pixelCount;
    const bAvg = bTotal / pixelCount;

    // RED = NOTE
    const noteIdx = Math.min(
      scale.length - 1,
      Math.floor((rAvg / 256) * scale.length),
    );

    const note = scale[noteIdx];

    // GREEN = VOLUME
    const velocity = Math.max(0.4, gAvg / 255);

    // BLUE = DURATION
    const duration = bAvg > 150 ? "8n" : "16n";

    chunkNotes.push({
      note,
      velocity,
      duration,
    });
  }

  const estTime = (chunkNotes.length * parseFloat(speedSlider.value)).toFixed(
    1,
  );

  logBox.textContent =
    `Image loaded: ${w}x${h}px | ` +
    `${numChunks} chunks | ` +
    `Estimated duration: ${estTime}s`;
}

// ======================================
// 3. CHUNK SLIDER
// ======================================

chunkSlider.addEventListener("input", () => {
  document.getElementById("chunkVal").textContent = chunkSlider.value;

  extractChunkData();
});

// ======================================
// 4. SPEED SLIDER
// ======================================

speedSlider.addEventListener("input", () => {
  document.getElementById("speedVal").textContent = speedSlider.value;
});

// ======================================
// 5. PLAY IMAGE
// ======================================

playBtn.addEventListener("click", async () => {
  if (chunkNotes.length === 0) return;

  stopPlayback();

  await Tone.start();

  activeSynth = new Tone.Synth().toDestination();

  const startTime = Tone.now();
  const step = parseFloat(speedSlider.value);

  chunkNotes.forEach((item, idx) => {
    activeSynth.triggerAttackRelease(
      item.note,
      item.duration,
      startTime + idx * step,
      item.velocity,
    );
  });

  const estTime = (chunkNotes.length * step).toFixed(1);

  logBox.textContent = `Playing ${chunkNotes.length} chunks (${estTime}s)...`;
});

// ======================================
// 6. STOP PLAYBACK
// ======================================

function stopPlayback() {
  if (activeSynth) {
    activeSynth.dispose();
    activeSynth = null;
  }
}

stopBtn.addEventListener("click", () => {
  stopPlayback();

  logBox.textContent = "Playback stopped.";
});

// ======================================
// 7. INITIALIZE
// ======================================

loadImage();
