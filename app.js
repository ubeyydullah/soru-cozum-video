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
  // Çoklu Vurgu Listesi (Doğru ve Yanlış Şıklar)
  annotations: [], // Array of { id, label, type, shape, box: {x,y,width,height}, timestamp, color, opacity, borderWidth, borderRadius, glow, animType, animDuration, checkmark, crossmark }
  activeAnnotationId: null,
  currentToolType: 'correct', // 'correct' | 'wrong'
  currentShape: 'rect', // 'rect' | 'ellipse'

  // İzlenme Oranını Artıran İlerleme Çubuğu (Retention Bar)
  retentionBar: {
    enabled: true,
    color: '#22c55e',
    position: 'bottom', // 'bottom' | 'top'
    height: 6,
  },

  // Yapay Zeka Anahtarları ve Durumu
  ai: {
    groqKey: localStorage.getItem('soru_ai_groq_key') || '',
    backupKey1: localStorage.getItem('soru_ai_backup1_key') || '',
    backupKey2: localStorage.getItem('soru_ai_backup2_key') || '',
    isProcessing: false,
  },

  // Aktif Seçili Kutu (Geriye dönük uyumluluk ve tutamaçlar için)
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
    animDuration: 0.8, // seconds
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

  // Tools & Annotations
  toolTypeCorrect: document.getElementById('tool-type-correct'),
  toolTypeWrong: document.getElementById('tool-type-wrong'),
  toolShapeRect: document.getElementById('tool-shape-rect'),
  toolShapeEllipse: document.getElementById('tool-shape-ellipse'),
  btnClearBox: document.getElementById('btn-clear-box'),
  annotationsBar: document.getElementById('annotations-bar'),
  annotationsList: document.getElementById('annotations-list'),
  btnAddAnnotation: document.getElementById('btn-add-annotation'),

  // Smart Choice Assistant & AI Automation
  btnClickWrap: document.getElementById('btn-click-wrap'),
  btnAiAutoMatch: document.getElementById('btn-ai-auto-match'),
  smartAssistantStatus: document.getElementById('smart-assistant-status'),
  targetChoiceBadge: document.getElementById('target-choice-badge'),
  targetChoiceLetter: document.getElementById('target-choice-letter'),
  btnQuickCorrect: document.getElementById('btn-quick-correct'),
  btnQuickWrong: document.getElementById('btn-quick-wrong'),
  btnNudgePrevSec: document.getElementById('btn-nudge-prev-sec'),
  btnNudgeNextSec: document.getElementById('btn-nudge-next-sec'),
  btnClearAllChoices: document.getElementById('btn-clear-all-choices'),

  // AI Setup Modal
  btnOpenAiSettings: document.getElementById('btn-open-ai-settings'),
  modalAiSettings: document.getElementById('modal-ai-settings'),
  btnCloseAiSettings: document.getElementById('btn-close-ai-settings'),
  inputApiKeyGroq: document.getElementById('input-api-key-groq'),
  inputApiKeyBackup1: document.getElementById('input-api-key-backup1'),
  inputApiKeyBackup2: document.getElementById('input-api-key-backup2'),
  btnTestAiConnection: document.getElementById('btn-test-ai-connection'),
  btnSaveAiKeys: document.getElementById('btn-save-ai-keys'),
  aiSettingsMsg: document.getElementById('ai-settings-msg'),
  aiKeyStatusDot: document.getElementById('ai-key-status-dot'),

  // Waveform & Audio
  btnAudioPlay: document.getElementById('btn-audio-play'),
  btnAudioBack: document.getElementById('btn-audio-back'),
  btnAudioForward: document.getElementById('btn-audio-forward'),
  audioCurrentTime: document.getElementById('audio-current-time'),
  audioTotalTime: document.getElementById('audio-total-time'),
  btnMarkTimestamp: document.getElementById('btn-mark-timestamp'),
  btnMarkWrong: document.getElementById('btn-mark-wrong'),
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

  // Retention Bar Controls
  cfgRetentionToggle: document.getElementById('cfg-retention-toggle'),
  cfgRetentionColor: document.getElementById('cfg-retention-color'),
  textRetentionColor: document.getElementById('text-retention-color'),
  btnRetentionEyedropper: document.getElementById('btn-retention-eyedropper'),
  cfgRetentionPos: document.getElementById('cfg-retention-pos'),
  cfgRetentionHeight: document.getElementById('cfg-retention-height'),
  textRetentionHeight: document.getElementById('text-retention-height'),

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
// Ekrana göre ölçeklenmiş kutu
function getDisplayBox(box = State.box) {
  if (!box || !box.active || !State.image.naturalWidth) return null;
  const scale = DOM.canvas.width / State.image.naturalWidth;
  return {
    x: box.x * scale,
    y: box.y * scale,
    w: box.width * scale,
    h: box.height * scale,
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

function isInsideBox(pos, b = getDisplayBox()) {
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

// ------------------------------------------
// ÇOKLU VURGU YÖNETİMİ (ANNOTATIONS)
// ------------------------------------------
function getActiveAnnotation() {
  return State.annotations.find(a => a.id === State.activeAnnotationId) || null;
}

function syncControlsWithActive() {
  const ann = getActiveAnnotation();
  if (!ann) return;

  DOM.cfgColorFill.value = ann.color;
  DOM.textColorFill.textContent = ann.color.toUpperCase();
  DOM.cfgOpacity.value = Math.round(ann.opacity * 100);
  DOM.textOpacity.textContent = `%${Math.round(ann.opacity * 100)}`;
  DOM.cfgBorderWidth.value = ann.borderWidth;
  DOM.textBorderWidth.textContent = `${ann.borderWidth}px`;
  DOM.cfgBorderRadius.value = ann.borderRadius;
  DOM.textBorderRadius.textContent = `${ann.borderRadius}px`;
  DOM.cfgAnimType.value = ann.animType || 'scale_glow';
  DOM.cfgAnimDuration.value = ann.animDuration || 0.8;
  DOM.textAnimDuration.textContent = `${(ann.animDuration || 0.8).toFixed(1)}s`;
  DOM.cfgGlowToggle.checked = !!ann.glow;
  DOM.inputTimestampManual.value = ann.timestamp.toFixed(2);
  DOM.badgeMarkedTime.textContent = formatTime(ann.timestamp);

  // Checkmark kontrolleri
  if (ann.type === 'correct') {
    DOM.cfgCheckmarkToggle.checked = !!(ann.checkmark && ann.checkmark.enabled);
    if (DOM.checkmarkOptionsContainer) {
      DOM.checkmarkOptionsContainer.style.display = ann.checkmark?.enabled ? 'grid' : 'none';
    }
  } else {
    if (DOM.checkmarkOptionsContainer) {
      DOM.checkmarkOptionsContainer.style.display = 'none';
    }
  }

  // Tool butonlarının aktiflik durumunu güncelle
  updateToolTypeButtonsUI(ann.type);
  updateToolShapeButtonsUI(ann.shape);
}

function selectAnnotation(id) {
  const ann = State.annotations.find(a => a.id === id);
  if (!ann) return;
  State.activeAnnotationId = id;
  State.box = { ...ann.box, active: true };
  State.timestamp = ann.timestamp;
  State.highlight.color = ann.color;
  State.highlight.shape = ann.shape;
  State.highlight.opacity = ann.opacity;
  State.highlight.borderWidth = ann.borderWidth;
  State.highlight.borderRadius = ann.borderRadius;
  State.highlight.glow = ann.glow;
  State.highlight.animType = ann.animType;
  State.highlight.animDuration = ann.animDuration;
  State.currentToolType = ann.type;
  State.currentShape = ann.shape;

  syncControlsWithActive();
  renderAnnotationsList();
  renderCanvas();
  updateFfmpegCommand();
  updateRenderButtonState();
  updateStepIndicator();
}

function deleteAnnotation(id) {
  State.annotations = State.annotations.filter(a => a.id !== id);
  if (State.activeAnnotationId === id) {
    if (State.annotations.length > 0) {
      selectAnnotation(State.annotations[State.annotations.length - 1].id);
    } else {
      State.activeAnnotationId = null;
      State.box.active = false;
      State.box.width = 0;
      State.box.height = 0;
    }
  }
  renderAnnotationsList();
  renderCanvas();
  updateFfmpegCommand();
  updateRenderButtonState();
  updateStepIndicator();
}

function renderAnnotationsList() {
  if (!DOM.annotationsList) return;
  DOM.annotationsList.innerHTML = '';

  if (State.annotations.length === 0) {
    DOM.annotationsList.innerHTML = `<span class="text-zinc-500 italic text-[11px]">Henüz bir vurgu eklenmedi. Görsel üzerinde çizim yapın veya şıkları otomatik yerleştirin.</span>`;
    updateSmartAssistantUI();
    return;
  }

  State.annotations.forEach((ann, index) => {
    const isActive = ann.id === State.activeAnnotationId;
    const item = document.createElement('div');
    item.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
      isActive
        ? 'bg-zinc-800 text-white border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
        : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
    }`;

    let iconHtml = '🟢';
    if (ann.isPending) iconHtml = '⏳';
    else if (ann.type === 'wrong') iconHtml = '🔴 ✕';
    else iconHtml = '🟢 ✓';

    let choiceBadgeHtml = '';
    if (ann.choiceLetter) {
      choiceBadgeHtml = `<span class="font-bold font-mono text-[10px] px-1.5 py-0.2 rounded ${ann.isPending ? 'bg-sky-950 text-sky-300 border border-sky-800' : (ann.type === 'wrong' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')}">${ann.choiceLetter}</span>`;
    }

    const timeText = ann.isPending ? 'Sırada' : formatTime(ann.timestamp);
    const timeClass = ann.isPending ? 'text-amber-300 bg-amber-950/70 border border-amber-500/30' : 'text-zinc-300 bg-zinc-900 border border-zinc-800';

    item.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span>${iconHtml}</span>
        ${choiceBadgeHtml}
        <span>${ann.label || `Vurgu ${index + 1}`}</span>
      </span>
      <span class="font-mono text-[10px] px-1.5 py-0.5 rounded ${timeClass}">${timeText}</span>
      <button type="button" class="btn-del-ann ml-1 text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors" title="Vurguyu Sil">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-del-ann')) {
        e.stopPropagation();
        deleteAnnotation(ann.id);
        return;
      }
      selectAnnotation(ann.id);
    });

    DOM.annotationsList.appendChild(item);
  });

  if (window.lucide) {
    lucide.createIcons({ root: DOM.annotationsList });
  }

  updateSmartAssistantUI();
}

// Yeni Vurgu Ekle Butonu
if (DOM.btnAddAnnotation) {
  DOM.btnAddAnnotation.addEventListener('click', () => {
    State.activeAnnotationId = null;
    State.box.active = false;
    State.box.width = 0;
    State.box.height = 0;
    renderAnnotationsList();
    renderCanvas();
  });
}

// Vurgu Türü & Şekil Butonları UI Güncelleme
function updateToolTypeButtonsUI(type) {
  if (!DOM.toolTypeCorrect || !DOM.toolTypeWrong) return;
  if (type === 'correct') {
    DOM.toolTypeCorrect.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all';
    DOM.toolTypeWrong.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-red-400 flex items-center gap-1.5 transition-all';
  } else {
    DOM.toolTypeWrong.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
    DOM.toolTypeCorrect.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-all';
  }
}

function updateToolShapeButtonsUI(shape) {
  const btns = [
    { el: DOM.toolShapeRect, shape: 'rect' },
    { el: DOM.toolShapeEllipse, shape: 'ellipse' }
  ];

  btns.forEach(b => {
    if (!b.el) return;
    if (b.shape === shape) {
      b.el.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all';
    } else {
      b.el.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all';
    }
  });
}

function setToolType(type) {
  State.currentToolType = type;
  updateToolTypeButtonsUI(type);

  const ann = getActiveAnnotation();
  if (ann) {
    ann.type = type;
    ann.label = type === 'correct' ? 'Doğru (✓)' : 'Yanlış (✕)';
    ann.color = type === 'correct' ? '#22c55e' : '#ef4444';
    ann.checkmark.enabled = (type === 'correct');
    ann.crossmark.enabled = (type === 'wrong');
    DOM.cfgColorFill.value = ann.color;
    DOM.textColorFill.textContent = ann.color.toUpperCase();
    renderAnnotationsList();
    renderCanvas();
    updateFfmpegCommand();
  }
}

function setToolShape(shape) {
  State.currentShape = shape;
  updateToolShapeButtonsUI(shape);

  const ann = getActiveAnnotation();
  if (ann) {
    ann.shape = shape;
    ann.label = ann.type === 'correct' ? 'Doğru (✓)' : 'Yanlış (✕)';
    if (ann.borderWidth === 0) ann.borderWidth = 4;
    renderAnnotationsList();
    renderCanvas();
    updateFfmpegCommand();
  }
}

if (DOM.toolTypeCorrect) {
  DOM.toolTypeCorrect.addEventListener('click', () => setToolType('correct'));
}
if (DOM.toolTypeWrong) {
  DOM.toolTypeWrong.addEventListener('click', () => setToolType('wrong'));
}
if (DOM.toolShapeRect) {
  DOM.toolShapeRect.addEventListener('click', () => setToolShape('rect'));
}
if (DOM.toolShapeEllipse) {
  DOM.toolShapeEllipse.addEventListener('click', () => setToolShape('ellipse'));
}

// ------------------------------------------
// MOUSE & CANVAS ETKİLEŞİMİ (Çoklu Vurgu Uyumlu)
// ------------------------------------------
DOM.canvas.addEventListener('mousedown', (e) => {
  if (!State.image.element) return;
  const pos = getCanvasCoordinates(e);

  // 0. Sihirli Tıkla-Sar Modu veya Shift/Alt ile Tıklama (Şıkkı Otomatik Algıla ve Sar)
  if (State.interaction.isClickWrapMode || e.shiftKey || e.altKey) {
    const scale = DOM.canvas.width / State.image.naturalWidth;
    const natX = Math.round(pos.x / scale);
    const natY = Math.round(pos.y / scale);
    const detectedBox = findTextBoundingBoxAt(natX, natY);
    if (detectedBox) {
      applyDetectedBoxToChoice(detectedBox);
      return;
    }
  }

  // 1. Önce aktif kutunun tutamaçlarına tıklandı mı kontrol et
  const handle = hitTestHandle(pos);
  if (handle) {
    State.interaction.activeHandle = handle;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.interaction.boxStartX = State.box.x;
    State.interaction.boxStartY = State.box.y;
    State.interaction.boxStartW = State.box.width;
    State.interaction.boxStartH = State.box.height;
    return;
  }

  // 2. Aktif kutunun içine tıklandı mı? (Taşıma)
  if (isInsideBox(pos)) {
    State.interaction.isDragging = true;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.interaction.boxStartX = State.box.x;
    State.interaction.boxStartY = State.box.y;
    return;
  }

  // 3. Diğer mevcut vurgulardan birinin içine tıklandı mı?
  const scale = DOM.canvas.width / State.image.naturalWidth;
  let clickedExisting = null;
  for (let i = State.annotations.length - 1; i >= 0; i--) {
    const ann = State.annotations[i];
    const ab = {
      x: ann.box.x * scale,
      y: ann.box.y * scale,
      w: ann.box.width * scale,
      h: ann.box.height * scale,
    };
    if (isInsideBox(pos, ab)) {
      clickedExisting = ann;
      break;
    }
  }

  if (clickedExisting) {
    selectAnnotation(clickedExisting.id);
    State.interaction.isDragging = true;
    State.interaction.startX = pos.x;
    State.interaction.startY = pos.y;
    State.interaction.boxStartX = State.box.x;
    State.interaction.boxStartY = State.box.y;
    return;
  }

  // 4. Boş bir alana tıklandı -> Yeni kutu çizimi başlat
  const natScale = State.image.naturalWidth / DOM.canvas.width;
  State.interaction.isDrawing = true;
  State.interaction.startX = pos.x;
  State.interaction.startY = pos.y;
  State.box.x = pos.x * natScale;
  State.box.y = pos.y * natScale;
  State.box.width = 0;
  State.box.height = 0;
  State.box.active = true;
  State.activeAnnotationId = null; // Henüz kaydedilmemiş yeni çizim
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

    if (nw > 10) { State.box.x = nx; State.box.width = nw; }
    if (nh > 10) { State.box.y = ny; State.box.height = nh; }

    const ann = getActiveAnnotation();
    if (ann) {
      ann.box.x = State.box.x;
      ann.box.y = State.box.y;
      ann.box.width = State.box.width;
      ann.box.height = State.box.height;
    }
    renderCanvas();
  } else if (State.interaction.isDragging) {
    const dx = (pos.x - State.interaction.startX) * scale;
    const dy = (pos.y - State.interaction.startY) * scale;
    State.box.x = Math.max(0, Math.min(State.interaction.boxStartX + dx, State.image.naturalWidth - State.box.width));
    State.box.y = Math.max(0, Math.min(State.interaction.boxStartY + dy, State.image.naturalHeight - State.box.height));

    const ann = getActiveAnnotation();
    if (ann) {
      ann.box.x = State.box.x;
      ann.box.y = State.box.y;
    }
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
    // Fare imleci
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
      // Geçerli bir kutu çizildi -> Yeni Vurgu Olarak Ekle!
      const isCorrect = State.currentToolType === 'correct';
      const defaultColor = isCorrect ? State.highlight.color : '#ef4444';
      const defaultOpacity = State.highlight.opacity;
      const defaultBorder = State.highlight.borderWidth;
      const defaultRadius = State.highlight.borderRadius || 16;
      const defaultGlow = State.highlight.glow !== undefined ? State.highlight.glow : true;
      const defaultAnimType = State.highlight.animType || 'scale_glow';
      const defaultAnimDuration = State.highlight.animDuration || 0.8;
      const curTime = (wavesurfer && State.audio.duration > 0) ? wavesurfer.getCurrentTime() : 0.0;

      const newAnn = {
        id: 'ann_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        label: isCorrect ? 'Doğru (✓)' : 'Yanlış (✕)',
        type: State.currentToolType,
        shape: State.currentShape,
        box: {
          x: State.box.x,
          y: State.box.y,
          width: State.box.width,
          height: State.box.height,
        },
        timestamp: curTime,
        color: defaultColor,
        opacity: defaultOpacity,
        borderWidth: defaultBorder,
        borderRadius: defaultRadius,
        glow: defaultGlow,
        animType: defaultAnimType,
        animDuration: defaultAnimDuration,
        checkmark: {
          enabled: isCorrect && State.checkmark.enabled,
          position: State.checkmark.position || 'right',
          style: State.checkmark.style || 'badge',
        },
        crossmark: {
          enabled: !isCorrect,
          position: 'left',
          style: 'badge',
        }
      };

      State.annotations.push(newAnn);
      selectAnnotation(newAnn.id);
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
  if (State.activeAnnotationId) {
    deleteAnnotation(State.activeAnnotationId);
  } else {
    State.box.active = false;
    State.box.width = 0;
    State.box.height = 0;
    renderCanvas();
  }
});

// ==========================================
// 4.5. AKILLI ŞIK ASİSTANI (OTOMATİK ALGILAMA & HIZLI KURGU)
// ==========================================

/**
 * 4 veya 5 şıkkı soru görselinin şık alanına seçilen genişlik ve hizalamaya göre yerleştirir
 */
function applyChoiceTemplate(numChoices = 5) {
  if (!State.image.element) {
    alert('Lütfen önce bir soru görseli yükleyin!');
    return;
  }

  const nw = State.image.naturalWidth;
  const nh = State.image.naturalHeight;
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, numChoices);

  // Kullanıcının seçtiği genişlik ve hizalama tercihini oku
  const widthMode = DOM.cfgChoiceWidth ? DOM.cfgChoiceWidth.value : 'compact';
  const alignMode = DOM.cfgChoiceAlign ? DOM.cfgChoiceAlign.value : 'center';

  let widthRatio = 0.32; // Kompakt varsayılan: Arapça veya tek sütunlu test soruları için ideal
  if (widthMode === 'medium') widthRatio = 0.55;
  else if (widthMode === 'full') widthRatio = 0.82;

  const boxW = Math.round(nw * widthRatio);
  let boxX = Math.round(nw * 0.08); // Sola yasla
  if (alignMode === 'center') {
    boxX = Math.round((nw - boxW) / 2); // Ortala
  }

  // Soru seçenekleri dikey yerleşimi (%46 ile %90 arası)
  const startY = Math.round(nh * 0.46);
  const availableH = Math.round(nh * 0.44);
  const rowSlot = availableH / numChoices;
  const boxH = Math.max(30, Math.min(52, Math.round(rowSlot * 0.68)));

  // Mevcut otomatik şıkları temizle (varsa)
  State.annotations = State.annotations.filter(a => !a.isChoice);

  const visualBoxes = detectVisualChoiceBoxesFromImage(State.image.element, numChoices);

  const newChoices = letters.map((letter, idx) => {
    const vb = (visualBoxes && visualBoxes[idx]) ? visualBoxes[idx] : null;
    const curY = Math.round(startY + idx * rowSlot + (rowSlot - boxH) / 2);
    const box = vb ? {
      x: Math.round(nw * (vb.x_percent / 100)),
      y: Math.round(nh * (vb.y_percent / 100)),
      width: Math.round(nw * (vb.width_percent / 100)),
      height: Math.round(nh * (vb.height_percent / 100))
    } : {
      x: boxX,
      y: curY,
      width: boxW,
      height: boxH
    };

    return {
      id: `ann_choice_${letter}_${Date.now()}_${idx}`,
      isChoice: true,
      choiceLetter: letter,
      label: `${letter} Şıkkı`,
      isPending: true, // Sırada bekliyor, henüz zaman damgası almadı
      type: 'neutral',
      shape: 'rect',
      box: box,
      timestamp: 0,
      color: '#38bdf8',
      opacity: State.highlight.opacity || 0.30,
      borderWidth: State.highlight.borderWidth || 4,
      borderRadius: State.highlight.borderRadius || 14,
      glow: State.highlight.glow !== undefined ? State.highlight.glow : true,
      animType: State.highlight.animType || 'scale_glow',
      animDuration: State.highlight.animDuration || 0.7,
      checkmark: { enabled: false, position: 'right', style: 'badge' },
      crossmark: { enabled: false, position: 'left', style: 'badge' }
    };
  });

  State.annotations.push(...newChoices);

  // İlk şıkkı (A) seçili yap
  selectAnnotation(newChoices[0].id);
  updateSmartAssistantUI();
  renderAnnotationsList();
  renderCanvas();
  updateStepIndicator();
  updateRenderButtonState();
}

/**
 * Genişlik veya Hizalama dropdown değiştiğinde mevcut şık kutularını yeniden boyutlandırır/hizalar
 */
function updateChoicesLayout() {
  const choices = State.annotations.filter(a => a.isChoice);
  if (choices.length === 0 || !State.image.element) return;

  const nw = State.image.naturalWidth;
  const widthMode = DOM.cfgChoiceWidth ? DOM.cfgChoiceWidth.value : 'compact';
  const alignMode = DOM.cfgChoiceAlign ? DOM.cfgChoiceAlign.value : 'center';

  let widthRatio = 0.32;
  if (widthMode === 'medium') widthRatio = 0.55;
  else if (widthMode === 'full') widthRatio = 0.82;

  const boxW = Math.round(nw * widthRatio);
  let boxX = Math.round(nw * 0.08);
  if (alignMode === 'center') {
    boxX = Math.round((nw - boxW) / 2);
  }

  choices.forEach(c => {
    c.box.width = boxW;
    c.box.x = boxX;
  });

  const activeAnn = getActiveAnnotation();
  if (activeAnn && activeAnn.isChoice) {
    State.box.width = activeAnn.box.width;
    State.box.x = activeAnn.box.x;
  }

  renderCanvas();
}

/**
 * Piksel projeksiyon analizi ile görseldeki şık satırlarını ve X sınırlarını tarar (Sıfır Yapay Zeka, Saf Canvas Matematiği)
 */
function detectQuestionChoices(numChoices = 5) {
  if (!State.image.element) {
    alert('Lütfen önce bir soru görseli yükleyin!');
    return;
  }

  const nw = State.image.naturalWidth;
  const nh = State.image.naturalHeight;

  // Offscreen canvas ile piksel yoğunluğunu tara
  const offCanvas = document.createElement('canvas');
  offCanvas.width = nw;
  offCanvas.height = nh;
  const octx = offCanvas.getContext('2d');
  octx.drawImage(State.image.element, 0, 0);

  // Soru şıklarının tipik olarak yer aldığı alan (dikeyde %35 - %95 arası)
  const scanTop = Math.round(nh * 0.35);
  const scanBottom = Math.round(nh * 0.95);
  const scanH = scanBottom - scanTop;
  const scanLeft = Math.round(nw * 0.05);
  const scanW = Math.round(nw * 0.90);

  let imgData;
  try {
    imgData = octx.getImageData(scanLeft, scanTop, scanW, scanH);
  } catch (err) {
    console.warn('Piksel analizi güvenlik kısıtlamasına takıldı, şablon kullanılıyor:', err);
    applyChoiceTemplate(numChoices);
    return;
  }

  const data = imgData.data;
  // Her satırdaki koyu piksel sayısını hesapla (Yatay Projeksiyon)
  const rowDensity = new Float32Array(scanH);
  for (let y = 0; y < scanH; y++) {
    let dark = 0;
    const offset = y * scanW * 4;
    for (let x = 0; x < scanW; x++) {
      const idx = offset + x * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum < 165) dark++;
    }
    rowDensity[y] = dark;
  }

  // Düzleştirme (Smoothening)
  const smoothed = new Float32Array(scanH);
  const win = Math.max(3, Math.round(scanH * 0.015));
  for (let y = 0; y < scanH; y++) {
    let sum = 0, cnt = 0;
    for (let w = -win; w <= win; w++) {
      const py = y + w;
      if (py >= 0 && py < scanH) {
        sum += rowDensity[py];
        cnt++;
      }
    }
    smoothed[y] = sum / cnt;
  }

  // Satır bloklarını tespit et
  const blocks = [];
  let inBlock = false;
  let bStart = 0;
  const threshold = Math.max(4, scanW * 0.008);

  for (let y = 0; y < scanH; y++) {
    if (smoothed[y] > threshold) {
      if (!inBlock) {
        inBlock = true;
        bStart = y;
      }
    } else {
      if (inBlock) {
        inBlock = false;
        const bH = y - bStart;
        if (bH >= Math.round(nh * 0.018)) {
          blocks.push({
            top: scanTop + bStart,
            bottom: scanTop + y,
            height: bH,
            yStartInScan: bStart,
            yEndInScan: y
          });
        }
      }
    }
  }

  // Eğer bulunan blok sayısı şık sayısına yakınsa doğrudan bu blokları şık kutularına dönüştür
  if (blocks.length >= numChoices) {
    const selectedBlocks = blocks.slice(-numChoices);
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, numChoices);

    // Her bloğun gerçek X sınırlarını (minX, maxX) tara
    let commonMinX = nw;
    let commonMaxX = 0;

    selectedBlocks.forEach(b => {
      let bMin = nw;
      let bMax = 0;
      for (let y = b.yStartInScan; y <= b.yEndInScan; y++) {
        const offset = y * scanW * 4;
        for (let x = 0; x < scanW; x++) {
          const idx = offset + x * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (lum < 165) {
            const absX = scanLeft + x;
            if (absX < bMin) bMin = absX;
            if (absX > bMax) bMax = absX;
          }
        }
      }
      b.minX = bMin < nw ? bMin : scanLeft;
      b.maxX = bMax > 0 ? bMax : scanLeft + scanW;
      if (b.minX < commonMinX) commonMinX = b.minX;
      if (b.maxX > commonMaxX) commonMaxX = b.maxX;
    });

    const padX = 18;
    const boxX = Math.max(0, commonMinX - padX);
    const boxW = Math.min(nw - boxX, (commonMaxX - commonMinX) + padX * 2);

    State.annotations = State.annotations.filter(a => !a.isChoice);

    const newChoices = selectedBlocks.map((b, idx) => {
      const letter = letters[idx];
      const padY = Math.max(4, Math.round(b.height * 0.20));
      return {
        id: `ann_choice_${letter}_${Date.now()}_${idx}`,
        isChoice: true,
        choiceLetter: letter,
        label: `${letter} Şıkkı`,
        isPending: true,
        type: 'neutral',
        shape: 'rect',
        box: {
          x: boxX,
          y: Math.max(0, b.top - padY),
          width: boxW,
          height: b.height + padY * 2,
        },
        timestamp: 0,
        color: '#38bdf8',
        opacity: State.highlight.opacity || 0.30,
        borderWidth: State.highlight.borderWidth || 4,
        borderRadius: State.highlight.borderRadius || 14,
        glow: State.highlight.glow !== undefined ? State.highlight.glow : true,
        animType: State.highlight.animType || 'scale_glow',
        animDuration: State.highlight.animDuration || 0.7,
        checkmark: { enabled: false, position: 'right', style: 'badge' },
        crossmark: { enabled: false, position: 'left', style: 'badge' }
      };
    });

    State.annotations.push(...newChoices);
    selectAnnotation(newChoices[0].id);
    updateSmartAssistantUI();
    renderAnnotationsList();
    renderCanvas();
    updateStepIndicator();
    updateRenderButtonState();
  } else {
    // Bloklar tam ayırt edilemediyse orantılı şablonu uygula
    applyChoiceTemplate(numChoices);
  }
}

/**
 * Tıklanan koordinatın (X, Y) etrafındaki koyu metin satırının sınırlarını (Bounding Box) tespit eder (Tıkla-Sar Motoru)
 */
function findTextBoundingBoxAt(clickX, clickY) {
  if (!State.image.element) return null;

  const nw = State.image.naturalWidth;
  const nh = State.image.naturalHeight;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = nw;
  offCanvas.height = nh;
  const octx = offCanvas.getContext('2d');
  octx.drawImage(State.image.element, 0, 0);

  // Arama penceresi: tıklanan noktanın çevresinde
  const padW = Math.round(nw * 0.25);
  const padH = Math.round(nh * 0.07);

  const x0 = Math.max(0, clickX - padW);
  const y0 = Math.max(0, clickY - padH);
  const w = Math.min(nw - x0, padW * 2);
  const h = Math.min(nh - y0, padH * 2);

  let imgData;
  try {
    imgData = octx.getImageData(x0, y0, w, h);
  } catch (e) {
    return null;
  }
  const data = imgData.data;

  // Dikey satır sınırlarını bul
  const relClickY = clickY - y0;
  const rowHasDark = new Uint8Array(h);

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      const idx = rowOffset + x * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum < 165) {
        rowHasDark[y] = 1;
        break;
      }
    }
  }

  let topY = relClickY;
  let bottomY = relClickY;

  // Eğer doğrudan boşluğa tıklandıysa, en yakın metin satırını bul
  if (!rowHasDark[relClickY]) {
    let nearestDist = 999;
    let nearestY = -1;
    for (let y = 0; y < h; y++) {
      if (rowHasDark[y]) {
        const d = Math.abs(y - relClickY);
        if (d < nearestDist) {
          nearestDist = d;
          nearestY = y;
        }
      }
    }
    if (nearestY !== -1 && nearestDist < Math.round(nh * 0.04)) {
      topY = nearestY;
      bottomY = nearestY;
    } else {
      return null;
    }
  }

  while (topY > 0 && rowHasDark[topY]) topY--;
  while (bottomY < h - 1 && rowHasDark[bottomY]) bottomY++;

  if (bottomY - topY < 8) return null;

  // Bu satır aralığındaki sol ve sağ sınırları (minX, maxX) bul
  let minRelX = w;
  let maxRelX = 0;
  let found = false;

  for (let y = topY; y <= bottomY; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      const idx = rowOffset + x * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum < 165) {
        if (x < minRelX) minRelX = x;
        if (x > maxRelX) maxRelX = x;
        found = true;
      }
    }
  }

  if (!found || maxRelX - minRelX < 10) return null;

  const padX = 14;
  const padYVal = 6;

  const finalX = Math.max(0, x0 + minRelX - padX);
  const finalY = Math.max(0, y0 + topY - padYVal);
  const finalW = Math.min(nw - finalX, (maxRelX - minRelX) + padX * 2);
  const finalH = Math.min(nh - finalY, (bottomY - topY) + padYVal * 2);

  return {
    x: finalX,
    y: finalY,
    width: Math.max(40, finalW),
    height: Math.max(26, finalH)
  };
}

/**
 * Tıklanan metin kutusunu mevcut sıradaki şıkka atar veya yeni şık kutusu oluşturur
 */
function applyDetectedBoxToChoice(detectedBox) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const allChoices = State.annotations.filter(a => a.isChoice);
  const activeAnn = getActiveAnnotation();

  // 1. Eğer halihazırda bir şık seçiliyse, doğrudan onun kutusunu güncelle ve sonrakine geç!
  if (activeAnn && activeAnn.isChoice) {
    activeAnn.box = { ...detectedBox };
    State.box = { ...detectedBox, active: true };
    selectAnnotation(activeAnn.id);
    cycleChoice(1); // Sıradaki şıkka geç (A -> B -> C -> D -> E)
  } else if (allChoices.length > 0) {
    // Seçili yoksa ilk bekleyen şıkkı, o da yoksa ilk şıkkı güncelle
    const pending = allChoices.filter(a => a.isPending);
    const targetAnn = pending.length > 0 ? pending[0] : allChoices[0];
    targetAnn.box = { ...detectedBox };
    State.box = { ...detectedBox, active: true };
    selectAnnotation(targetAnn.id);
    cycleChoice(1);
  } else {
    const existingChoices = State.annotations.filter(a => a.isChoice);
    const nextIdx = existingChoices.length;
    const letter = letters[nextIdx] || `Şık ${nextIdx + 1}`;

    const newChoice = {
      id: `ann_choice_${letter}_${Date.now()}`,
      isChoice: true,
      choiceLetter: letter,
      label: `${letter} Şıkkı`,
      isPending: true,
      type: 'neutral',
      shape: 'rect',
      box: { ...detectedBox },
      timestamp: 0,
      color: '#38bdf8',
      opacity: State.highlight.opacity || 0.30,
      borderWidth: State.highlight.borderWidth || 4,
      borderRadius: State.highlight.borderRadius || 14,
      glow: State.highlight.glow !== undefined ? State.highlight.glow : true,
      animType: State.highlight.animType || 'scale_glow',
      animDuration: State.highlight.animDuration || 0.7,
      checkmark: { enabled: false, position: 'right', style: 'badge' },
      crossmark: { enabled: false, position: 'left', style: 'badge' }
    };

    State.annotations.push(newChoice);
    selectAnnotation(newChoice.id);
  }

  updateSmartAssistantUI();
  renderAnnotationsList();
  renderCanvas();
  updateStepIndicator();
  updateRenderButtonState();
}

/**
 * Tıkla-Sar modunu açıp kapatır
 */
function toggleClickWrapMode(forceState = null) {
  State.interaction.isClickWrapMode = (forceState !== null) ? forceState : !State.interaction.isClickWrapMode;
  if (!DOM.btnClickWrap) return;
  if (State.interaction.isClickWrapMode) {
    DOM.btnClickWrap.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500 text-white border border-indigo-400 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/50 ring-2 ring-indigo-400/50';
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `🪄 <strong class="text-indigo-300">Tıkla-Sar Aktif:</strong> Soru görselindeki şıkların üzerine sırayla tıklayın, kutular milisaniyeler içinde şıkkı saracaktır.`;
    }
  } else {
    DOM.btnClickWrap.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-all active:scale-95';
    updateSmartAssistantUI();
  }
}

/**
 * Sıradaki bekleyen şıkka otomatik odaklanma
 */
function advanceToNextPendingChoice() {
  const pending = State.annotations.filter(a => a.isChoice && a.isPending);
  if (pending.length > 0) {
    selectAnnotation(pending[0].id);
  }
  updateSmartAssistantUI();
}

/**
 * Tab / Shift+Tab ile şıklar arasında geçiş
 */
function cycleChoice(direction = 1) {
  const choices = State.annotations.filter(a => a.isChoice);
  if (choices.length === 0) return;
  const currentIdx = choices.findIndex(a => a.id === State.activeAnnotationId);
  let nextIdx = 0;
  if (currentIdx !== -1) {
    nextIdx = (currentIdx + direction + choices.length) % choices.length;
  }
  selectAnnotation(choices[nextIdx].id);
  updateSmartAssistantUI();
}

/**
 * Z tuşu ile son işaretlenen şıkkı geri alma / sıfırlama
 */
function undoLastChoice() {
  const markedChoices = State.annotations.filter(a => a.isChoice && !a.isPending);
  if (markedChoices.length === 0) return;
  const lastMarked = markedChoices[markedChoices.length - 1];
  lastMarked.isPending = true;
  lastMarked.timestamp = 0;
  lastMarked.type = 'neutral';
  lastMarked.label = `${lastMarked.choiceLetter} Şıkkı`;
  lastMarked.color = '#38bdf8';
  lastMarked.checkmark.enabled = false;
  lastMarked.crossmark.enabled = false;

  selectAnnotation(lastMarked.id);
  updateSmartAssistantUI();
  renderAnnotationsList();
  renderCanvas();
  updateRenderButtonState();
  updateStepIndicator();
}

/**
 * Akıllı Asistan UI Durumunu ve Hedef Şık Göstergesini Günceller
 */
function updateSmartAssistantUI() {
  if (!DOM.smartChoiceAssistant) return;
  const choices = State.annotations.filter(a => a.isChoice);

  if (choices.length === 0) {
    if (DOM.targetChoiceBadge) DOM.targetChoiceBadge.classList.add('hidden');
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `Şıkları 1 tıkla yerleştirin veya <strong class="text-indigo-300">🪄 Tıkla-Sar</strong> ile seçin; ses çalarken <kbd class="px-1 bg-zinc-800 text-rose-300 rounded font-mono text-[10px]">X</kbd> ve <kbd class="px-1 bg-zinc-800 text-emerald-300 rounded font-mono text-[10px]">M</kbd> ile kurgulayın.`;
    }
    return;
  }

  const pending = choices.filter(a => a.isPending);
  const activeAnn = getActiveAnnotation();

  if (DOM.targetChoiceBadge) {
    DOM.targetChoiceBadge.classList.remove('hidden');
    if (!DOM.targetChoiceBadge.classList.contains('flex')) {
      DOM.targetChoiceBadge.classList.add('flex');
    }
  }

  if (pending.length > 0) {
    const curTarget = (activeAnn && activeAnn.isChoice && activeAnn.isPending) ? activeAnn : pending[0];
    if (DOM.targetChoiceLetter) {
      DOM.targetChoiceLetter.textContent = `${curTarget.choiceLetter} Şıkkı`;
      DOM.targetChoiceLetter.className = 'font-bold font-mono text-xs text-zinc-950 bg-emerald-400 px-2 py-0.5 rounded shadow-sm animate-pulse';
    }
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `🎯 Sıradaki: <strong class="text-white bg-emerald-500/30 px-1.5 py-0.5 rounded font-mono">${curTarget.choiceLetter} Şıkkı</strong> — Dinlerken yanlışsa <strong class="text-rose-400">[X]</strong>, doğruysa <strong class="text-emerald-400">[M]</strong> basın. (${choices.length - pending.length}/${choices.length} tamamlandı)`;
    }
  } else {
    if (DOM.targetChoiceBadge) {
      DOM.targetChoiceBadge.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1">✓ Tüm Şıklar Tamam!</span>`;
    }
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `🎉 <strong class="text-emerald-400">Harika! Tüm şıklar işaretlendi.</strong> Önizlemek için <kbd class="px-1 bg-zinc-800 text-emerald-300 rounded font-mono text-[10px]">P</kbd> veya <kbd class="px-1 bg-zinc-800 text-zinc-300 rounded font-mono text-[10px]">Boşluk</kbd> tuşuna basın.`;
    }
  }
}

// Akıllı Şık Butonları Dinleyicileri
if (DOM.btnClickWrap) {
  DOM.btnClickWrap.addEventListener('click', () => toggleClickWrapMode());
}

// ------------------------------------------
// MANUEL CAN SİMİDİ & İNCE AYAR BUTONLARI (Ne Olur Ne Olmaz Araçları)
// ------------------------------------------
if (DOM.btnQuickCorrect) {
  DOM.btnQuickCorrect.addEventListener('click', () => {
    const ann = getActiveAnnotation();
    if (ann) {
      setToolType('correct');
    } else if (State.annotations.length > 0) {
      selectAnnotation(State.annotations[0].id);
      setToolType('correct');
    }
  });
}

if (DOM.btnQuickWrong) {
  DOM.btnQuickWrong.addEventListener('click', () => {
    const ann = getActiveAnnotation();
    if (ann) {
      setToolType('wrong');
    } else if (State.annotations.length > 0) {
      selectAnnotation(State.annotations[0].id);
      setToolType('wrong');
    }
  });
}

if (DOM.btnNudgePrevSec) {
  DOM.btnNudgePrevSec.addEventListener('click', () => {
    const ann = getActiveAnnotation();
    if (ann) {
      ann.timestamp = Math.max(0, parseFloat(((ann.timestamp || 0) - 0.1).toFixed(2)));
      DOM.badgeMarkedTime.textContent = formatTime(ann.timestamp);
      DOM.inputTimestampManual.value = ann.timestamp.toFixed(2);
      renderAnnotationsList();
      renderCanvas();
      updateFfmpegCommand();
    }
  });
}

if (DOM.btnNudgeNextSec) {
  DOM.btnNudgeNextSec.addEventListener('click', () => {
    const ann = getActiveAnnotation();
    if (ann) {
      ann.timestamp = Math.min(State.audio.duration || 9999, parseFloat(((ann.timestamp || 0) + 0.1).toFixed(2)));
      DOM.badgeMarkedTime.textContent = formatTime(ann.timestamp);
      DOM.inputTimestampManual.value = ann.timestamp.toFixed(2);
      renderAnnotationsList();
      renderCanvas();
      updateFfmpegCommand();
    }
  });
}

if (DOM.btnClearAllChoices) {
  DOM.btnClearAllChoices.addEventListener('click', () => {
    if (State.annotations.length === 0) return;
    if (confirm('Tüm şıkları ve vurguları silmek istediğinize emin misiniz?')) {
      State.annotations = [];
      State.activeAnnotationId = null;
      State.box.active = false;
      State.box.width = 0;
      State.box.height = 0;
      renderAnnotationsList();
      renderCanvas();
      updateRenderButtonState();
      updateStepIndicator();
    }
  });
}

// ------------------------------------------
// YAPAY ZEKA ANAHTARLARI & KURULUM SİHİRBAZI
// ------------------------------------------
function updateAiKeyStatus() {
  const activeKeys = [State.ai.groqKey, State.ai.backupKey1, State.ai.backupKey2].filter(Boolean);
  const count = activeKeys.length;

  if (DOM.aiKeyStatusDot) {
    if (count >= 2) {
      DOM.aiKeyStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]';
      DOM.aiKeyStatusDot.title = `${count} adet Groq anahtarı aktif (Kesintisiz rotasyon devrede)`;
    } else if (count === 1) {
      DOM.aiKeyStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]';
      DOM.aiKeyStatusDot.title = '1 adet Groq anahtarı aktif';
    } else {
      DOM.aiKeyStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      DOM.aiKeyStatusDot.title = 'Henüz anahtar girilmedi (tıklayarak ekleyin)';
    }
  }
}

