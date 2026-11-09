// Web Audio API Sound Generator for Floating AI Predator HUD

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Win chime sound
export function playWinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
  osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}

// Win Fanfare & Spoken "You Win!" Voice Audio Announcement
export function playYouWinVoice() {
  const ctx = getAudioContext();
  if (ctx) {
    const now = ctx.currentTime;

    // 1. Triumphant Fanfare Chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });

    // 2. Resonant Arcade "YOU - WIN!" Acoustic Synthesizer Accents
    // First Syllable "YOU" (D5 -> G5 rise)
    const youOsc = ctx.createOscillator();
    const youGain = ctx.createGain();
    youOsc.type = 'sine';
    youOsc.frequency.setValueAtTime(587.33, now + 0.12);
    youOsc.frequency.exponentialRampToValueAtTime(783.99, now + 0.32);
    youGain.gain.setValueAtTime(0.16, now + 0.12);
    youGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    youOsc.connect(youGain);
    youGain.connect(ctx.destination);
    youOsc.start(now + 0.12);
    youOsc.stop(now + 0.36);

    // Second Syllable "WIN!" (A5 -> D6 triumphant peak)
    const winOsc = ctx.createOscillator();
    const winGain = ctx.createGain();
    winOsc.type = 'sine';
    winOsc.frequency.setValueAtTime(880.00, now + 0.38);
    winOsc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.65);
    winGain.gain.setValueAtTime(0.20, now + 0.38);
    winGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    winOsc.connect(winGain);
    winGain.connect(ctx.destination);
    winOsc.start(now + 0.38);
    winOsc.stop(now + 0.85);
  }

  // 3. Clear Natural "You Win!" Spoken Voice via Web Speech Synthesis API
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // clear previous speech queue
      const utterance = new SpeechSynthesisUtterance('You Win!');
      utterance.lang = 'en-US';
      utterance.pitch = 1.35; // energetic, upbeat victorious pitch
      utterance.rate = 1.05; // snappy arcade voice
      utterance.volume = 1.0;

      // Select high quality voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn('Speech synthesis voice warning:', err);
  }
}

// Sci-fi Radar Lock / New Prediction Alert
export function playRadarLockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

// Countdown Tick (Last 5 seconds)
export function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// Admin Unlocked Sci-fi Chord
export function playAdminUnlockedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const frequencies = [440, 554.37, 659.25, 880];

  frequencies.forEach((freq, idx) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.08, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.4);
  });
}

// Authentic Myanmar Spoken Vocal for Target Profit:
// "ဂုဏ်ယူပါတယ် မင်းသတ်မှတ်ထားသောအမြတ်ငွေကိုရရှိပါပြီ"
export function playMyanmarTargetProfitVoice(): Promise<void> {
  return new Promise((resolve) => {
    // 1. Play celebratory fanfare chime
    playWinSound();

    let audioPlayed = false;

    // 2. Play native authentic Burmese audio stream from /api/audio/target-profit-burmese
    try {
      const audio = new Audio('/api/audio/target-profit-burmese');
      audio.volume = 1.0;
      audio.onended = () => {
        resolve();
      };
      audio.onerror = () => {
        fallbackWebSpeech();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioPlayed = true;
          })
          .catch((err) => {
            console.warn('Audio tag play note, falling back to Web Speech:', err);
            fallbackWebSpeech();
          });
      }
    } catch (e) {
      fallbackWebSpeech();
    }

    // 3. Web Speech API fallback
    function fallbackWebSpeech() {
      if (audioPlayed) return;
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const text = 'ဂုဏ်ယူပါတယ် မင်းသတ်မှတ်ထားသောအမြတ်ငွေကိုရရှိပါပြီ';
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'my-MM';
          utterance.pitch = 1.1;
          utterance.rate = 0.95;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const myVoice = voices.find(
            (v) => v.lang.startsWith('my') || v.name.toLowerCase().includes('myanmar') || v.name.toLowerCase().includes('burmese')
          );
          if (myVoice) {
            utterance.voice = myVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      } catch (err) {
        console.warn('Web speech fallback note:', err);
        resolve();
      }
    }
  });
}

