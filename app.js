/**
 * Soru Çözüm Videosu Oluşturucu - EduClip Maker
 * Modern, İstemci Taraflı Canvas, WaveSurfer ve MediaRecorder Motoru
 */

// Uygulama Durumu (State)
const State = {
  image: {
    file: null,
    element: null,
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    url: null,
  },
  audio: {
    file: null,
    url: null,
    duration: 0,
    buffer: null,
  },
  box: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  },
  highlight: {
    shape: 'rect', // 'rect' | 'ellipse'
    color: '#22c55e',
    opacity: 0.30,
    borderWidth: 4,
    borderColor: '#22c55e',
    borderRadius: 16,
    glow: true,
    animType: 'scale_glow', // 'scale_glow' | 'fade_pulse' | 'pop_in' | 'smooth_fade'
    animDuration: 0.8, // seconds (daha belirgin ve akıcı)
  },
  checkmark: {
    enabled: true,
    position: 'right', // 'right' | 'left' | 'top_right' | 'inside_right'
    style: 'badge',    // 'badge' | 'plain'
  },
  timestamp: 0.0, // seconds
  export: {
    resolution: 'original', // 'original' | '1080p' | '720p'
    fps: 30,
  },
  interaction: {
    isDrawing: false,
    isDragging: false,
    activeHandle: null,
    startX: 0,
    startY: 0,
    boxStartX: 0,
    boxStartY: 0,
    boxStartW: 0,
    boxStartH: 0,
  },
  playback: {
    isPlaying: false,
    currentTime: 0,
    isTestPlaying: false,
    animTestStartTime: null,
  },
  rendering: {
    isRendering: false,
    cancelled: false,
  }
};

// DOM Elemanları
const DOM = {
  // Canvases
  viewport: document.getElementById('canvas-viewport'),
  canvas: document.getElementById('interactive-canvas'),
  emptyState: document.getElementById('canvas-empty-state'),
  canvasHint: document.getElementById('canvas-hint'),
  resInfo: document.getElementById('canvas-resolution-info'),
  btnZoomFit: document.getElementById('btn-zoom-fit'),

  // Tools
  toolShapeRect: document.getElementById('tool-shape-rect'),
  toolShapeEllipse: document.getElementById('tool-shape-ellipse'),
  btnClearBox: document.getElementById('btn-clear-box'),

  // Waveform & Audio
  btnAudioPlay: document.getElementById('btn-audio-play'),
  btnAudioBack: document.getElementById('btn-audio-back'),
  btnAudioForward: document.getElementById('btn-audio-forward'),
  audioCurrentTime: document.getElementById('audio-current-time'),
  audioTotalTime: document.getElementById('audio-total-time'),
  btnMarkTimestamp: document.getElementById('btn-mark-timestamp'),
  btnPreviewHighlight: document.getElementById('btn-preview-highlight'),
  badgeMarkedTime: document.getElementById('badge-marked-time'),
  waveformContainer: document.getElementById('waveform-container'),
  waveformTimeline: document.getElementById('waveform-timeline'),
  audioEmptyNotice: document.getElementById('audio-empty-notice'),
  nativeAudio: document.getElementById('native-audio'),

  // File Inputs
  inputImageFile: document.getElementById('input-image-file'),
  inputAudioFile: document.getElementById('input-audio-file'),
  labelImageName: document.getElementById('label-image-name'),
  labelImageSize: document.getElementById('label-image-size'),
  labelAudioName: document.getElementById('label-audio-name'),
  labelAudioSize: document.getElementById('label-audio-size'),

  // Highlight Styling Controls
  cfgColorFill: document.getElementById('cfg-color-fill'),
  textColorFill: document.getElementById('text-color-fill'),
  cfgOpacity: document.getElementById('cfg-opacity'),
  textOpacity: document.getElementById('text-opacity'),
  cfgBorderWidth: document.getElementById('cfg-border-width'),
  textBorderWidth: document.getElementById('text-border-width'),
  cfgBorderRadius: document.getElementById('cfg-border-radius'),
  textBorderRadius: document.getElementById('text-border-radius'),
  cfgAnimType: document.getElementById('cfg-anim-type'),
  cfgAnimDuration: document.getElementById('cfg-anim-duration'),
  textAnimDuration: document.getElementById('text-anim-duration'),
  cfgGlowToggle: document.getElementById('cfg-glow-toggle'),
  btnPreviewAnimOnly: document.getElementById('btn-preview-anim-only'),

  // Checkmark Styling Controls
  cfgCheckmarkToggle: document.getElementById('cfg-checkmark-toggle'),
  cfgCheckmarkPos: document.getElementById('cfg-checkmark-pos'),
  cfgCheckmarkStyle: document.getElementById('cfg-checkmark-style'),
  checkmarkOptionsContainer: document.getElementById('checkmark-options-container'),

  // Timestamp manual
  inputTimestampManual: document.getElementById('input-timestamp-manual'),
  btnNudgeTimeDown: document.getElementById('btn-nudge-time-down'),
  btnNudgeTimeUp: document.getElementById('btn-nudge-time-up'),

  // Export
  exportEngine: document.getElementById('export-engine'),
  exportResolution: document.getElementById('export-resolution'),
  exportFps: document.getElementById('export-fps'),
  btnStartRender: document.getElementById('btn-start-render'),
  btnCopyFfmpeg: document.getElementById('btn-copy-ffmpeg'),

  // Modals
  modalRender: document.getElementById('modal-render'),
  modalRenderTitle: document.getElementById('modal-render-title'),
  renderProgressBar: document.getElementById('render-progress-bar'),
  renderPercentText: document.getElementById('render-percent-text'),
  renderStatusText: document.getElementById('render-status-text'),
  renderPreviewCanvas: document.getElementById('render-preview-canvas'),
  renderedVideoPlayer: document.getElementById('rendered-video-player'),
  renderCompletedActions: document.getElementById('render-completed-actions'),
  btnDownloadVideo: document.getElementById('btn-download-video'),
  btnCloseRenderModal: document.getElementById('btn-close-render-modal'),
  btnCancelRender: document.getElementById('btn-cancel-render'),

  modalShortcuts: document.getElementById('modal-shortcuts'),
  btnShortcuts: document.getElementById('btn-shortcuts'),

  modalFfmpeg: document.getElementById('modal-ffmpeg'),
  ffmpegCommandText: document.getElementById('ffmpeg-command-text'),
  btnCopyFfmpegText: document.getElementById('btn-copy-ffmpeg-text'),

  // Quick Action
  btnLoadDemo: document.getElementById('btn-load-demo'),
  btnResetAll: document.getElementById('btn-reset-all'),

  // Stepper
  stepBadge1: document.getElementById('step-badge-1'),
  stepBadge2: document.getElementById('step-badge-2'),
  stepBadge3: document.getElementById('step-badge-3'),
  stepBadge4: document.getElementById('step-badge-4'),
  stepBadge5: document.getElementById('step-badge-5'),
};

const ctx = DOM.canvas.getContext('2d');
let wavesurfer = null;