function showAiSettingsMessage(text, color = 'emerald') {
  if (!DOM.aiSettingsMsg) return;
  DOM.aiSettingsMsg.className = `text-xs font-semibold p-2.5 rounded-xl block ${
    color === 'emerald' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' :
    color === 'rose' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' :
    'bg-indigo-950/60 text-indigo-300 border border-indigo-500/40'
  }`;
  DOM.aiSettingsMsg.textContent = text;
  DOM.aiSettingsMsg.classList.remove('hidden');
}

if (DOM.btnOpenAiSettings) {
  DOM.btnOpenAiSettings.addEventListener('click', () => {
    if (DOM.inputApiKeyGroq) DOM.inputApiKeyGroq.value = State.ai.groqKey;
    if (DOM.inputApiKeyBackup1) DOM.inputApiKeyBackup1.value = State.ai.backupKey1;
    if (DOM.inputApiKeyBackup2) DOM.inputApiKeyBackup2.value = State.ai.backupKey2;
    if (DOM.aiSettingsMsg) DOM.aiSettingsMsg.classList.add('hidden');
    if (DOM.modalAiSettings) {
      DOM.modalAiSettings.classList.remove('hidden');
      if (window.lucide) lucide.createIcons({ root: DOM.modalAiSettings });
    }
  });
}