// Authentic Casino Slot Machine Scatter Symbol Teaser / Alarm Sound
// Plays exciting sparkling high-pitched arpeggio and resonant metallic bell chime
export function playSlotScatterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Bass Reel Thud Impact (The dramatic scatter drop)
  try {
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(140, now);
    bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    bassGain.gain.setValueAtTime(0.35, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.35);
  } catch {}

  // 2. Sparkling High Arpeggio (Scatter tease sequence: 7 rising bell notes)
  const scatterNotes = [880.00, 1108.73, 1318.51, 1760.00, 2217.46, 2637.02, 3520.00];
  scatterNotes.forEach((freq, idx) => {
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const noteTime = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    } catch {}
  });

  // 3. Shimmering Metallic Bell Clang (Signature Scatter Clang Ring)
  try {
    const bellTime = now + 0.32;
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2793.83, bellTime); // F7 metallic chime
    bellGain.gain.setValueAtTime(0.28, bellTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 0.7);

    // Harmonic overtone for metallic sparkle
    const harmOsc = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(4186.01, bellTime); // C8 sparkle
    harmGain.gain.setValueAtTime(0.18, bellTime);
    harmGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 0.5);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    harmOsc.connect(harmGain);
    harmGain.connect(ctx.destination);

    bellOsc.start(bellTime);
    bellOsc.stop(bellTime + 0.7);
    harmOsc.start(bellTime);
    harmOsc.stop(bellTime + 0.5);
  } catch {}

  // 4. Secondary Teaser Echo (The 2nd scatter resonance at +0.45s)
  scatterNotes.slice(3).forEach((freq, idx) => {
    if (!ctx) return;
    try {
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      echoOsc.type = 'sine';
      const echoTime = now + 0.45 + idx * 0.05;
      echoOsc.frequency.setValueAtTime(freq * 1.05, echoTime);

      echoGain.gain.setValueAtTime(0.16, echoTime);
      echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.3);

      echoOsc.connect(echoGain);
      echoGain.connect(ctx.destination);

      echoOsc.start(echoTime);
      echoOsc.stop(echoTime + 0.3);
    } catch {}
  });
}

// Sniper Target Lock & Strike Siren Sound
export function playSniperStrikeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  try {
    // 2-tone futuristic laser lock chirp
    [520, 1040, 1560].forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {}
}

// User requested Alarm Sound: "I found 3 lose method"
// Plays alert chime + native audio stream / Web Speech API saying: "I found 3 lose method"
export function playFound3LoseMethodVoice(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx) {
    // Sharp radar alert chime
    const now = ctx.currentTime;
    [660, 990, 1320].forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = now + idx * 0.1;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } catch {}
    });
  }

  return new Promise((resolve) => {
    let audioPlayed = false;

    // 1. Play audio stream from /api/audio/found-3-lose-method
    try {
      const audio = new Audio('/api/audio/found-3-lose-method');
      audio.volume = 1.0;
      audio.onended = () => resolve();
      audio.onerror = () => fallbackSpeech();

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audioPlayed = true;
        }).catch(() => fallbackSpeech());
      }
    } catch {
      fallbackSpeech();
    }

    // 2. Immediate Web Speech fallback if audio tag is blocked or unavailable
    function fallbackSpeech() {
      if (audioPlayed) return;
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('I found 3 lose method');
          utterance.lang = 'en-US';
          utterance.pitch = 1.05;
          utterance.rate = 1.0;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(
            (v) => v.lang.startsWith('en') || v.name.toLowerCase().includes('english')
          );
          if (enVoice) {
            utterance.voice = enVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      } catch {
        resolve();
      }
    }
  });
}

// User requested Alarm Sound: "HEY! NOW I AM START BETTING"
// Triggered as soon as START BET ACTIVE is reached when a method hits 4 consecutive losses.
export function playStartBettingVoice(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx) {
    // Sharp high-voltage sci-fi alarm & laser pulse
    const now = ctx.currentTime;
    [587.33, 880.00, 1174.66, 1760.00].forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.12);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } catch {}
    });
  }

  return new Promise((resolve) => {
    let audioPlayed = false;

    // 1. Play audio stream from /api/audio/start-betting
    try {
      const audio = new Audio('/api/audio/start-betting');
      audio.volume = 1.0;
      audio.onended = () => resolve();
      audio.onerror = () => fallbackSpeech();

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audioPlayed = true;
        }).catch(() => fallbackSpeech());
      }
    } catch {
      fallbackSpeech();
    }

    // 2. Web Speech API fallback
    function fallbackSpeech() {
      if (audioPlayed) return;
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Hey! Now I am start betting');
          utterance.lang = 'en-US';
          utterance.pitch = 1.15;
          utterance.rate = 1.05;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(
            (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Alex'))
          ) || voices.find((v) => v.lang.startsWith('en'));

          if (enVoice) {
            utterance.voice = enVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      } catch {
        resolve();
      }
    }
  });
}