// ==========================================
// 1. BAŞLANGIÇ & DALGA FORMU (WAVESURFER)
// ==========================================
function initWaveSurfer() {
  if (typeof WaveSurfer === 'undefined') {
    console.error('WaveSurfer kütüphanesi yüklenemedi!');
    return;
  }

  wavesurfer = WaveSurfer.create({
    container: '#waveform-container',
    waveColor: '#334155',
    progressColor: '#10b981',
    cursorColor: '#22c55e',
    cursorWidth: 2,
    height: 64,
    barWidth: 2,
    barGap: 1.5,
    barRadius: 2,
    responsive: true,
  });

  wavesurfer.on('ready', () => {
    State.audio.duration = wavesurfer.getDuration();
    DOM.audioTotalTime.textContent = formatTime(State.audio.duration);
    DOM.btnAudioPlay.disabled = false;
    DOM.btnMarkTimestamp.disabled = false;
    DOM.btnPreviewHighlight.disabled = false;
    updateRenderButtonState();
    updateStepIndicator();
  });

  wavesurfer.on('timeupdate', (currentTime) => {
    State.playback.currentTime = currentTime;
    DOM.audioCurrentTime.textContent = formatTime(currentTime);
    renderCanvas();
  });

  wavesurfer.on('play', () => {
    State.playback.isPlaying = true;
    updatePlayIcon(true);
  });

  wavesurfer.on('pause', () => {
    State.playback.isPlaying = false;
    updatePlayIcon(false);
    renderCanvas();
  });

  wavesurfer.on('finish', () => {
    State.playback.isPlaying = false;
    updatePlayIcon(false);
    renderCanvas();
  });
}

function updatePlayIcon(isPlaying) {
  const icon = DOM.btnAudioPlay.querySelector('i');
  if (icon) {
    icon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
    lucide.createIcons({ root: DOM.btnAudioPlay });
  }
}