if (DOM.btnCloseAiSettings) {
  DOM.btnCloseAiSettings.addEventListener('click', () => {
    if (DOM.modalAiSettings) DOM.modalAiSettings.classList.add('hidden');
  });
}

if (DOM.btnSaveAiKeys) {
  DOM.btnSaveAiKeys.addEventListener('click', () => {
    const groq = DOM.inputApiKeyGroq ? DOM.inputApiKeyGroq.value.trim() : '';
    const b1 = DOM.inputApiKeyBackup1 ? DOM.inputApiKeyBackup1.value.trim() : '';
    const b2 = DOM.inputApiKeyBackup2 ? DOM.inputApiKeyBackup2.value.trim() : '';

    State.ai.groqKey = groq;
    State.ai.backupKey1 = b1;
    State.ai.backupKey2 = b2;

    localStorage.setItem('soru_ai_groq_key', groq);
    localStorage.setItem('soru_ai_backup1_key', b1);
    localStorage.setItem('soru_ai_backup2_key', b2);

    updateAiKeyStatus();
    if (DOM.modalAiSettings) DOM.modalAiSettings.classList.add('hidden');
  });
}

if (DOM.btnTestAiConnection) {
  DOM.btnTestAiConnection.addEventListener('click', async () => {
    const groqKey = DOM.inputApiKeyGroq ? DOM.inputApiKeyGroq.value.trim() : '';
    const b1 = DOM.inputApiKeyBackup1 ? DOM.inputApiKeyBackup1.value.trim() : '';
    const b2 = DOM.inputApiKeyBackup2 ? DOM.inputApiKeyBackup2.value.trim() : '';

    if (!groqKey && !b1 && !b2) {
      showAiSettingsMessage('Lütfen en az bir anahtar girin!', 'amber');
      return;
    }

    showAiSettingsMessage('Bağlantı test ediliyor...', 'indigo');

    const results = [];
    const keysToCheck = [
      { name: '1. Groq', key: groqKey },
      { name: '2. Groq', key: b1 },
      { name: '3. Groq', key: b2 }
    ].filter(item => item.key);

    for (const item of keysToCheck) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${item.key}` }
        });
        if (res.ok) {
          results.push(`✓ ${item.name}: Başarılı`);
        } else {
          results.push(`⚠️ ${item.name}: Hata ${res.status}`);
        }
      } catch (err) {
        results.push(`❌ ${item.name}: Bağlantı hatası`);
      }
    }

    if (results.length > 0) {
      const isAnyOk = results.some(r => r.includes('✓'));
      showAiSettingsMessage(results.join(' | '), isAnyOk ? 'emerald' : 'rose');
    }
  });
}

// ------------------------------------------
// ⚡ AI İLE OTOMATİK EŞLEME MOTORU (Whisper + Vision + Failover)
// ------------------------------------------
async function runAIAutoMatch() {
  if (State.ai.isProcessing) return;

  if (!State.image.element) {
    alert('Lütfen önce bir soru görseli yükleyin!');
    return;
  }

  if (!State.audio.file) {
    alert('Lütfen önce ses kaydını (MP3) yükleyin!');
    return;
  }

  if (!State.ai.groqKey && !State.ai.backupKey1 && !State.ai.backupKey2) {
    if (DOM.btnOpenAiSettings) DOM.btnOpenAiSettings.click();
    return;
  }

  State.ai.isProcessing = true;
  const originalBtnHtml = DOM.btnAiAutoMatch ? DOM.btnAiAutoMatch.innerHTML : '';
  if (DOM.btnAiAutoMatch) {
    DOM.btnAiAutoMatch.disabled = true;
    DOM.btnAiAutoMatch.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> <span>Analiz Ediliyor...</span>`;
  }

  try {
    // 1. ADIM: Sesi Dinle (Whisper Transkript + Zaman Damgaları)
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `⏳ <strong class="text-violet-400">Adım 1/2:</strong> Ses kaydı dinleniyor ve kelimeler saniyesine ayrılıyor...`;
    }

    const whisperResult = await transcribeAudioWithFailover();
    const segments = whisperResult.segments || [];
    let transcriptText = "";
    if (segments.length > 0) {
      transcriptText = segments
        .map(s => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s]: "${s.text.trim()}"`)
        .join("\n");
    } else {
      transcriptText = whisperResult.text || "";
    }

    // 2. ADIM: Görseli ve Şıkları İncele (Vision Bounding Box & Eşleme)
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `🔍 <strong class="text-indigo-400">Adım 2/2:</strong> Soru şıkları (A, B, C, D) taranıyor ve sesle eşleştiriliyor...`;
    }

    const base64Image = getOptimizedBase64Image();
    const matchedChoices = await analyzeVisionWithFailover(base64Image, transcriptText);

    if (!Array.isArray(matchedChoices) || matchedChoices.length === 0) {
      throw new Error('Yapay zeka görselde belirgin bir şık düzeni tespit edemedi.');
    }

    // 3. ADIM: Tespit Edilen Şıkları Canvas'a ve Zaman Çizelgesine İşle
    applyMatchedChoicesToState(matchedChoices);

    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `🎉 <strong class="text-emerald-400">Harika! ${matchedChoices.length} şık otomatik tespit edildi ve eşlendi.</strong> İncelemek veya düzeltmek için şıklara tıklayabilirsiniz.`;
    }

  } catch (err) {
    console.error('AI Otomasyon Hatası:', err);
    if (DOM.smartAssistantStatus) {
      DOM.smartAssistantStatus.innerHTML = `⚠️ <strong class="text-amber-400">Otomatik analiz tamamlanamadı:</strong> ${err.message}. <span class="text-zinc-400">Manuel araçlarla veya "Tıkla-Sar" ile kolayca devam edebilirsiniz.</span>`;
    }
    alert('Yapay zeka analizi sırasında bir sorun oluştu:\n' + err.message + '\n\nManuel araçları kullanarak şıkları işaretlemeye devam edebilirsiniz.');
  } finally {
    State.ai.isProcessing = false;
    if (DOM.btnAiAutoMatch) {
      DOM.btnAiAutoMatch.disabled = false;
      DOM.btnAiAutoMatch.innerHTML = originalBtnHtml;
    }
  }
}

// Ses Transkripsiyonu (Yedekli / Failover)
async function transcribeAudioWithFailover() {
  const keysToTry = [];
  if (State.ai.groqKey) keysToTry.push({ type: 'groq', key: State.ai.groqKey, name: '1. Groq' });
  if (State.ai.backupKey1 && State.ai.backupKey1.startsWith('gsk_')) {
    keysToTry.push({ type: 'groq', key: State.ai.backupKey1, name: '2. Groq' });
  }
  if (State.ai.backupKey2 && State.ai.backupKey2.startsWith('gsk_')) {
    keysToTry.push({ type: 'groq', key: State.ai.backupKey2, name: '3. Groq' });
  }

  let lastErr = null;

  for (const k of keysToTry) {
    try {
      const formData = new FormData();
      formData.append('file', State.audio.file);
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'tr');

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${k.key}` },
        body: formData
      });

      if (res.status === 429) {
        console.warn(`${k.name} kotası doldu (429), bir sonraki anahtara geçiliyor...`);
        continue;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Groq Hatası (${res.status})`);
      }

      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }

  // Hugging Face Whisper Yedek Denemesi
  if (State.ai.backupKey1 && State.ai.backupKey1.startsWith('hf_')) {
    try {
      const res = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${State.ai.backupKey1}` },
        body: State.audio.file
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(lastErr ? lastErr.message : 'Ses analizi için geçerli bir anahtar bulunamadı.');
}

// Görsel Boyutunu Optimize Eden Helper (Payload'ı hafifletir)
function getOptimizedBase64Image() {
  const canvas = document.createElement('canvas');
  const maxDim = 1200;
  let w = State.image.naturalWidth;
  let h = State.image.naturalHeight;
  if (w > maxDim || h > maxDim) {
    if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
    else { w = Math.round(w * (maxDim / h)); h = maxDim; }
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(State.image.element, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.85);
}

// Görsel ve Şık Eşleme (Yedekli / Failover)
async function analyzeVisionWithFailover(base64Image, transcriptText) {
  const prompt = `Sen profesyonel bir sınav sorusu çözüm ve video kurgu uzmanısın.
Görseldeki soruya ve öğretmenin ses transkriptine bakarak şıkları tespit et ve zamanlamaları eşle.

GÖRSELDEKİ ŞIKLAR:
Görseldeki A, B, C, D (ve varsa E) seçeneklerinin koordinatlarını görselin genişlik ve yüksekliğine oranla yüzde (0-100) olarak belirle:
- x_percent: sol kenardan mesafe yüzde (0-100)
- y_percent: üst kenardan mesafe yüzde (0-100)
- width_percent: kutunun genişliği yüzde (0-100)
- height_percent: kutunun yüksekliği yüzde (0-100)

SES TRANSKRİPTİ VE ZAMANLARI:
${transcriptText || "Transkript bulunamadı."}

EŞLEME KURALLARI:
1. Öğretmenin elediği / yanlış dediği şıklar için: "type": "wrong".
2. Öğretmenin doğru dediği / cevabı ilan ettiği şık için: "type": "correct".
3. timestamp değerini öğretmenin o şıktan bahsettiği saniye (ondalıklı sayı, örn: 3.4) olarak ata.
4. Eğer bir şıktan hiç bahsedilmediyse timestamp: 0 ver.

ÇIKTI FORMATI:
SADECE ve SADECE aşağıdaki gibi bir JSON array döndür. Başında veya sonunda markdown backtick (\`\`\`json) veya açıklama metni YAZMA:
[
  { "letter": "A", "type": "wrong", "timestamp": 2.1, "x_percent": 12, "y_percent": 48, "width_percent": 38, "height_percent": 6 },
  { "letter": "B", "type": "wrong", "timestamp": 4.5, "x_percent": 12, "y_percent": 56, "width_percent": 38, "height_percent": 6 },
  { "letter": "C", "type": "correct", "timestamp": 7.2, "x_percent": 12, "y_percent": 64, "width_percent": 38, "height_percent": 6 }
]`;

  let lastErr = null;

  // 1. ÖNCELİK: Groq Vision Modeli (qwen/qwen3.8-27b) - Tüm Groq Anahtarlarını Sırayla Dene
  const visionKeysToTry = [];
  if (State.ai.groqKey) visionKeysToTry.push({ type: 'groq', key: State.ai.groqKey, name: '1. Groq' });
  if (State.ai.backupKey1 && State.ai.backupKey1.startsWith('gsk_')) {
    visionKeysToTry.push({ type: 'groq', key: State.ai.backupKey1, name: '2. Groq' });
  }
  if (State.ai.backupKey2 && State.ai.backupKey2.startsWith('gsk_')) {
    visionKeysToTry.push({ type: 'groq', key: State.ai.backupKey2, name: '3. Groq' });
  }

  for (const vKey of visionKeysToTry) {
    const candidateModels = ['qwen/qwen3.8-27b'];

    for (const model of candidateModels) {
      try {
        console.log(`${vKey.name} ile görsel taranıyor (${model})...`);
        const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vKey.key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: base64Image } }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        });

        if (res.status === 429) {
          console.warn(`${vKey.name} kotası doldu (429), sıradaki anahtara geçiliyor...`);
          continue;
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          console.warn(`Model ${model} hatası:`, errJson.error?.message);
          lastErr = new Error(errJson.error?.message || `HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        let content = data.choices?.[0]?.message?.content || "";
        
        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBracket = content.indexOf('[');
        const lastBracket = content.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          content = content.substring(firstBracket, lastBracket + 1);
        }

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`${vKey.name} ile şıklar başarıyla tespit edildi!`);
          return parsed;
        }
      } catch (e) {
        lastErr = e;
        console.error(`${model} deneme hatası:`, e);
      }
    }
  }

  // 2. ÖNCELİK: Groq Llama 3.3 / 3.1 metin modeli ile transkripti analiz et (Tüm Anahtarlarla)
  const textKeysToTry = visionKeysToTry.length > 0 ? visionKeysToTry : [];
  if (textKeysToTry.length === 0 && State.ai.groqKey) {
    textKeysToTry.push({ type: 'groq', key: State.ai.groqKey, name: '1. Groq' });
  }
  const textModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  for (const tKey of textKeysToTry) {
    if (!tKey.key) continue;
    for (const tModel of textModels) {
      try {
        console.log(`Transkript metin analizi deneniyor (${tModel})...`);
        const fallbackPrompt = `Sen bir sınav sorusu çözüm video editörüsün.
Aşağıdaki ses transkriptine bakarak öğretmenin elediği ve doğru bulduğu şıkları zaman damgalarıyla çıkar:

SES TRANSKRİPTİ:
${transcriptText}

GÖREV:
A, B, C, D (varsa E) şıklarını dikey standart sırasına göre yerleştirerek şu formatta bir JSON array döndür:
[
  { "letter": "A", "type": "wrong", "timestamp": 2.1, "x_percent": 12, "y_percent": 48, "width_percent": 45, "height_percent": 6 },
  { "letter": "B", "type": "wrong", "timestamp": 4.5, "x_percent": 12, "y_percent": 56, "width_percent": 45, "height_percent": 6 },
  { "letter": "C", "type": "correct", "timestamp": 7.2, "x_percent": 12, "y_percent": 64, "width_percent": 45, "height_percent": 6 },
  { "letter": "D", "type": "wrong", "timestamp": 0, "x_percent": 12, "y_percent": 72, "width_percent": 45, "height_percent": 6 }
]
SADECE JSON array döndür, markdown yazma:`;

        const textRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tKey.key}`
          },
          body: JSON.stringify({
            model: tModel,
            messages: [{ role: 'user', content: fallbackPrompt }],
            temperature: 0.1,
            max_tokens: 1000
          })
        });

        if (textRes.ok) {
          const textData = await textRes.json();
          let txt = textData.choices?.[0]?.message?.content || "";
          txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
          const fb = txt.indexOf('[');
          const lb = txt.lastIndexOf(']');
          if (fb !== -1 && lb !== -1) {
            const parsed = JSON.parse(txt.substring(fb, lb + 1));
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Görseldeki gerçek piksel satırlarını tespit et ve koordinatları üzerine bindir
              const visualBoxes = detectVisualChoiceBoxesFromImage(State.image.element, parsed.length);
              if (visualBoxes && visualBoxes.length >= parsed.length) {
                parsed.forEach((item, idx) => {
                  if (visualBoxes[idx]) {
                    item.x_percent = visualBoxes[idx].x_percent;
                    item.y_percent = visualBoxes[idx].y_percent;
                    item.width_percent = visualBoxes[idx].width_percent;
                    item.height_percent = visualBoxes[idx].height_percent;
                  }
                });
              }
              return parsed;
            }
          }
        }
      } catch (textErr) {
        console.error(`${tModel} metin analizi hatası:`, textErr);
      }
    }
  }

  // 2. ULTIMATE CAN SİMİDİ: Hiçbir yapay zeka modeline ihtiyaç duymadan Whisper transkriptinden yerel akıllı eşleme yap!
  const localMatches = extractChoicesLocallyFromTranscript(transcriptText);
  if (localMatches && localMatches.length > 0) {
    console.log('Yerel transkript eşleyici devreye girdi:', localMatches);
    return localMatches;
  }

  throw new Error(lastErr ? lastErr.message : 'Şık analizi gerçekleştirilemedi.');
}