// ==========================================
// 2. DOSYA YÜKLEME VE YÖNETİMİ
// ==========================================
function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      State.image.file = file;
      State.image.element = img;
      State.image.naturalWidth = img.naturalWidth;
      State.image.naturalHeight = img.naturalHeight;
      State.image.url = e.target.result;

      DOM.labelImageName.textContent = file.name;
      DOM.labelImageSize.textContent = `${img.naturalWidth}x${img.naturalHeight}px • ${(file.size / 1024).toFixed(1)} KB`;
      DOM.resInfo.textContent = `${img.naturalWidth} x ${img.naturalHeight} px`;

      DOM.emptyState.classList.add('hidden');
      DOM.canvas.classList.remove('hidden');
      DOM.canvasHint.classList.remove('hidden');

      fitCanvasToViewport();
      renderCanvas();
      updateRenderButtonState();
      updateStepIndicator();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleAudioUpload(file) {
  if (!file || !file.type.startsWith('audio/')) {
    alert('Lütfen geçerli bir ses dosyası seçin (MP3, WAV, M4A).');
    return;
  }

  State.audio.file = file;
  DOM.labelAudioName.textContent = file.name;
  DOM.labelAudioSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type.split('/')[1].toUpperCase()}`;

  DOM.audioEmptyNotice.classList.add('hidden');
  DOM.waveformContainer.classList.remove('hidden');

  const audioUrl = URL.createObjectURL(file);
  State.audio.url = audioUrl;
  wavesurfer.load(audioUrl);
}

// Drag & Drop Desteği
DOM.viewport.addEventListener('dragover', (e) => {
  e.preventDefault();
  DOM.viewport.classList.add('border-emerald-500', 'bg-emerald-950/20');
});

DOM.viewport.addEventListener('dragleave', (e) => {
  e.preventDefault();
  DOM.viewport.classList.remove('border-emerald-500', 'bg-emerald-950/20');
});

DOM.viewport.addEventListener('drop', (e) => {
  e.preventDefault();
  DOM.viewport.classList.remove('border-emerald-500', 'bg-emerald-950/20');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    if (files[0].type.startsWith('image/')) {
      handleImageUpload(files[0]);
    } else if (files[0].type.startsWith('audio/')) {
      handleAudioUpload(files[0]);
    }
  }
});

DOM.inputImageFile.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleImageUpload(e.target.files[0]);
});

DOM.inputAudioFile.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleAudioUpload(e.target.files[0]);
});

// ==========================================
// 3. CANVAS BOYUTLANDIRMA VE SIĞDIRMA
// ==========================================
function fitCanvasToViewport() {
  if (!State.image.element) return;

  const vpRect = DOM.viewport.getBoundingClientRect();
  const maxW = vpRect.width - 24;
  const maxH = vpRect.height - 24;

  const imgW = State.image.naturalWidth;
  const imgH = State.image.naturalHeight;

  const scale = Math.min(maxW / imgW, maxH / imgH, 1.0);
  const displayW = Math.round(imgW * scale);
  const displayH = Math.round(imgH * scale);

  DOM.canvas.width = displayW;
  DOM.canvas.height = displayH;
  DOM.canvas.style.width = `${displayW}px`;
  DOM.canvas.style.height = `${displayH}px`;

  State.image.width = displayW;
  State.image.height = displayH;
}

window.addEventListener('resize', () => {
  if (State.image.element) {
    fitCanvasToViewport();
    renderCanvas();
  }
});

DOM.btnZoomFit.addEventListener('click', () => {
  if (State.image.element) {
    fitCanvasToViewport();
    renderCanvas();
  }
});

// ==========================================
// 4. İNTERAKTİF BOUNDING BOX (ÇİZİM & TAŞIMA)
// ==========================================
const HANDLE_RADIUS = 6;
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function getCanvasCoordinates(e) {
  const rect = DOM.canvas.getBoundingClientRect();
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  return {
    x: Math.max(0, Math.min(clientX - rect.left, DOM.canvas.width)),
    y: Math.max(0, Math.min(clientY - rect.top, DOM.canvas.height)),
  };
}

// Ekrana göre ölçeklenmiş kutu
function getDisplayBox() {
  if (!State.box.active || !State.image.naturalWidth) return null;
  const scale = DOM.canvas.width / State.image.naturalWidth;
  return {
    x: State.box.x * scale,
    y: State.box.y * scale,
    w: State.box.width * scale,
    h: State.box.height * scale,
  };
}

function getHandlePositions(b) {
  return {
    nw: { x: b.x, y: b.y },
    n:  { x: b.x + b.w / 2, y: b.y },
    ne: { x: b.x + b.w, y: b.y },
    e:  { x: b.x + b.w, y: b.y + b.h / 2 },
    se: { x: b.x + b.w, y: b.y + b.h },
    s:  { x: b.x + b.w / 2, y: b.y + b.h },
    sw: { x: b.x, y: b.y + b.h },
    w:  { x: b.x, y: b.y + b.h / 2 },
  };
}

function hitTestHandle(pos) {
  const b = getDisplayBox();
  if (!b) return null;
  const handles = getHandlePositions(b);
  for (const h of HANDLES) {
    const hp = handles[h];
    const dist = Math.hypot(pos.x - hp.x, pos.y - hp.y);
    if (dist <= HANDLE_RADIUS + 4) return h;
  }
  return null;
}

function isInsideBox(pos) {
  const b = getDisplayBox();
  if (!b) return false;
  return pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h;
}

function getCursorForHandle(h) {
  switch (h) {
    case 'nw': case 'se': return 'nwse-resize';
    case 'ne': case 'sw': return 'nesw-resize';
    case 'n':  case 's':  return 'ns-resize';
    case 'e':  case 'w':  return 'ew-resize';
    default: return 'default';
  }
}

DOM.canvas.addEventListener('mousedown', (e) => {
  if (!State.image.element) return;
  const pos = getCanvasCoordinates(e);
  const handle = hitTestHandle(pos);

  if (handle) {
    // Tutamaç ile boyutlandırma
    State.interaction.activeHandle = handle;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.interaction.boxStartX = State.box.x;
    State.interaction.boxStartY = State.box.y;
    State.interaction.boxStartW = State.box.width;
    State.interaction.boxStartH = State.box.height;
  } else if (isInsideBox(pos)) {
    // Kutuyu taşıma
    State.interaction.isDragging = true;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.interaction.boxStartX = State.box.x;
    State.interaction.boxStartY = State.box.y;
  } else {
    // Yeni kutu çizme
    const scale = State.image.naturalWidth / DOM.canvas.width;
    State.interaction.isDrawing = true;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.box.x = pos.x * scale;
    State.box.y = pos.y * scale;
    State.box.width = 0;
    State.box.height = 0;
    State.box.active = true;
  }
});

window.addEventListener('mousemove', (e) => {
  if (!State.image.element) return;
  const pos = getCanvasCoordinates(e);
  const scale = State.image.naturalWidth / DOM.canvas.width;

  if (State.interaction.activeHandle) {
    const dx = (pos.x - State.interaction.startX) * scale;
    const dy = (pos.y - State.interaction.startY) * scale;
    const h = State.interaction.activeHandle;

    let nx = State.interaction.boxStartX;
    let ny = State.interaction.boxStartY;
    let nw = State.interaction.boxStartW;
    let nh = State.interaction.boxStartH;

    if (h.includes('e')) nw += dx;
    if (h.includes('w')) { nx += dx; nw -= dx; }
    if (h.includes('s')) nh += dy;
    if (h.includes('n')) { ny += dy; nh -= dy; }

    // Ters dönme koruması
    if (nw > 10) { State.box.x = nx; State.box.width = nw; }
    if (nh > 10) { State.box.y = ny; State.box.height = nh; }
    renderCanvas();
  } else if (State.interaction.isDragging) {
    const dx = (pos.x - State.interaction.startX) * scale;
    const dy = (pos.y - State.interaction.startY) * scale;
    State.box.x = Math.max(0, Math.min(State.interaction.boxStartX + dx, State.image.naturalWidth - State.box.width));
    State.box.y = Math.max(0, Math.min(State.interaction.boxStartY + dy, State.image.naturalHeight - State.box.height));
    renderCanvas();
  } else if (State.interaction.isDrawing) {
    const curNatX = pos.x * scale;
    const curNatY = pos.y * scale;
    const startNatX = State.interaction.startX * scale;
    const startNatY = State.interaction.startY * scale;

    State.box.x = Math.min(startNatX, curNatX);
    State.box.y = Math.min(startNatY, curNatY);
    State.box.width = Math.abs(curNatX - startNatX);
    State.box.height = Math.abs(curNatY - startNatY);
    renderCanvas();
  } else {
    // Fare imleci güncelleme
    const handle = hitTestHandle(pos);
    if (handle) {
      DOM.canvas.style.cursor = getCursorForHandle(handle);
    } else if (isInsideBox(pos)) {
      DOM.canvas.style.cursor = 'move';
    } else {
      DOM.canvas.style.cursor = 'crosshair';
    }
  }
});

window.addEventListener('mouseup', () => {
  if (State.interaction.isDrawing) {
    if (State.box.width < 10 || State.box.height < 10) {
      State.box.active = false;
    } else {
      updateStepIndicator();
    }
  }
  State.interaction.isDrawing = false;
  State.interaction.isDragging = false;
  State.interaction.activeHandle = null;
  updateRenderButtonState();
  renderCanvas();
});

DOM.btnClearBox.addEventListener('click', () => {
  State.box.active = false;
  State.box.width = 0;
  State.box.height = 0;
  updateRenderButtonState();
  updateStepIndicator();
  renderCanvas();
});

// Şekil Seçimi (Dikdörtgen vs Elips)
DOM.toolShapeRect.addEventListener('click', () => {
  State.highlight.shape = 'rect';
  DOM.toolShapeRect.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all';
  DOM.toolShapeEllipse.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all';
  renderCanvas();
});

DOM.toolShapeEllipse.addEventListener('click', () => {
  State.highlight.shape = 'ellipse';
  DOM.toolShapeEllipse.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all';
  DOM.toolShapeRect.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all';
  renderCanvas();
});

// ==========================================
// 5. ANİMASYON VE CANVAS ÇİZİM MOTORU
// ==========================================
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

/**
 * Belirtilen context üzerine kareyi çizer
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} currentTime Oynatma saniyesi
 * @param {boolean} isExporting Video render modu mu?
 */
function drawFrame(targetCtx, currentTime, isExporting = false) {
  const canvasW = targetCtx.canvas.width;
  const canvasH = targetCtx.canvas.height;

  // 1. Arka planı temizle ve soru görselini çiz
  targetCtx.clearRect(0, 0, canvasW, canvasH);
  if (State.image.element) {
    targetCtx.drawImage(State.image.element, 0, 0, canvasW, canvasH);
  }

  if (!State.box.active) return;

  const scale = canvasW / State.image.naturalWidth;
  const bx = State.box.x * scale;
  const by = State.box.y * scale;
  const bw = State.box.width * scale;
  const bh = State.box.height * scale;

  // Vurgu görünürlüğü hesaplama
  const isPlayingAudio = State.playback.isPlaying;
  const isTestingAnim = State.playback.animTestStartTime !== null;
  const hasReachedTimestamp = currentTime >= State.timestamp;

  // Düzenleme modunda mıyız? (Ses çalmıyorsa ve render alınmıyorsa kutu düzenlenebilir görünür)
  const isEditMode = !isPlayingAudio && !isExporting && !isTestingAnim;

  let animProgress = 1.0;
  let showHighlight = false;

  if (isEditMode) {
    // Düzenleme modunda her zaman göster
    showHighlight = true;
    animProgress = 1.0;
  } else if (isTestingAnim) {
    // Canlı animasyon testi yapılıyorsa
    const elapsed = (performance.now() - State.playback.animTestStartTime) / 1000;
    if (elapsed <= State.highlight.animDuration) {
      animProgress = Math.min(1.0, elapsed / State.highlight.animDuration);
      showHighlight = true;
    } else {
      animProgress = 1.0;
      showHighlight = true;
    }
  } else if (hasReachedTimestamp) {
    // Oynatma veya video çıktısında işaretlenen saniye geçildiyse
    const elapsed = currentTime - State.timestamp;
    animProgress = Math.min(1.0, elapsed / State.highlight.animDuration);
    showHighlight = true;
  }

  if (!showHighlight) {
    // Henüz zamanı gelmedi - vurgu çizilmez
    return;
  }

  // Animasyon Skalası ve Opaklık Hesaplama (Göz alıcı ve belirgin dinamik)
  let animScale = 1.0;
  let animAlpha = State.highlight.opacity;
  let glowPulse = 0;

  if (State.highlight.animType === 'scale_glow') {
    // Güçlü Scale-Up: 0.15'ten yaylanarak 1.15'e patlar ve 1.0'a oturur
    const eased = easeOutBack(animProgress);
    animScale = Math.max(0.05, Math.min(1.22, eased));
    animAlpha = State.highlight.opacity * Math.min(1.0, animProgress * 2.2);
    glowPulse = Math.max(0, 1.0 - animProgress);
  } else if (State.highlight.animType === 'fade_pulse') {
    // Yumuşak Fade + Çift Nabız (Pulse)
    animScale = 1.0 + 0.14 * Math.sin(animProgress * Math.PI);
    animAlpha = State.highlight.opacity * easeOutQuad(animProgress);
    glowPulse = Math.sin(animProgress * Math.PI);
  } else if (State.highlight.animType === 'pop_in') {
    // Enerjik Pop-In
    const eased = easeOutBack(animProgress);
    animScale = Math.max(0.05, Math.min(1.25, eased));
    animAlpha = State.highlight.opacity;
    glowPulse = Math.max(0, 1.0 - animProgress);
  } else {
    // Sade Fade-In
    animAlpha = State.highlight.opacity * animProgress;
  }

  // Renk Değerleri
  const hex = State.highlight.color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const radius = State.highlight.borderRadius * scale;
  const centerX = bx + bw / 2;
  const centerY = by + bh / 2;

  // Şekli Merkezden Büyütecek Transform Matrix
  targetCtx.save();
  targetCtx.translate(centerX, centerY);
  targetCtx.scale(animScale, animScale);
  targetCtx.translate(-centerX, -centerY);

  // Parlama (Glow / Neon) Efekti
  if (State.highlight.glow) {
    targetCtx.shadowColor = State.highlight.color;
    targetCtx.shadowBlur = (14 + glowPulse * 24) * scale;
  } else {
    targetCtx.shadowBlur = 0;
  }

  targetCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${animAlpha})`;
  targetCtx.strokeStyle = State.highlight.color;
  targetCtx.lineWidth = State.highlight.borderWidth * scale;

  targetCtx.beginPath();
  if (State.highlight.shape === 'rect') {
    // Yuvarlak Köşeli Dikdörtgen
    if (targetCtx.roundRect) {
      targetCtx.roundRect(bx, by, bw, bh, radius);
    } else {
      drawRoundRectFallback(targetCtx, bx, by, bw, bh, radius);
    }
  } else {
    // Elips
    targetCtx.ellipse(centerX, centerY, bw / 2, bh / 2, 0, 0, 2 * Math.PI);
  }
  targetCtx.fill();
  targetCtx.stroke();

  targetCtx.restore();

  // Dışa Doğru Yayılan Şok Dalgası (Expanding Shockwave Ring)
  if (glowPulse > 0.02) {
    targetCtx.save();
    const shockExpand = (1.0 - glowPulse) * 22 * scale;
    targetCtx.lineWidth = (State.highlight.borderWidth + 2) * scale;
    targetCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.85 * glowPulse})`;
    targetCtx.shadowColor = State.highlight.color;
    targetCtx.shadowBlur = 10 * scale;

    targetCtx.beginPath();
    if (State.highlight.shape === 'rect') {
      const rx = bx - shockExpand;
      const ry = by - shockExpand;
      const rw = bw + shockExpand * 2;
      const rh = bh + shockExpand * 2;
      const rr = radius + shockExpand;
      if (targetCtx.roundRect) targetCtx.roundRect(rx, ry, rw, rh, rr);
      else drawRoundRectFallback(targetCtx, rx, ry, rw, rh, rr);
    } else {
      targetCtx.ellipse(centerX, centerY, (bw / 2) + shockExpand, (bh / 2) + shockExpand, 0, 0, 2 * Math.PI);
    }
    targetCtx.stroke();
    targetCtx.restore();
  }

  // Onay İşareti (Tik ✓) Rozetini Çiz
  if (State.checkmark.enabled) {
    drawAnimatedCheckmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode);
  }

  // Düzenleme modunda tutamaçları (handles) ve kesikli çizgiyi çiz
  if (isEditMode) {
    drawEditHandles(targetCtx, bx, by, bw, bh);
  }
}

/**
 * Cevap anında beliren şık rozet ve el yazısı tarzı animasyonlu onay işareti (✓) çizer
 */
function drawAnimatedCheckmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode) {
  if (!State.checkmark.enabled) return;

  const R = Math.max(14, Math.min(26, bh * 0.42)); // Rozet yarıçapı
  let cx, cy;

  const pos = State.checkmark.position;
  if (pos === 'right') {
    cx = bx + bw + R + 14 * scale;
    cy = by + bh / 2;
  } else if (pos === 'left') {
    cx = bx - R - 14 * scale;
    cy = by + bh / 2;
  } else if (pos === 'top_right') {
    cx = bx + bw + 4 * scale;
    cy = by - 4 * scale;
  } else { // inside_right
    cx = bx + bw - R - 8 * scale;
    cy = by + bh / 2;
  }

  // Animasyon faktörleri
  let badgeScale = 1.0;
  let strokeProgress = 1.0;

  if (!isEditMode) {
    // Rozet girişi: animProgress 0.1 ile 0.65 arasında yaylanarak açılır
    const badgeRaw = Math.max(0, Math.min(1.0, (animProgress - 0.1) / 0.55));
    badgeScale = easeOutBack(badgeRaw);

    // Çizgi çizilme: animProgress 0.25 ile 0.95 arasında el yazısı gibi çizilir
    strokeProgress = Math.max(0, Math.min(1.0, (animProgress - 0.25) / 0.70));
  }

  if (badgeScale <= 0.01) return;

  targetCtx.save();
  targetCtx.translate(cx, cy);
  targetCtx.scale(badgeScale, badgeScale);

  const style = State.checkmark.style;
  const greenHex = State.highlight.color;

  if (style === 'badge') {
    // 1. Daire Rozet (Canlı yeşil dolgu + beyaz kenarlık + neon aura)
    targetCtx.beginPath();
    targetCtx.arc(0, 0, R, 0, 2 * Math.PI);
    targetCtx.fillStyle = greenHex;
    if (State.highlight.glow) {
      targetCtx.shadowColor = greenHex;
      targetCtx.shadowBlur = 12 * scale;
    }
    targetCtx.fill();

    // Beyaz rozet kenarlığı
    targetCtx.strokeStyle = '#ffffff';
    targetCtx.lineWidth = Math.max(1.5, 2.5 * scale);
    targetCtx.stroke();
  }

  // 2. Onay İşareti Çizgisi (✓)
  if (strokeProgress > 0.05) {
    const p0 = { x: -0.42 * R, y: -0.02 * R };
    const p1 = { x: -0.10 * R, y: 0.38 * R };
    const p2 = { x: 0.44 * R, y: -0.36 * R };

    targetCtx.beginPath();
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.lineWidth = Math.max(2.5, (style === 'badge' ? 3.5 : 4.5) * scale);
    targetCtx.strokeStyle = style === 'badge' ? '#ffffff' : greenHex;

    if (style === 'plain' && State.highlight.glow) {
      targetCtx.shadowColor = greenHex;
      targetCtx.shadowBlur = 10 * scale;
    }

    if (strokeProgress <= 0.38) {
      // Birinci kısa kol (P0 -> P1)
      const t = strokeProgress / 0.38;
      targetCtx.moveTo(p0.x, p0.y);
      targetCtx.lineTo(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t);
    } else {
      // Birinci kol tam + İkinci uzun kol (P1 -> P2)
      const t = (strokeProgress - 0.38) / 0.62;
      targetCtx.moveTo(p0.x, p0.y);
      targetCtx.lineTo(p1.x, p1.y);
      targetCtx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
    }
    targetCtx.stroke();
  }

  targetCtx.restore();
}

function drawRoundRectFallback(c, x, y, w, h, r) {
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
}

function drawEditHandles(c, bx, by, bw, bh) {
  c.save();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  c.strokeRect(bx, by, bw, bh);
  c.setLineDash([]);

  const handles = getHandlePositions({ x: bx, y: by, w: bw, h: bh });
  for (const h of HANDLES) {
    const hp = handles[h];
    c.beginPath();
    c.arc(hp.x, hp.y, HANDLE_RADIUS, 0, 2 * Math.PI);
    c.fillStyle = '#10b981';
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.stroke();
  }
  c.restore();
}

function renderCanvas() {
  if (!State.image.element) return;
  drawFrame(ctx, State.playback.currentTime, false);
}

// Canlı Animasyon Test Butonu
DOM.btnPreviewAnimOnly.addEventListener('click', () => {
  if (!State.box.active) {
    alert('Önce görsel üzerinde bir cevap alanı çizin!');
    return;
  }
  State.playback.animTestStartTime = performance.now();
  function loop() {
    if (State.playback.animTestStartTime === null) return;
    const elapsed = (performance.now() - State.playback.animTestStartTime) / 1000;
    renderCanvas();
    if (elapsed < State.highlight.animDuration + 0.3) {
      requestAnimationFrame(loop);
    } else {
      State.playback.animTestStartTime = null;
      renderCanvas();
    }
  }
  requestAnimationFrame(loop);
});

// ==========================================
// 6. ZAMAN DAMGASI (TIMESTAMP) BELİRLEME
// ==========================================
function setTimestamp(seconds) {
  State.timestamp = Math.max(0, Math.min(seconds, State.audio.duration || 9999));
  DOM.inputTimestampManual.value = State.timestamp.toFixed(2);
  DOM.badgeMarkedTime.textContent = formatTime(State.timestamp);
  DOM.badgeMarkedTime.classList.remove('bg-emerald-500/10', 'text-emerald-400');
  DOM.badgeMarkedTime.classList.add('bg-emerald-500', 'text-zinc-950', 'neon-glow');
  setTimeout(() => {
    DOM.badgeMarkedTime.classList.remove('neon-glow');
  }, 2000);

  updateFfmpegCommand();
  updateRenderButtonState();
  updateStepIndicator();
  renderCanvas();
}

DOM.btnMarkTimestamp.addEventListener('click', () => {
  if (!wavesurfer) return;
  const current = wavesurfer.getCurrentTime();
  setTimestamp(current);
});

DOM.inputTimestampManual.addEventListener('change', (e) => {
  const val = parseFloat(e.target.value);
  if (!isNaN(val)) setTimestamp(val);
});

DOM.btnNudgeTimeDown.addEventListener('click', () => {
  setTimestamp(State.timestamp - 0.1);
});

DOM.btnNudgeTimeUp.addEventListener('click', () => {
  setTimestamp(State.timestamp + 0.1);
});

// Vurguyu Test Et (Cevap anından 1.5 saniye geriden oynat)
DOM.btnPreviewHighlight.addEventListener('click', () => {
  if (!wavesurfer || State.audio.duration === 0) return;
  const startTime = Math.max(0, State.timestamp - 1.5);
  wavesurfer.seekTo(startTime / State.audio.duration);
  wavesurfer.play();
});

// Ses Kontrolleri
DOM.btnAudioPlay.addEventListener('click', () => {
  if (!wavesurfer) return;
  wavesurfer.playPause();
});

DOM.btnAudioBack.addEventListener('click', () => {
  if (!wavesurfer) return;
  wavesurfer.setTime(Math.max(0, wavesurfer.getCurrentTime() - 2));
});

DOM.btnAudioForward.addEventListener('click', () => {
  if (!wavesurfer) return;
  wavesurfer.setTime(Math.min(State.audio.duration, wavesurfer.getCurrentTime() + 2));
});

// ==========================================
// 7. VURGU VE STİL AYARLARI DİNLENİYOR
// ==========================================
DOM.cfgColorFill.addEventListener('input', (e) => {
  State.highlight.color = e.target.value;
  DOM.textColorFill.textContent = e.target.value.toUpperCase();
  renderCanvas();
});

DOM.cfgOpacity.addEventListener('input', (e) => {
  State.highlight.opacity = parseFloat(e.target.value);
  DOM.textOpacity.textContent = `%${Math.round(State.highlight.opacity * 100)}`;
  renderCanvas();
});

DOM.cfgBorderWidth.addEventListener('input', (e) => {
  State.highlight.borderWidth = parseInt(e.target.value, 10);
  DOM.textBorderWidth.textContent = `${State.highlight.borderWidth}px`;
  renderCanvas();
});

DOM.cfgBorderRadius.addEventListener('input', (e) => {
  State.highlight.borderRadius = parseInt(e.target.value, 10);
  DOM.textBorderRadius.textContent = `${State.highlight.borderRadius}px`;
  renderCanvas();
});

DOM.cfgAnimType.addEventListener('change', (e) => {
  State.highlight.animType = e.target.value;
});

DOM.cfgAnimDuration.addEventListener('input', (e) => {
  State.highlight.animDuration = parseFloat(e.target.value);
  DOM.textAnimDuration.textContent = `${State.highlight.animDuration.toFixed(1)}s`;
});

DOM.cfgGlowToggle.addEventListener('change', (e) => {
  State.highlight.glow = e.target.checked;
  renderCanvas();
});

// Onay İşareti (Tik ✓) Dinleyicileri
DOM.cfgCheckmarkToggle.addEventListener('change', (e) => {
  State.checkmark.enabled = e.target.checked;
  if (DOM.checkmarkOptionsContainer) {
    DOM.checkmarkOptionsContainer.style.display = e.target.checked ? 'grid' : 'none';
  }
  renderCanvas();
});

DOM.cfgCheckmarkPos.addEventListener('change', (e) => {
  State.checkmark.position = e.target.value;
  renderCanvas();
});

DOM.cfgCheckmarkStyle.addEventListener('change', (e) => {
  State.checkmark.style = e.target.value;
  renderCanvas();
});

// ==========================================
// 8. KLAVYE KISAYOLLARI
// ==========================================
window.addEventListener('keydown', (e) => {
  // Input elemanları içindeyken kısayolları engelle
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (wavesurfer && State.audio.duration > 0) wavesurfer.playPause();
  } else if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    if (wavesurfer && State.audio.duration > 0) {
      setTimestamp(wavesurfer.getCurrentTime());
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (State.box.active) {
      e.preventDefault();
      DOM.btnClearBox.click();
    }
  } else if (e.key === 'p' || e.key === 'P') {
    if (wavesurfer && State.audio.duration > 0) {
      DOM.btnPreviewHighlight.click();
    }
  } else if (State.box.active && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') State.box.x = Math.max(0, State.box.x - step);
    if (e.key === 'ArrowRight') State.box.x = Math.min(State.image.naturalWidth - State.box.width, State.box.x + step);
    if (e.key === 'ArrowUp') State.box.y = Math.max(0, State.box.y - step);
    if (e.key === 'ArrowDown') State.box.y = Math.min(State.image.naturalHeight - State.box.height, State.box.y + step);
    renderCanvas();
  }
});

DOM.btnShortcuts.addEventListener('click', () => {
  DOM.modalShortcuts.classList.remove('hidden');
});

// ==========================================
// 9. VİDEO RENDER VE DIŞA AKTARMA (EXPORT)
// ==========================================
function updateRenderButtonState() {
  const ready = State.image.element !== null && State.audio.file !== null && State.box.active;
  DOM.btnStartRender.disabled = !ready;
}

function updateStepIndicator() {
  const s1 = State.image.element && State.audio.file;
  const s2 = State.box.active;
  const s3 = State.timestamp > 0;
  const s4 = true;
  const s5 = s1 && s2;

  setStepStatus(DOM.stepBadge1, s1);
  setStepStatus(DOM.stepBadge2, s2);
  setStepStatus(DOM.stepBadge3, s3);
  setStepStatus(DOM.stepBadge4, s4);
  setStepStatus(DOM.stepBadge5, s5);
}

function setStepStatus(badge, isDone) {
  if (!badge) return;
  const circle = badge.querySelector('span');
  if (isDone) {
    badge.className = 'flex items-center gap-2 text-emerald-400 font-semibold';
    if (circle) circle.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400';
  } else {
    badge.className = 'flex items-center gap-2 text-zinc-500';
    if (circle) circle.className = 'w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-500';
  }
}

/**
 * WebCodecs + MP4-Muxer ile Donanım Hızlandırmalı Çevrimdışı Ultra Hızlı Render (2-3 Saniye!)
 */
async function renderWithWebCodecs(targetW, targetH, fps, decodedAudioBuffer) {
  const totalDuration = decodedAudioBuffer.duration;
  const sampleRate = decodedAudioBuffer.sampleRate;
  const numberOfChannels = Math.min(2, decodedAudioBuffer.numberOfChannels);

  // 1. MP4 Muxer başlat
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: targetW,
      height: targetH,
    },
    audio: {
      codec: 'aac',
      numberOfChannels: numberOfChannels,
      sampleRate: sampleRate,
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // 2. VideoEncoder başlat
  let videoError = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      console.error('VideoEncoder Hatası:', e);
      videoError = e;
    },
  });

  const videoConfig = {
    codec: 'avc1.4d002a', // H.264
    width: targetW,
    height: targetH,
    bitrate: 6_000_000,
    framerate: fps,
  };

  const videoSupport = await VideoEncoder.isConfigSupported(videoConfig);
  if (!videoSupport.supported) {
    throw new Error('H.264 donanım enkoderi desteklenmiyor');
  }
  videoEncoder.configure(videoConfig);

  // 3. AudioEncoder başlat
  let audioError = null;
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => {
      console.error('AudioEncoder Hatası:', e);
      audioError = e;
    },
  });

  const audioConfig = {
    codec: 'mp4a.40.2',
    numberOfChannels: numberOfChannels,
    sampleRate: sampleRate,
    bitrate: 128_000,
  };

  const audioSupport = await AudioEncoder.isConfigSupported(audioConfig);
  if (!audioSupport.supported) {
    throw new Error('AAC ses enkoderi desteklenmiyor');
  }
  audioEncoder.configure(audioConfig);

  DOM.renderStatusText.textContent = '⚡ Ses verisi donanım hızlandırmayla kodlanıyor...';

  // Sesi AudioData bloklarına böl ve encode et
  const chunkSize = 2048;
  const totalSamples = decodedAudioBuffer.length;
  for (let offset = 0; offset < totalSamples; offset += chunkSize) {
    const currentChunkSize = Math.min(chunkSize, totalSamples - offset);
    const planarBuffer = new Float32Array(currentChunkSize * numberOfChannels);

    for (let ch = 0; ch < numberOfChannels; ch++) {
      const channelData = decodedAudioBuffer.getChannelData(ch).subarray(offset, offset + currentChunkSize);
      planarBuffer.set(channelData, ch * currentChunkSize);
    }

    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: sampleRate,
      numberOfChannels: numberOfChannels,
      numberOfFrames: currentChunkSize,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: planarBuffer,
    });

    audioEncoder.encode(audioData);
    audioData.close();
  }
  await audioEncoder.flush();

  // 4. Kareleri donanım hızında çiz ve VideoEncoder'a gönder
  const totalFrames = Math.ceil(totalDuration * fps);
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = targetW;
  renderCanvas.height = targetH;
  const renderCtx = renderCanvas.getContext('2d');
  const previewCtx = DOM.renderPreviewCanvas.getContext('2d');

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    if (State.rendering.cancelled || videoError) break;

    const timeSec = frameIndex / fps;
    drawFrame(renderCtx, timeSec, true);

    const videoFrame = new VideoFrame(renderCanvas, {
      timestamp: Math.round(timeSec * 1_000_000),
    });

    const isKeyframe = frameIndex % (fps * 2) === 0;
    videoEncoder.encode(videoFrame, { keyFrame: isKeyframe });
    videoFrame.close();

    // İlerlemeyi güncelle
    if (frameIndex % 8 === 0 || frameIndex === totalFrames - 1) {
      const percent = Math.min(100, Math.round(((frameIndex + 1) / totalFrames) * 100));
      DOM.renderProgressBar.style.width = `${percent}%`;
      DOM.renderPercentText.textContent = `%${percent}`;
      DOM.renderStatusText.textContent = `⚡ Donanım Hızlandırma: Kare ${frameIndex + 1} / ${totalFrames} (%${percent})`;

      previewCtx.clearRect(0, 0, DOM.renderPreviewCanvas.width, DOM.renderPreviewCanvas.height);
      previewCtx.drawImage(renderCanvas, 0, 0, DOM.renderPreviewCanvas.width, DOM.renderPreviewCanvas.height);

      if (videoEncoder.encodeQueueSize > 10) {
        await new Promise(r => setTimeout(r, 2));
      }
    }
  }

  if (State.rendering.cancelled || videoError) {
    videoEncoder.close();
    audioEncoder.close();
    return null;
  }

  DOM.renderStatusText.textContent = 'MP4 dosyası paketleniyor...';
  await videoEncoder.flush();
  videoEncoder.close();
  audioEncoder.close();

  muxer.finalize();
  const buffer = muxer.target.buffer;
  return new Blob([buffer], { type: 'video/mp4' });
}

/**
 * Standart MediaRecorder ile Gerçek Zamanlı Video Kayıt Motoru (Evrensel Yedek)
 */
async function renderWithMediaRecorder(targetW, targetH, fps, decodedAudioBuffer, audioContext) {
  const totalDuration = decodedAudioBuffer.duration;
  const audioDestination = audioContext.createMediaStreamDestination();
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = decodedAudioBuffer;
  audioSource.connect(audioDestination);

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = targetW;
  renderCanvas.height = targetH;
  const renderCtx = renderCanvas.getContext('2d');
  const previewCtx = DOM.renderPreviewCanvas.getContext('2d');

  const canvasStream = renderCanvas.captureStream(fps);
  const videoTrack = canvasStream.getVideoTracks()[0];
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks()
  ]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  let fileExtension = 'webm';

  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
    mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
    fileExtension = 'mp4';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
    fileExtension = 'mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    mimeType = 'video/webm;codecs=vp8,opus';
    fileExtension = 'webm';
  }

  const recordedChunks = [];
  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  const renderPromise = new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      resolve({ blob: videoBlob, ext: fileExtension });
    };
    mediaRecorder.onerror = (err) => reject(err);
  });

  mediaRecorder.start(200);
  audioSource.start(0);

  const startPerfTime = performance.now();
  const frameIntervalMs = 1000 / fps;

  DOM.renderStatusText.textContent = `Standart render işleniyor (${fps} FPS • ${targetW}x${targetH})...`;

  while (!State.rendering.cancelled) {
    const elapsed = (performance.now() - startPerfTime) / 1000;

    drawFrame(renderCtx, elapsed, true);

    if (videoTrack && videoTrack.requestFrame) {
      try { videoTrack.requestFrame(); } catch (err) {}
    }

    previewCtx.clearRect(0, 0, DOM.renderPreviewCanvas.width, DOM.renderPreviewCanvas.height);
    previewCtx.drawImage(renderCanvas, 0, 0, DOM.renderPreviewCanvas.width, DOM.renderPreviewCanvas.height);

    const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const remainingSec = Math.max(0, Math.ceil(totalDuration - elapsed));
    const remM = Math.floor(remainingSec / 60).toString().padStart(2, '0');
    const remS = Math.floor(remainingSec % 60).toString().padStart(2, '0');

    DOM.renderProgressBar.style.width = `${percent}%`;
    DOM.renderPercentText.textContent = `%${percent}`;
    DOM.renderStatusText.textContent = `İşleniyor: ${formatTime(elapsed)} / ${formatTime(totalDuration)} (Kalan: ${remM}:${remS})`;

    if (elapsed >= totalDuration) {
      break;
    }

    await new Promise(r => setTimeout(r, frameIntervalMs));
  }

  if (State.rendering.cancelled) {
    mediaRecorder.stop();
    audioSource.stop();
    return null;
  }

  await new Promise(r => setTimeout(r, 400));

  DOM.renderStatusText.textContent = 'Son video dosyası paketleniyor...';
  mediaRecorder.stop();
  audioSource.stop();

  return await renderPromise;
}

/**
 * Ana Video Render Başlatıcı
 */
async function startVideoRender() {
  if (!State.image.element || !State.audio.file || !State.box.active) {
    alert('Lütfen soru görselini, ses kaydını yükleyin ve doğru cevabın alanını çizin!');
    return;
  }

  // Dalga formunu durdur
  if (wavesurfer) wavesurfer.pause();

  State.rendering.isRendering = true;
  State.rendering.cancelled = false;

  // Modalı göster
  DOM.modalRender.classList.remove('hidden');
  DOM.modalRenderTitle.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 text-emerald-400 animate-spin"></i><span>Video Render Ediliyor...</span>`;
  DOM.renderCompletedActions.classList.add('hidden');
  DOM.renderedVideoPlayer.classList.add('hidden');
  DOM.renderPreviewCanvas.classList.remove('hidden');
  DOM.renderProgressBar.style.width = '0%';
  DOM.renderPercentText.textContent = '%0';
  DOM.renderStatusText.textContent = 'Ses verisi çözümleniyor...';
  lucide.createIcons({ root: DOM.modalRenderTitle });

  try {
    // 1. Çözünürlük Belirleme
    let targetW = State.image.naturalWidth;
    let targetH = State.image.naturalHeight;
    const resChoice = DOM.exportResolution.value;

    if (resChoice === '1080p') {
      const aspect = targetW / targetH;
      targetW = 1920;
      targetH = Math.round(1920 / aspect);
    } else if (resChoice === '720p') {
      const aspect = targetW / targetH;
      targetW = 1280;
      targetH = Math.round(1280 / aspect);
    }

    // Çift sayı piksel zorunluluğu (H.264 video codec uyumluluğu için)
    targetW = targetW % 2 === 0 ? targetW : targetW + 1;
    targetH = targetH % 2 === 0 ? targetH : targetH + 1;

    const fps = parseInt(DOM.exportFps.value, 10) || 30;

    // 2. Gizli Render Canvası Oluştur
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = targetW;
    renderCanvas.height = targetH;
    const renderCtx = renderCanvas.getContext('2d');

    // Önizleme canvasını ayarla
    DOM.renderPreviewCanvas.width = 640;
    DOM.renderPreviewCanvas.height = Math.round(640 * (targetH / targetW));
    const previewCtx = DOM.renderPreviewCanvas.getContext('2d');

    // 3. Web Audio API Kurulumu
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioArrayBuffer = await State.audio.file.arrayBuffer();
    const decodedAudioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);

    let blob = null;
    let ext = 'mp4';

    const useFast = DOM.exportEngine && DOM.exportEngine.value === 'fast';
    const canUseWebCodecs = typeof VideoEncoder !== 'undefined' && 
                            typeof AudioEncoder !== 'undefined' && 
                            typeof AudioData !== 'undefined' && 
                            typeof Mp4Muxer !== 'undefined';

    if (useFast && canUseWebCodecs) {
      try {
        blob = await renderWithWebCodecs(targetW, targetH, fps, decodedAudioBuffer);
        ext = 'mp4';
      } catch (fastErr) {
        console.warn('WebCodecs ultra hızlı render başlatılamadı, MediaRecorder moduna geçiliyor:', fastErr);
        blob = null;
      }
    }

    // WebCodecs desteklenmiyorsa veya hata verirse MediaRecorder ile devam et
    if (!blob && !State.rendering.cancelled) {
      const res = await renderWithMediaRecorder(targetW, targetH, fps, decodedAudioBuffer, audioContext);
      if (res) {
        blob = res.blob;
        ext = res.ext;
      }
    }

    if (State.rendering.cancelled || !blob) {
      audioContext.close();
      return;
    }

    audioContext.close();

    // Render Bitti: Videoyu Önizleme Oynatıcıya ve İndirme Bağlantısına Ver
    const videoUrl = URL.createObjectURL(blob);
    DOM.renderedVideoPlayer.src = videoUrl;
    DOM.renderedVideoPlayer.classList.remove('hidden');
    DOM.renderPreviewCanvas.classList.add('hidden');

    DOM.btnDownloadVideo.href = videoUrl;
    DOM.btnDownloadVideo.download = `soru_cozumu_${Date.now()}.${ext}`;
    DOM.btnDownloadVideo.querySelector('span').textContent = `${ext.toUpperCase()} Videoyu İndir (${(blob.size / 1024 / 1024).toFixed(1)} MB)`;

    DOM.renderProgressBar.style.width = '100%';
    DOM.renderPercentText.textContent = '%100';
    DOM.renderStatusText.textContent = 'Render başarıyla tamamlandı!';
    DOM.modalRenderTitle.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i><span>Video Hazır!</span>`;
    DOM.renderCompletedActions.classList.remove('hidden');
    lucide.createIcons({ root: DOM.modalRenderTitle });

  } catch (error) {
    console.error('Render Hatası:', error);
    alert('Video oluşturulurken bir hata meydana geldi: ' + error.message);
    DOM.modalRender.classList.add('hidden');
  } finally {
    State.rendering.isRendering = false;
  }
}

DOM.btnStartRender.addEventListener('click', startVideoRender);

DOM.btnCancelRender.addEventListener('click', () => {
  State.rendering.cancelled = true;
  DOM.modalRender.classList.add('hidden');
});

DOM.btnCloseRenderModal.addEventListener('click', () => {
  DOM.modalRender.classList.add('hidden');
});

// ==========================================
// 10. FFMPEG CLI KOMUT ÜRETİCİ
// ==========================================
function updateFfmpegCommand() {
  if (!State.image.naturalWidth || !State.box.active) {
    DOM.ffmpegCommandText.textContent = '# Lütfen önce soru görselini yükleyin ve alanı belirleyin.';
    return;
  }

  const bx = Math.round(State.box.x);
  const by = Math.round(State.box.y);
  const bw = Math.round(State.box.width);
  const bh = Math.round(State.box.height);
  const ts = State.timestamp.toFixed(2);
  const hex = State.highlight.color.replace('#', '0x');

  const cmd = `ffmpeg -loop 1 -i soru.png -i ses.mp3 -filter_complex "[0:v]drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=${hex}@0.35:t=fill:enable='gte(t,${ts})',drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=${hex}:t=4:enable='gte(t,${ts})'[v]" -map "[v]" -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -y cikti.mp4`;

  DOM.ffmpegCommandText.textContent = cmd;
}

DOM.btnCopyFfmpeg.addEventListener('click', () => {
  updateFfmpegCommand();
  DOM.modalFfmpeg.classList.remove('hidden');
});

DOM.btnCopyFfmpegText.addEventListener('click', () => {
  navigator.clipboard.writeText(DOM.ffmpegCommandText.textContent).then(() => {
    alert('FFmpeg komutu panoya kopyalandı!');
  });
});

// ==========================================
// 11. ÖRNEK DEMO YÜKLEYİCİ (1-TIK TEST)
// ==========================================
DOM.btnLoadDemo.addEventListener('click', () => {
  // 1. Örnek Soru Görseli Üret (1920x1080 Yüksek Çözünürlüklü Matematik/Geometri Sorusu)
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 1600;
  demoCanvas.height = 1000;
  const dctx = demoCanvas.getContext('2d');

  // Arka plan: Şık koyu eğitim kartı
  dctx.fillStyle = '#0f172a';
  dctx.fillRect(0, 0, 1600, 1000);

  // Kart Çerçevesi
  dctx.fillStyle = '#1e293b';
  dctx.beginPath();
  if (dctx.roundRect) dctx.roundRect(80, 80, 1440, 840, 24);
  else dctx.rect(80, 80, 1440, 840);
  dctx.fill();

  // Başlık / Ders Etiketi
  dctx.fillStyle = '#10b981';
  dctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  dctx.fillText('TYT - AYT GEOMETRİ • ÖZEL ÜÇGENLER', 140, 160);

  // Soru Metni
  dctx.fillStyle = '#f8fafc';
  dctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  dctx.fillText('SORU 1:', 140, 240);
  dctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
  dctx.fillText('ABC bir dik üçgen olup [AB] ⊥ [BC] olarak verilmiştir.', 140, 300);
  dctx.fillText('|AB| = 5 cm ve |BC| = 12 cm olduğuna göre,', 140, 350);
  dctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
  dctx.fillStyle = '#38bdf8';
  dctx.fillText('|AC| = x hipotenüs uzunluğu kaç cm\'dir?', 140, 400);

  // Geometrik Çizim (Dik Üçgen)
  dctx.strokeStyle = '#94a3b8';
  dctx.lineWidth = 6;
  dctx.beginPath();
  dctx.moveTo(1150, 480);
  dctx.lineTo(1150, 240); // A noktası
  dctx.lineTo(1420, 480); // C noktası
  dctx.closePath();
  dctx.stroke();

  // Harfler ve kenar uzunlukları
  dctx.fillStyle = '#38bdf8';
  dctx.font = 'bold 26px sans-serif';
  dctx.fillText('A', 1140, 220);
  dctx.fillText('B', 1120, 510);
  dctx.fillText('C', 1440, 500);

  dctx.fillStyle = '#fbbf24';
  dctx.fillText('5 cm', 1060, 360);
  dctx.fillText('12 cm', 1260, 520);
  dctx.fillStyle = '#34d399';
  dctx.fillText('x = ?', 1310, 340);

  // Şıklar
  const choices = [
    { label: 'A)  10 cm', y: 510 },
    { label: 'B)  11 cm', y: 590 },
    { label: 'C)  13 cm (5-12-13 Özel Üçgeni)', y: 670, isCorrect: true },
    { label: 'D)  15 cm', y: 750 },
    { label: 'E)  17 cm', y: 830 },
  ];

  choices.forEach((c) => {
    dctx.fillStyle = '#cbd5e1';
    dctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
    dctx.fillText(c.label, 140, c.y);
  });

  // Görseli Blob olarak yükle
  demoCanvas.toBlob((imgBlob) => {
    const imgFile = new File([imgBlob], 'ornek_geometri_sorusu.png', { type: 'image/png' });
    handleImageUpload(imgFile);

    // Otomatik C şıkkını bounding box olarak işaretle
    setTimeout(() => {
      State.box = {
        x: 120,
        y: 625,
        width: 620,
        height: 60,
        active: true,
      };
      setTimestamp(2.50); // 2.50 saniyede vurgu patlasın
      renderCanvas();
    }, 300);
  });

  // 2. Demo Ses Dosyası Üret (Eğitici Synth Audio: 6 saniye süren ses)
  generateDemoAudio();
});

function generateDemoAudio() {
  const sampleRate = 44100;
  const duration = 5.5; // 5.5 saniye
  const numFrames = sampleRate * duration;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = audioCtx.createBuffer(1, numFrames, sampleRate);
  const data = buffer.getChannelData(0);

  // Melodik ve anlaşılır öğretici bir ses akışı oluştur
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    // Arka plan anlatım hissi veren yumuşak modüle tonlar
    let wave = 0;
    if (t < 2.5) {
      wave = Math.sin(2 * Math.PI * 220 * t) * 0.15 + Math.sin(2 * Math.PI * 440 * t) * 0.05;
    } else {
      // Doğru cevap açıklandığında (2.5s) pozitif yükselen başarı akordu
      wave = Math.sin(2 * Math.PI * 523.25 * t) * 0.25 + Math.sin(2 * Math.PI * 659.25 * t) * 0.20;
    }
    // Fade in & out
    const env = Math.min(1, t * 5) * Math.min(1, (duration - t) * 5);
    data[i] = wave * env;
  }

  // WAV formatına encode et
  const wavBlob = bufferToWave(buffer, numFrames);
  const audioFile = new File([wavBlob], 'ornek_anlatim_sesi.wav', { type: 'audio/wav' });
  handleAudioUpload(audioFile);
}

// Float32Array PCM'i standart WAV Blob'una dönüştürür
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([out], { type: 'audio/wav' });
}

// Sıfırla Butonu
DOM.btnResetAll.addEventListener('click', () => {
  if (confirm('Tüm yüklenen dosyaları ve ayarları sıfırlamak istiyor musunuz?')) {
    location.reload();
  }
});

// Yardımcı Süre Formatı (00:00.00)
function formatTime(sec) {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Başlangıç Kurulumu
window.addEventListener('DOMContentLoaded', () => {
  initWaveSurfer();
});