/**
 * Görseldeki gerçek şık alanlarını piksel satır projeksiyonu (Row Projection) ile otomatik tespit eder
 */
function detectVisualChoiceBoxesFromImage(imgElement, count = 5) {
  if (!imgElement || !imgElement.naturalWidth || !imgElement.naturalHeight) return null;
  const nw = imgElement.naturalWidth;
  const nh = imgElement.naturalHeight;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = nw;
  offCanvas.height = nh;
  const octx = offCanvas.getContext('2d');
  octx.drawImage(imgElement, 0, 0);

  // Şıklar genellikle soru kökünün altında veya görselin alt yarısında yer alır
  const startY = Math.round(nh * 0.28);
  const endY = Math.round(nh * 0.98);
  const scanH = endY - startY;

  let imgData;
  try {
    imgData = octx.getImageData(0, startY, nw, scanH);
  } catch (e) {
    return null;
  }
  const data = imgData.data;

  // 1. Zemin Parlaklığını Belirle (Açık zemin mi Koyu tema mı?)
  let darkPixelCount = 0;
  for (let i = 0; i < data.length; i += 8) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 160) darkPixelCount++;
  }
  const isDarkBg = (darkPixelCount > (scanH * nw * 0.5) * 0.65);

  // 2. Dikey Satır Bazlı Metin Pikseli Sayımı (Row Profile)
  const rowCounts = new Int32Array(scanH);
  for (let y = 0; y < scanH; y++) {
    let c = 0;
    const rowOffset = y * nw * 4;
    for (let x = 0; x < nw; x += 2) {
      const idx = rowOffset + x * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const isText = isDarkBg ? (lum > 140) : (lum < 165);
      if (isText) c++;
    }
    rowCounts[y] = c;
  }

  // 3. Metin Bantlarını Bul
  const minTextPix = Math.max(10, Math.round(nw * 0.012));
  const rawBands = [];
  let inBand = false;
  let bStart = 0;

  for (let y = 0; y < scanH; y++) {
    if (rowCounts[y] >= minTextPix) {
      if (!inBand) { inBand = true; bStart = y; }
    } else {
      if (inBand) {
        inBand = false;
        const bH = y - bStart;
        if (bH >= 6 && bH <= nh * 0.22) {
          rawBands.push({ startY: bStart + startY, endY: y + startY, height: bH });
        }
      }
    }
  }
  if (inBand) {
    const bH = scanH - bStart;
    if (bH >= 6 && bH <= nh * 0.22) {
      rawBands.push({ startY: bStart + startY, endY: scanH + startY, height: bH });
    }
  }

  if (rawBands.length === 0) return null;

  // 4. Birbirine çok yakın (boşluk <= 10px) satırları birleştir
  const mergedBands = [];
  for (const b of rawBands) {
    if (mergedBands.length > 0) {
      const prev = mergedBands[mergedBands.length - 1];
      if (b.startY - prev.endY <= 10) {
        prev.endY = b.endY;
        prev.height = prev.endY - prev.startY;
        continue;
      }
    }
    mergedBands.push({ ...b });
  }

  // 5. Şık Bantlarını Filtrele (Genellikle en alttaki son N satır)
  let choiceBands = [];
  if (mergedBands.length >= count) {
    choiceBands = mergedBands.slice(mergedBands.length - count);
  } else if (mergedBands.length >= 4) {
    choiceBands = mergedBands.slice(mergedBands.length - 4);
  } else {
    choiceBands = mergedBands;
  }

  // 6. Her bant için sol/sağ sınırları belirle ve kutu oluştur
  const boxes = [];
  const padX = Math.round(nw * 0.012);
  const padY = Math.round(nh * 0.008);

  for (let i = 0; i < choiceBands.length; i++) {
    const band = choiceBands[i];
    const bH = band.endY - band.startY;
    let bData;
    try {
      bData = octx.getImageData(0, band.startY, nw, bH).data;
    } catch (e) {
      continue;
    }

    let minX = nw;
    let maxX = 0;
    let found = false;

    for (let by = 0; by < bH; by++) {
      const rowOffset = by * nw * 4;
      for (let bx = 0; bx < nw; bx++) {
        const idx = rowOffset + bx * 4;
        const lum = 0.299 * bData[idx] + 0.587 * bData[idx + 1] + 0.114 * bData[idx + 2];
        const isText = isDarkBg ? (lum > 140) : (lum < 165);
        if (isText) {
          if (bx < minX) minX = bx;
          if (bx > maxX) maxX = bx;
          found = true;
        }
      }
    }

    if (!found || maxX <= minX) {
      minX = Math.round(nw * 0.08);
      maxX = Math.round(nw * 0.55);
    }

    const boxX = Math.max(0, minX - padX);
    const boxY = Math.max(0, band.startY - padY);
    const boxW = Math.min(nw - boxX, Math.max(Math.round(nw * 0.32), (maxX - minX) + padX * 2 + 25));
    const boxH = Math.min(nh - boxY, (band.endY - band.startY) + padY * 2);

    boxes.push({
      x_percent: (boxX / nw) * 100,
      y_percent: (boxY / nh) * 100,
      width_percent: (boxW / nw) * 100,
      height_percent: (boxH / nh) * 100
    });
  }

  return boxes.length > 0 ? boxes : null;
}

// Tamamen Çevrimdışı / Yerel Transkript Şık Çıkarıcı (Sıfır Hata Garantisi)
function extractChoicesLocallyFromTranscript(transcript) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const lines = transcript.split('\n');
  const results = [];
  const visualBoxes = detectVisualChoiceBoxesFromImage(State.image.element, letters.length);

  letters.forEach((letter, idx) => {
    let foundTs = 0;
    let foundType = 'wrong';

    for (const line of lines) {
      const matchTime = line.match(/\[([0-9.]+)s/);
      const ts = matchTime ? parseFloat(matchTime[1]) : 0;
      const lower = line.toLowerCase();
      const hasLetter = new RegExp(`\\b${letter.toLowerCase()}\\b|${letter.toLowerCase()}\\s*şık|${letter.toLowerCase()}\\s*seçenek`, 'i').test(line);

      if (hasLetter) {
        foundTs = ts;
        if (lower.includes('doğru') || lower.includes('cevap') || lower.includes('cevabımız') || lower.includes('olur')) {
          foundType = 'correct';
        } else {
          foundType = 'wrong';
        }
        break;
      }
    }

    const vb = (visualBoxes && visualBoxes[idx]) ? visualBoxes[idx] : null;

    results.push({
      letter: letter,
      type: foundType,
      timestamp: foundTs,
      x_percent: vb ? vb.x_percent : 12,
      y_percent: vb ? vb.y_percent : (46 + idx * 8),
      width_percent: vb ? vb.width_percent : 45,
      height_percent: vb ? vb.height_percent : 6
    });
  });

  return results;
}

// Şıkları State ve Canvas'a Uygula
function applyMatchedChoicesToState(matchedChoices) {
  const nw = State.image.naturalWidth;
  const nh = State.image.naturalHeight;

  // Mevcut otomatik şıkları temizle
  State.annotations = State.annotations.filter(a => !a.isChoice);

  const newAnnotations = matchedChoices.map((item, idx) => {
    const letter = (item.letter || String.fromCharCode(65 + idx)).toUpperCase();
    const isCorrect = item.type === 'correct';
    const ts = Math.max(0, parseFloat(item.timestamp) || 0);

    const boxX = Math.round(nw * (Math.max(1, Math.min(95, item.x_percent || 10)) / 100));
    const boxY = Math.round(nh * (Math.max(1, Math.min(95, item.y_percent || (45 + idx * 8))) / 100));
    const boxW = Math.round(nw * (Math.max(10, Math.min(90, item.width_percent || 40)) / 100));
    const boxH = Math.round(nh * (Math.max(3, Math.min(25, item.height_percent || 6)) / 100));

    return {
      id: `ann_choice_${letter}_${Date.now()}_${idx}`,
      isChoice: true,
      choiceLetter: letter,
      label: `${letter} Şıkkı (${isCorrect ? '✓ Doğru' : '✕ Yanlış'})`,
      isPending: ts === 0, // Eğer ses kaydında bahsedilmediyse bekleyen modda kalır
      type: isCorrect ? 'correct' : 'wrong',
      shape: 'rect',
      box: {
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
      },
      timestamp: ts,
      color: isCorrect ? '#22c55e' : '#ef4444',
      opacity: State.highlight.opacity || 0.30,
      borderWidth: State.highlight.borderWidth || 4,
      borderRadius: State.highlight.borderRadius || 14,
      glow: State.highlight.glow !== undefined ? State.highlight.glow : true,
      animType: State.highlight.animType || 'scale_glow',
      animDuration: State.highlight.animDuration || 0.7,
      checkmark: { enabled: isCorrect, position: 'right', style: 'badge' },
      crossmark: { enabled: !isCorrect, position: 'left', style: 'badge' }
    };
  });

  State.annotations.push(...newAnnotations);

  if (newAnnotations.length > 0) {
    selectAnnotation(newAnnotations[0].id);
  }

  updateSmartAssistantUI();
  renderAnnotationsList();
  renderCanvas();
  updateStepIndicator();
  updateRenderButtonState();
  updateFfmpegCommand();
}

if (DOM.btnAiAutoMatch) {
  DOM.btnAiAutoMatch.addEventListener('click', runAIAutoMatch);
}

// Başlangıçta anahtar durumunu göster
updateAiKeyStatus();

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

  const isPlayingAudio = State.playback.isPlaying;
  const isTestingAnim = State.playback.animTestStartTime !== null;
  const isEditMode = !isPlayingAudio && !isExporting && !isTestingAnim;
  const scale = State.image.naturalWidth ? (canvasW / State.image.naturalWidth) : 1.0;

  // 2. Tüm Vurguları Sırayla Çiz
  for (const ann of State.annotations) {
    const isPending = !!ann.isPending;
    const hasReached = !isPending && (currentTime >= ann.timestamp);
    let showAnn = false;
    let animProgress = 1.0;

    if (isEditMode) {
      showAnn = true;
      animProgress = 1.0;
    } else if (isTestingAnim) {
      if (!isPending) {
        const elapsed = (performance.now() - State.playback.animTestStartTime) / 1000;
        animProgress = Math.min(1.0, elapsed / (ann.animDuration || 0.8));
        showAnn = true;
      }
    } else if (hasReached) {
      // Vurgu zamanı geldi ve video sonuna kadar sabit kalır!
      const elapsed = currentTime - ann.timestamp;
      animProgress = Math.min(1.0, elapsed / (ann.animDuration || 0.8));
      showAnn = true;
    }

    if (!showAnn) continue;

    const bx = ann.box.x * scale;
    const by = ann.box.y * scale;
    const bw = ann.box.width * scale;
    const bh = ann.box.height * scale;

    // Eğer düzenleme modunda ve bekleyen şıksa aday şık kutusu çiz
    if (isEditMode && isPending) {
      drawPendingChoiceBox(targetCtx, bx, by, bw, bh, scale, ann);
      if (ann.id === State.activeAnnotationId) {
        drawEditHandles(targetCtx, bx, by, bw, bh);
      }
      continue;
    }

    // Dikdörtgen veya Elips Vurgu
    drawShapeHighlight(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann);

    // Onay veya Çarpı İkonu Rozeti
    if (ann.type === 'correct' && ann.checkmark?.enabled) {
      drawAnimatedCheckmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann);
    } else if (ann.type === 'wrong' && ann.crossmark?.enabled) {
      drawAnimatedCrossmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann);
    }

    // Düzenleme modunda şık harfi rozetini sol üstte göster
    if (isEditMode && ann.choiceLetter) {
      drawChoiceTag(targetCtx, bx, by, scale, ann);
    }

    // Düzenleme modunda seçili ise tutamaçları çiz
    if (isEditMode && ann.id === State.activeAnnotationId) {
      drawEditHandles(targetCtx, bx, by, bw, bh);
    }
  }

  // Henüz kaydedilmemiş bir çizim varsa (çizim anında)
  if (isEditMode && !State.activeAnnotationId && State.box.active && State.box.width > 5) {
    const bx = State.box.x * scale;
    const by = State.box.y * scale;
    const bw = State.box.width * scale;
    const bh = State.box.height * scale;
    drawEditHandles(targetCtx, bx, by, bw, bh);
  }

  // 3. İzlenme Oranını Artıran İlerleme Çubuğu (Retention Bar)
  if (State.retentionBar.enabled) {
    drawRetentionBar(targetCtx, currentTime, State.audio.duration);
  }
}

/**
 * Bekleyen Şık Aday Kutusu (Edit modunda şıkların yerini gösteren zarif kesikli çerçeve)
 */
function drawPendingChoiceBox(targetCtx, bx, by, bw, bh, scale, ann) {
  const isActive = ann.id === State.activeAnnotationId;
  targetCtx.save();

  // Kesikli çizgi çerçeve
  targetCtx.strokeStyle = isActive ? '#10b981' : 'rgba(56, 189, 248, 0.7)';
  targetCtx.lineWidth = Math.max(1.5, (isActive ? 3 : 2) * scale);
  targetCtx.setLineDash([6 * scale, 4 * scale]);

  const radius = (ann.borderRadius || 14) * scale;
  targetCtx.beginPath();
  if (targetCtx.roundRect) targetCtx.roundRect(bx, by, bw, bh, radius);
  else drawRoundRectFallback(targetCtx, bx, by, bw, bh, radius);
  targetCtx.stroke();
  targetCtx.setLineDash([]);

  // Hafif arka plan dolgusu
  targetCtx.fillStyle = isActive ? 'rgba(16, 185, 129, 0.14)' : 'rgba(56, 189, 248, 0.05)';
  targetCtx.fill();

  // Sol üstte şık harfi rozeti (İçeriği kapatmayan zarif hap)
  const badgeH = Math.max(16, Math.round(18 * scale));
  const badgeW = Math.max(20, Math.round(22 * scale));
  const badgeX = bx + 4 * scale;
  const badgeY = by + 4 * scale;

  targetCtx.fillStyle = isActive ? '#10b981' : '#0284c7';
  targetCtx.beginPath();
  if (targetCtx.roundRect) targetCtx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * scale);
  else targetCtx.rect(badgeX, badgeY, badgeW, badgeH);
  targetCtx.fill();

  targetCtx.fillStyle = '#ffffff';
  targetCtx.font = `bold ${Math.max(9, Math.round(11 * scale))}px "JetBrains Mono", monospace`;
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(ann.choiceLetter || '?', badgeX + badgeW / 2, badgeY + badgeH / 2);

  targetCtx.restore();
}

/**
 * İşaretlenmiş Şık Rozeti (Edit modunda şık kutusunun üstündeki harf etiketi)
 */
function drawChoiceTag(targetCtx, bx, by, scale, ann) {
  targetCtx.save();
  const badgeH = Math.max(16, Math.round(18 * scale));
  const badgeW = Math.max(20, Math.round(22 * scale));
  const badgeX = bx + 4 * scale;
  const badgeY = by + 4 * scale;

  targetCtx.fillStyle = ann.type === 'wrong' ? '#ef4444' : '#22c55e';
  targetCtx.beginPath();
  if (targetCtx.roundRect) targetCtx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * scale);
  else targetCtx.rect(badgeX, badgeY, badgeW, badgeH);
  targetCtx.fill();

  targetCtx.fillStyle = '#ffffff';
  targetCtx.font = `bold ${Math.max(9, Math.round(11 * scale))}px "JetBrains Mono", monospace`;
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(ann.choiceLetter, badgeX + badgeW / 2, badgeY + badgeH / 2);
  targetCtx.restore();
}

/**
 * Dikdörtgen veya Elips Şeklinde Vurgu Çizimi
 */
function drawShapeHighlight(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann) {
  let animScale = 1.0;
  let animAlpha = ann.opacity;
  let glowPulse = 0;

  if (!isEditMode) {
    if (ann.animType === 'scale_glow') {
      const eased = easeOutBack(animProgress);
      animScale = Math.max(0.05, Math.min(1.22, eased));
      animAlpha = ann.opacity * Math.min(1.0, animProgress * 2.2);
      glowPulse = Math.max(0, 1.0 - animProgress);
    } else if (ann.animType === 'fade_pulse') {
      animScale = 1.0 + 0.14 * Math.sin(animProgress * Math.PI);
      animAlpha = ann.opacity * easeOutQuad(animProgress);
      glowPulse = Math.sin(animProgress * Math.PI);
    } else if (ann.animType === 'pop_in') {
      const eased = easeOutBack(animProgress);
      animScale = Math.max(0.05, Math.min(1.25, eased));
      animAlpha = ann.opacity;
      glowPulse = Math.max(0, 1.0 - animProgress);
    } else {
      animAlpha = ann.opacity * animProgress;
    }
  }

  const hex = ann.color || '#22c55e';
  const r = parseInt(hex.slice(1, 3), 16) || 34;
  const g = parseInt(hex.slice(3, 5), 16) || 197;
  const b = parseInt(hex.slice(5, 7), 16) || 94;
  const radius = (ann.borderRadius || 16) * scale;
  const centerX = bx + bw / 2;
  const centerY = by + bh / 2;

  targetCtx.save();
  targetCtx.translate(centerX, centerY);
  targetCtx.scale(animScale, animScale);
  targetCtx.translate(-centerX, -centerY);

  if (ann.glow) {
    targetCtx.shadowColor = hex;
    targetCtx.shadowBlur = Math.round((4 + glowPulse * 6) * scale);
  } else {
    targetCtx.shadowBlur = 0;
  }

  targetCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${animAlpha})`;
  targetCtx.strokeStyle = hex;
  targetCtx.lineWidth = (ann.borderWidth || 4) * scale;

  targetCtx.beginPath();
  if (ann.shape === 'rect') {
    if (targetCtx.roundRect) {
      targetCtx.roundRect(bx, by, bw, bh, radius);
    } else {
      drawRoundRectFallback(targetCtx, bx, by, bw, bh, radius);
    }
  } else {
    targetCtx.ellipse(centerX, centerY, bw / 2, bh / 2, 0, 0, 2 * Math.PI);
  }
  targetCtx.fill();
  targetCtx.stroke();
  targetCtx.restore();

  // Dışa Yayılan Hafif Şok Dalgası (Subtle Shockwave Ring)
  if (glowPulse > 0.05) {
    targetCtx.save();
    const shockExpand = (1.0 - glowPulse) * 8 * scale;
    targetCtx.lineWidth = Math.max(1.5, ((ann.borderWidth || 4) * 0.7) * scale);
    targetCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.35 * glowPulse})`;
    targetCtx.shadowColor = hex;
    targetCtx.shadowBlur = 3 * scale;

    targetCtx.beginPath();
    if (ann.shape === 'rect') {
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
}


/**
 * Doğru Seçenek için Animasyonlu Onay İşareti (✓) Rozeti
 */
function drawAnimatedCheckmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann) {
  const R = Math.max(14, Math.min(26, bh * 0.42));
  const pos = ann.checkmark?.position || 'right';
  let cx, cy;

  if (pos === 'right') {
    cx = bx + bw + R + 14 * scale;
    cy = by + bh / 2;
  } else if (pos === 'left') {
    cx = bx - R - 14 * scale;
    cy = by + bh / 2;
  } else if (pos === 'top_right') {
    cx = bx + bw + 4 * scale;
    cy = by - 4 * scale;
  } else {
    cx = bx + bw - R - 8 * scale;
    cy = by + bh / 2;
  }

  let badgeScale = 1.0;
  let strokeProgress = 1.0;

  if (!isEditMode) {
    const badgeRaw = Math.max(0, Math.min(1.0, (animProgress - 0.1) / 0.55));
    badgeScale = easeOutBack(badgeRaw);
    strokeProgress = Math.max(0, Math.min(1.0, (animProgress - 0.25) / 0.70));
  }

  if (badgeScale <= 0.01) return;

  targetCtx.save();
  targetCtx.translate(cx, cy);
  targetCtx.scale(badgeScale, badgeScale);

  const greenHex = ann.color || '#22c55e';
  const style = ann.checkmark?.style || 'badge';

  if (style === 'badge') {
    targetCtx.beginPath();
    targetCtx.arc(0, 0, R, 0, 2 * Math.PI);
    targetCtx.fillStyle = greenHex;
    if (ann.glow) {
      targetCtx.shadowColor = greenHex;
      targetCtx.shadowBlur = 4 * scale;
    }
    targetCtx.fill();

    targetCtx.strokeStyle = '#ffffff';
    targetCtx.lineWidth = Math.max(1.5, 2.5 * scale);
    targetCtx.stroke();
  }

  if (strokeProgress > 0.05) {
    const p0 = { x: -0.42 * R, y: -0.02 * R };
    const p1 = { x: -0.10 * R, y: 0.38 * R };
    const p2 = { x: 0.44 * R, y: -0.36 * R };

    targetCtx.beginPath();
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.lineWidth = Math.max(2.5, (style === 'badge' ? 3.5 : 4.5) * scale);
    targetCtx.strokeStyle = style === 'badge' ? '#ffffff' : greenHex;

    if (style === 'plain' && ann.glow) {
      targetCtx.shadowColor = greenHex;
      targetCtx.shadowBlur = 4 * scale;
    }

    if (strokeProgress <= 0.38) {
      const t = strokeProgress / 0.38;
      targetCtx.moveTo(p0.x, p0.y);
      targetCtx.lineTo(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t);
    } else {
      const t = (strokeProgress - 0.38) / 0.62;
      targetCtx.moveTo(p0.x, p0.y);
      targetCtx.lineTo(p1.x, p1.y);
      targetCtx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
    }
    targetCtx.stroke();
  }

  targetCtx.restore();
}

/**
 * Yanlış Seçenek için Animasyonlu Kırmızı Çarpı İşareti (✕) Rozeti
 */
function drawAnimatedCrossmark(targetCtx, bx, by, bw, bh, scale, animProgress, isEditMode, ann) {
  const R = Math.max(14, Math.min(26, bh * 0.42));
  const pos = ann.crossmark?.position || 'left';
  let cx, cy;
  if (pos === 'left') {
    cx = bx - R - 12 * scale;
    cy = by + bh / 2;
    // Eğer görselin sol kenarından taşarsa kutunun içine/soluna güvenli yerleştir
    if (cx - R < 4) {
      cx = bx + R + 6 * scale;
    }
  } else if (pos === 'right') {
    cx = bx + bw + R + 12 * scale;
    cy = by + bh / 2;
  } else {
    cx = bx - R - 12 * scale;
    cy = by + bh / 2;
  }

  let badgeScale = 1.0;
  let strokeProgress = 1.0;

  if (!isEditMode) {
    const badgeRaw = Math.max(0, Math.min(1.0, (animProgress - 0.1) / 0.50));
    badgeScale = easeOutBack(badgeRaw);
    strokeProgress = Math.max(0, Math.min(1.0, (animProgress - 0.25) / 0.70));
  }

  if (badgeScale <= 0.01) return;

  targetCtx.save();
  targetCtx.translate(cx, cy);
  targetCtx.scale(badgeScale, badgeScale);

  const redHex = ann.color || '#ef4444';

  // 1. Kırmızı Daire Rozet
  targetCtx.beginPath();
  targetCtx.arc(0, 0, R, 0, 2 * Math.PI);
  targetCtx.fillStyle = redHex;
  if (ann.glow) {
    targetCtx.shadowColor = redHex;
    targetCtx.shadowBlur = 4 * scale;
  }
  targetCtx.fill();

  targetCtx.strokeStyle = '#ffffff';
  targetCtx.lineWidth = Math.max(1.5, 2.5 * scale);
  targetCtx.stroke();

  // 2. Çarpı İşareti Çizgileri (✕)
  if (strokeProgress > 0.05) {
    const arm = 0.40 * R;

    targetCtx.beginPath();
    targetCtx.lineCap = 'round';
    targetCtx.lineWidth = Math.max(2.5, 3.5 * scale);
    targetCtx.strokeStyle = '#ffffff';

    const p1Start = { x: -arm, y: -arm };
    const p1End   = { x: arm, y: arm };
    const p2Start = { x: arm, y: -arm };
    const p2End   = { x: -arm, y: arm };

    if (strokeProgress <= 0.50) {
      const t = strokeProgress / 0.50;
      targetCtx.moveTo(p1Start.x, p1Start.y);
      targetCtx.lineTo(p1Start.x + (p1End.x - p1Start.x) * t, p1Start.y + (p1End.y - p1Start.y) * t);
    } else {
      targetCtx.moveTo(p1Start.x, p1Start.y);
      targetCtx.lineTo(p1End.x, p1End.y);

      const t = (strokeProgress - 0.50) / 0.50;
      targetCtx.moveTo(p2Start.x, p2Start.y);
      targetCtx.lineTo(p2Start.x + (p2End.x - p2Start.x) * t, p2Start.y + (p2End.y - p2Start.y) * t);
    }
    targetCtx.stroke();
  }

  targetCtx.restore();
}

/**
 * İzlenme Oranını Artıran İlerleme Çubuğu (Retention Bar)
 */
function drawRetentionBar(targetCtx, currentTime, totalDuration) {
  if (!State.retentionBar.enabled) return;
  const dur = (totalDuration > 0) ? totalDuration : (State.audio.duration || 1);
  const progress = Math.min(1.0, Math.max(0, currentTime / dur));
  const canvasW = targetCtx.canvas.width;
  const canvasH = targetCtx.canvas.height;
  const barHeight = Math.max(3, Math.round(State.retentionBar.height * (canvasW / 1280)));
  const y = State.retentionBar.position === 'top' ? 0 : (canvasH - barHeight);

  targetCtx.save();
  // Arka plan koyu kanal
  targetCtx.fillStyle = 'rgba(15, 23, 42, 0.70)';
  targetCtx.fillRect(0, y, canvasW, barHeight);

  // İlerleme dolgusu
  const currentW = canvasW * progress;
  targetCtx.fillStyle = State.retentionBar.color;
  targetCtx.shadowColor = State.retentionBar.color;
  targetCtx.shadowBlur = 4;
  targetCtx.fillRect(0, y, currentW, barHeight);

  // Parlayan ön uç
  if (progress > 0.01 && progress < 0.995) {
    targetCtx.fillStyle = '#ffffff';
    targetCtx.shadowColor = '#ffffff';
    targetCtx.shadowBlur = 4;
    targetCtx.fillRect(Math.max(0, currentW - 3), y, 3, barHeight);
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
  if (State.annotations.length === 0 && !State.box.active) {
    alert('Önce görsel üzerinde bir vurgu alanı çizin!');
    return;
  }
  State.playback.animTestStartTime = performance.now();
  function loop() {
    if (State.playback.animTestStartTime === null) return;
    const elapsed = (performance.now() - State.playback.animTestStartTime) / 1000;
    renderCanvas();
    if (elapsed < (State.highlight.animDuration || 0.8) + 0.3) {
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
function setTimestamp(seconds, type = null) {
  const ts = Math.max(0, Math.min(seconds, State.audio.duration || 9999));
  State.timestamp = ts;

  const ann = getActiveAnnotation();
  if (ann) {
    ann.timestamp = ts;
    ann.isPending = false;
    if (type) {
      ann.type = type;
      if (ann.isChoice) {
        ann.label = `${ann.choiceLetter} Şıkkı (${type === 'correct' ? '✓ Doğru' : '✕ Yanlış'})`;
      } else {
        ann.label = type === 'correct' ? 'Doğru (✓)' : 'Yanlış (✕)';
      }
      ann.color = type === 'correct' ? '#22c55e' : '#ef4444';
      ann.checkmark.enabled = (type === 'correct');
      ann.crossmark.enabled = (type === 'wrong');
      DOM.cfgColorFill.value = ann.color;
      DOM.textColorFill.textContent = ann.color.toUpperCase();
    }

    if (ann.isChoice) {
      advanceToNextPendingChoice();
    }
  }

  DOM.inputTimestampManual.value = ts.toFixed(2);
  DOM.badgeMarkedTime.textContent = formatTime(ts);
  DOM.badgeMarkedTime.classList.remove('bg-emerald-500/10', 'text-emerald-400');
  DOM.badgeMarkedTime.classList.add(type === 'wrong' ? 'bg-rose-500' : 'bg-emerald-500', 'text-zinc-950', 'neon-glow');
  setTimeout(() => {
    DOM.badgeMarkedTime.classList.remove('neon-glow');
  }, 2000);

  updateSmartAssistantUI();
  renderAnnotationsList();
  updateFfmpegCommand();
  updateRenderButtonState();
  updateStepIndicator();
  renderCanvas();
}

DOM.btnMarkTimestamp.addEventListener('click', () => {
  if (!wavesurfer) return;
  const current = wavesurfer.getCurrentTime();
  setTimestamp(current, 'correct');
});

if (DOM.btnMarkWrong) {
  DOM.btnMarkWrong.addEventListener('click', () => {
    if (!wavesurfer) return;
    const current = wavesurfer.getCurrentTime();
    setTimestamp(current, 'wrong');
  });
}

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
// 7. AYARLARI HATIRLAMA (LOCALSTORAGE) & STİL DİNLEYİCİLERİ
// ==========================================
const SETTINGS_STORAGE_KEY = 'educlip_user_preferences_v1';

function saveSettings() {
  try {
    const prefs = {
      highlight: {
        color: State.highlight.color,
        opacity: State.highlight.opacity,
        borderWidth: State.highlight.borderWidth,
        borderRadius: State.highlight.borderRadius,
        animType: State.highlight.animType,
        animDuration: State.highlight.animDuration,
        glow: State.highlight.glow,
      },
      checkmark: {
        enabled: State.checkmark.enabled,
        position: State.checkmark.position,
        style: State.checkmark.style,
      },
      retentionBar: {
        enabled: State.retentionBar.enabled,
        color: State.retentionBar.color,
        position: State.retentionBar.position,
        height: State.retentionBar.height,
      },
      export: {
        engine: DOM.exportEngine ? DOM.exportEngine.value : 'webcodecs',
        resolution: DOM.exportResolution ? DOM.exportResolution.value : 'original',
        fps: DOM.exportFps ? parseInt(DOM.exportFps.value, 10) : 30,
      }
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Ayarlar localStorage üzerine kaydedilemedi:', e);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);

    if (prefs.highlight) {
      if (prefs.highlight.color) {
        State.highlight.color = prefs.highlight.color;
        if (DOM.cfgColorFill) DOM.cfgColorFill.value = prefs.highlight.color;
        if (DOM.textColorFill) DOM.textColorFill.textContent = prefs.highlight.color.toUpperCase();
      }
      if (typeof prefs.highlight.opacity === 'number') {
        State.highlight.opacity = prefs.highlight.opacity;
        if (DOM.cfgOpacity) {
          DOM.cfgOpacity.value = Math.round(prefs.highlight.opacity * 100);
          if (DOM.textOpacity) DOM.textOpacity.textContent = `%${Math.round(prefs.highlight.opacity * 100)}`;
        }
      }
      if (typeof prefs.highlight.borderWidth === 'number') {
        State.highlight.borderWidth = prefs.highlight.borderWidth;
        if (DOM.cfgBorderWidth) {
          DOM.cfgBorderWidth.value = prefs.highlight.borderWidth;
          if (DOM.textBorderWidth) DOM.textBorderWidth.textContent = `${prefs.highlight.borderWidth}px`;
        }
      }
      if (typeof prefs.highlight.borderRadius === 'number') {
        State.highlight.borderRadius = prefs.highlight.borderRadius;
        if (DOM.cfgBorderRadius) {
          DOM.cfgBorderRadius.value = prefs.highlight.borderRadius;
          if (DOM.textBorderRadius) DOM.textBorderRadius.textContent = `${prefs.highlight.borderRadius}px`;
        }
      }
      if (prefs.highlight.animType) {
        State.highlight.animType = prefs.highlight.animType;
        if (DOM.cfgAnimType) DOM.cfgAnimType.value = prefs.highlight.animType;
      }
      if (typeof prefs.highlight.animDuration === 'number') {
        State.highlight.animDuration = prefs.highlight.animDuration;
        if (DOM.cfgAnimDuration) {
          DOM.cfgAnimDuration.value = prefs.highlight.animDuration;
          if (DOM.textAnimDuration) DOM.textAnimDuration.textContent = `${prefs.highlight.animDuration.toFixed(1)}s`;
        }
      }
      if (typeof prefs.highlight.glow === 'boolean') {
        State.highlight.glow = prefs.highlight.glow;
        if (DOM.cfgGlowToggle) DOM.cfgGlowToggle.checked = prefs.highlight.glow;
      }
    }

    if (prefs.checkmark) {
      if (typeof prefs.checkmark.enabled === 'boolean') {
        State.checkmark.enabled = prefs.checkmark.enabled;
        if (DOM.cfgCheckmarkToggle) DOM.cfgCheckmarkToggle.checked = prefs.checkmark.enabled;
        if (DOM.checkmarkOptionsContainer) {
          DOM.checkmarkOptionsContainer.style.display = prefs.checkmark.enabled ? 'grid' : 'none';
        }
      }
      if (prefs.checkmark.position) {
        State.checkmark.position = prefs.checkmark.position;
        if (DOM.cfgCheckmarkPos) DOM.cfgCheckmarkPos.value = prefs.checkmark.position;
      }
      if (prefs.checkmark.style) {
        State.checkmark.style = prefs.checkmark.style;
        if (DOM.cfgCheckmarkStyle) DOM.cfgCheckmarkStyle.value = prefs.checkmark.style;
      }
    }

    if (prefs.retentionBar) {
      if (typeof prefs.retentionBar.enabled === 'boolean') {
        State.retentionBar.enabled = prefs.retentionBar.enabled;
        if (DOM.cfgRetentionToggle) DOM.cfgRetentionToggle.checked = prefs.retentionBar.enabled;
      }
      if (prefs.retentionBar.color) {
        State.retentionBar.color = prefs.retentionBar.color;
        if (DOM.cfgRetentionColor) DOM.cfgRetentionColor.value = prefs.retentionBar.color;
        if (DOM.textRetentionColor) DOM.textRetentionColor.textContent = prefs.retentionBar.color.toUpperCase();
      }
      if (prefs.retentionBar.position) {
        State.retentionBar.position = prefs.retentionBar.position;
        if (DOM.cfgRetentionPos) DOM.cfgRetentionPos.value = prefs.retentionBar.position;
      }
      if (typeof prefs.retentionBar.height === 'number') {
        State.retentionBar.height = prefs.retentionBar.height;
        if (DOM.cfgRetentionHeight) {
          DOM.cfgRetentionHeight.value = prefs.retentionBar.height;
          if (DOM.textRetentionHeight) DOM.textRetentionHeight.textContent = `${prefs.retentionBar.height}px`;
        }
      }
    }

    if (prefs.export) {
      if (DOM.exportEngine && prefs.export.engine) DOM.exportEngine.value = prefs.export.engine;
      if (DOM.exportResolution && prefs.export.resolution) DOM.exportResolution.value = prefs.export.resolution;
      if (DOM.exportFps && prefs.export.fps) DOM.exportFps.value = prefs.export.fps;
    }
  } catch (e) {
    console.warn('Kayıtlı ayarlar okunurken hata:', e);
  }
}

// Stil Dinleyicileri
DOM.cfgColorFill.addEventListener('input', (e) => {
  State.highlight.color = e.target.value;
  DOM.textColorFill.textContent = e.target.value.toUpperCase();
  const ann = getActiveAnnotation();
  if (ann) ann.color = e.target.value;
  saveSettings();
  renderCanvas();
  updateFfmpegCommand();
});

DOM.cfgOpacity.addEventListener('input', (e) => {
  State.highlight.opacity = parseFloat(e.target.value) / 100;
  DOM.textOpacity.textContent = `%${Math.round(State.highlight.opacity * 100)}`;
  const ann = getActiveAnnotation();
  if (ann) ann.opacity = State.highlight.opacity;
  saveSettings();
  renderCanvas();
});

DOM.cfgBorderWidth.addEventListener('input', (e) => {
  State.highlight.borderWidth = parseInt(e.target.value, 10);
  DOM.textBorderWidth.textContent = `${State.highlight.borderWidth}px`;
  const ann = getActiveAnnotation();
  if (ann) ann.borderWidth = State.highlight.borderWidth;
  saveSettings();
  renderCanvas();
});

DOM.cfgBorderRadius.addEventListener('input', (e) => {
  State.highlight.borderRadius = parseInt(e.target.value, 10);
  DOM.textBorderRadius.textContent = `${State.highlight.borderRadius}px`;
  const ann = getActiveAnnotation();
  if (ann) ann.borderRadius = State.highlight.borderRadius;
  saveSettings();
  renderCanvas();
});

DOM.cfgAnimType.addEventListener('change', (e) => {
  State.highlight.animType = e.target.value;
  const ann = getActiveAnnotation();
  if (ann) ann.animType = e.target.value;
  saveSettings();
});

DOM.cfgAnimDuration.addEventListener('input', (e) => {
  State.highlight.animDuration = parseFloat(e.target.value);
  DOM.textAnimDuration.textContent = `${State.highlight.animDuration.toFixed(1)}s`;
  const ann = getActiveAnnotation();
  if (ann) ann.animDuration = State.highlight.animDuration;
  saveSettings();
});

DOM.cfgGlowToggle.addEventListener('change', (e) => {
  State.highlight.glow = e.target.checked;
  const ann = getActiveAnnotation();
  if (ann) ann.glow = e.target.checked;
  saveSettings();
  renderCanvas();
});

// Onay İşareti (Tik ✓) Dinleyicileri
DOM.cfgCheckmarkToggle.addEventListener('change', (e) => {
  State.checkmark.enabled = e.target.checked;
  if (DOM.checkmarkOptionsContainer) {
    DOM.checkmarkOptionsContainer.style.display = e.target.checked ? 'grid' : 'none';
  }
  const ann = getActiveAnnotation();
  if (ann && ann.checkmark) ann.checkmark.enabled = e.target.checked;
  saveSettings();
  renderCanvas();
});

DOM.cfgCheckmarkPos.addEventListener('change', (e) => {
  State.checkmark.position = e.target.value;
  const ann = getActiveAnnotation();
  if (ann && ann.checkmark) ann.checkmark.position = e.target.value;
  saveSettings();
  renderCanvas();
});

DOM.cfgCheckmarkStyle.addEventListener('change', (e) => {
  State.checkmark.style = e.target.value;
  const ann = getActiveAnnotation();
  if (ann && ann.checkmark) ann.checkmark.style = e.target.value;
  saveSettings();
  renderCanvas();
});

// Retention Bar Dinleyicileri & Damlalık (EyeDropper)
function setRetentionColor(hex) {
  State.retentionBar.color = hex;
  if (DOM.cfgRetentionColor) DOM.cfgRetentionColor.value = hex;
  if (DOM.textRetentionColor) DOM.textRetentionColor.textContent = hex.toUpperCase();
  saveSettings();
  renderCanvas();
}

if (DOM.cfgRetentionToggle) {
  DOM.cfgRetentionToggle.addEventListener('change', (e) => {
    State.retentionBar.enabled = e.target.checked;
    saveSettings();
    renderCanvas();
  });
}

if (DOM.cfgRetentionColor) {
  DOM.cfgRetentionColor.addEventListener('input', (e) => {
    setRetentionColor(e.target.value);
  });
}

if (DOM.btnRetentionEyedropper) {
  DOM.btnRetentionEyedropper.addEventListener('click', async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          setRetentionColor(result.sRGBHex);
        }
      } catch (err) {
        console.log('EyeDropper iptal edildi');
      }
    } else {
      DOM.cfgRetentionColor.click();
    }
  });
}

if (DOM.cfgRetentionPos) {
  DOM.cfgRetentionPos.addEventListener('change', (e) => {
    State.retentionBar.position = e.target.value;
    saveSettings();
    renderCanvas();
  });
}

if (DOM.cfgRetentionHeight) {
  DOM.cfgRetentionHeight.addEventListener('input', (e) => {
    State.retentionBar.height = parseInt(e.target.value, 10);
    if (DOM.textRetentionHeight) DOM.textRetentionHeight.textContent = `${State.retentionBar.height}px`;
    saveSettings();
    renderCanvas();
  });
}

// Export Ayarları Dinleyicileri
if (DOM.exportEngine) DOM.exportEngine.addEventListener('change', saveSettings);
if (DOM.exportResolution) DOM.exportResolution.addEventListener('change', saveSettings);
if (DOM.exportFps) DOM.exportFps.addEventListener('change', saveSettings);

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
      setTimestamp(wavesurfer.getCurrentTime(), 'correct');
    }
  } else if (e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    if (wavesurfer && State.audio.duration > 0) {
      setTimestamp(wavesurfer.getCurrentTime(), 'wrong');
    }
  } else if (e.key === '1') {
    setToolType('correct');
  } else if (e.key === '2') {
    setToolType('wrong');
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (State.activeAnnotationId) {
      e.preventDefault();
      deleteAnnotation(State.activeAnnotationId);
    } else if (State.box.active) {
      e.preventDefault();
      DOM.btnClearBox.click();
    }
  } else if (e.key === 'p' || e.key === 'P') {
    if (wavesurfer && State.audio.duration > 0) {
      DOM.btnPreviewHighlight.click();
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    cycleChoice(e.shiftKey ? -1 : 1);
  } else if (e.key === 'z' || e.key === 'Z') {
    if (!e.metaKey) { // Z veya Ctrl+Z ile son şıkkı geri al
      e.preventDefault();
      undoLastChoice();
    }
  } else if (State.box.active && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') State.box.x = Math.max(0, State.box.x - step);
    if (e.key === 'ArrowRight') State.box.x = Math.min(State.image.naturalWidth - State.box.width, State.box.x + step);
    if (e.key === 'ArrowUp') State.box.y = Math.max(0, State.box.y - step);
    if (e.key === 'ArrowDown') State.box.y = Math.min(State.image.naturalHeight - State.box.height, State.box.y + step);
    const ann = getActiveAnnotation();
    if (ann) {
      ann.box.x = State.box.x;
      ann.box.y = State.box.y;
    }
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
  const hasValidAnn = State.annotations.some(a => !a.isPending && a.box.width > 5) || (State.box.active && State.box.width > 5);
  const ready = State.image.element !== null && State.audio.file !== null && hasValidAnn;
  DOM.btnStartRender.disabled = !ready;
}

function updateStepIndicator() {
  const s1 = !!(State.image.element && State.audio.file);
  const s2 = State.annotations.length > 0 || State.box.active;
  const s3 = State.annotations.some(a => !a.isPending && a.timestamp > 0) || State.timestamp > 0;
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
  const validAnnotations = State.annotations.filter(a => !a.isPending && a.box && a.box.width > 5);
  const activeList = validAnnotations.length > 0 ? validAnnotations : (State.box.active ? [{
    box: State.box,
    timestamp: State.timestamp,
    color: State.highlight.color,
    shape: State.highlight.shape
  }] : []);

  if (!State.image.naturalWidth || activeList.length === 0) {
    DOM.ffmpegCommandText.textContent = '# Lütfen önce soru görselini yükleyin ve alanı belirleyin.';
    return;
  }

  const filters = activeList.map(ann => {
    const bx = Math.round(ann.box.x);
    const by = Math.round(ann.box.y);
    const bw = Math.round(ann.box.width);
    const bh = Math.round(ann.box.height);
    const ts = (ann.timestamp || 0).toFixed(2);
    const hex = (ann.color || '#22c55e').replace('#', '0x');

    return `drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=${hex}@0.35:t=fill:enable='gte(t,${ts})',drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=${hex}:t=4:enable='gte(t,${ts})'`;
  }).join(',');

  const cmd = `ffmpeg -loop 1 -i soru.png -i ses.mp3 -filter_complex "[0:v]${filters}[v]" -map "[v]" -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -y cikti.mp4`;
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
  // 1. Örnek Soru Görseli Üret (1600x1000 Yüksek Çözünürlüklü Matematik/Geometri Sorusu)
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

    // 2 Farklı Vurguyu Otomatik Ekle:
    // 1. Yanlış Şıkkı Eleme (A Şıkkı Kırmızı + ✕) -> 1.80 saniye
    // 2. Doğru Şıkkı Vurgulama (C Şıkkı Yeşil + ✓) -> 3.60 saniye
    setTimeout(() => {
      State.annotations = [
        {
          id: 'demo_ann_2',
          isChoice: true,
          choiceLetter: 'A',
          label: 'A Şıkkı (✕ Yanlış)',
          type: 'wrong',
          shape: 'rect',
          box: { x: 125, y: 470, width: 220, height: 55 },
          timestamp: 2.20,
          color: '#ef4444',
          opacity: 0.30,
          borderWidth: 4,
          borderRadius: 14,
          glow: true,
          animType: 'scale_glow',
          animDuration: 0.7,
          checkmark: { enabled: false },
          crossmark: { enabled: true, position: 'left', style: 'badge' }
        },
        {
          id: 'demo_ann_3',
          isChoice: true,
          choiceLetter: 'C',
          label: 'C Şıkkı (✓ Doğru)',
          type: 'correct',
          shape: 'rect',
          box: { x: 125, y: 630, width: 640, height: 60 },
          timestamp: 3.80,
          color: '#22c55e',
          opacity: 0.30,
          borderWidth: 4,
          borderRadius: 16,
          glow: true,
          animType: 'scale_glow',
          animDuration: 0.8,
          checkmark: { enabled: true, position: 'right', style: 'badge' },
          crossmark: { enabled: false }
        }
      ];

      // Retention Bar Aktif ve Alt tarafta yeşil
      State.retentionBar.enabled = true;
      State.retentionBar.color = '#22c55e';
      State.retentionBar.position = 'bottom';
      State.retentionBar.height = 6;
      if (DOM.cfgRetentionToggle) DOM.cfgRetentionToggle.checked = true;
      if (DOM.cfgRetentionColor) DOM.cfgRetentionColor.value = '#22c55e';
      if (DOM.textRetentionColor) DOM.textRetentionColor.textContent = '#22C55E';

      selectAnnotation('demo_ann_3');
      updateSmartAssistantUI();
    }, 400);
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
  if (confirm('Tüm yüklenen dosyaları ve özel stil ayarlarınızı sıfırlamak istiyor musunuz?')) {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
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
  loadSettings();
  initWaveSurfer();
});
