import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AMDF } from 'pitchfinder';
import MusicSheet from '../components/MusicSheet';
import PianoKeyboard, { NOTES, NOTE_TO_FREQUENCY } from '../components/PianoKeyboard';
import { Play, Square, Timer, Trophy, Mic, MicOff, Smartphone, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';

const getClosestNote = (freq) => {
    let closest = null;
    let minDiff = Infinity;
    Object.keys(NOTE_TO_FREQUENCY).forEach(f => {
        const diff = Math.abs(NOTE_TO_FREQUENCY[f] - freq);
        if (diff < minDiff) {
            minDiff = diff;
            closest = f;
        }
    });
    return minDiff < 10 ? closest : null;
};

const Practice = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentNotes, setCurrentNotes] = useState([]);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [duration, setDuration] = useState(0);
    const [lastNoteTime, setLastNoteTime] = useState(0);
    const [isMicOn, setIsMicOn] = useState(false);
    const [detectedNote, setDetectedNote] = useState(null);
    const [feedback, setFeedback] = useState(null); 
    const [showSummary, setShowSummary] = useState(false);
    
    // Remote Keyboard states
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
    const [showQR, setShowQR] = useState(false);
    const [manualIp, setManualIp] = useState(window.location.hostname === 'localhost' ? '' : window.location.hostname);
    
    // Range and Options settings
    const [rangeStart, setRangeStart] = useState('F2');
    const [rangeEnd, setRangeEnd] = useState('B5');
    const [includeSemitones, setIncludeSemitones] = useState(false);
    const [noteCount, setNoteCount] = useState(1);
    const [showKeyNames, setShowKeyNames] = useState(true);
    const [isFixedScore, setIsFixedScore] = useState(false);
    const [scoreTitle, setScoreTitle] = useState(null);

    const timerRef = useRef();
    const pollRef = useRef();
    const audioContextRef = useRef();
    const analyserRef = useRef();
    const streamRef = useRef();
    const requestRef = useRef();
    const handleNoteInputRef = useRef();
    const synthRef = useRef();
    const [isAudioReady, setIsAudioReady] = useState(false);

    useEffect(() => {
        // Inisialisasi sampler dengan suara piano asli (Salamander Grand Piano)
        synthRef.current = new Tone.Sampler({
            urls: {
                A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
                A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
                A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
                A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
                A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
                A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
                A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
                A7: "A7.mp3", C8: "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => {
                setIsAudioReady(true);
            }
        }).toDestination();

        return () => {
            if (synthRef.current) synthRef.current.dispose();
        };
    }, []);

    const playNote = (note) => {
        if (!synthRef.current || !isAudioReady) return;
        
        try {
            Tone.start();
            synthRef.current.triggerAttackRelease(note, "2n");
        } catch (err) {
            console.error("Playback error:", err);
        }
    };

    const handleNoteInput = (note, isSilent = false) => {
        if (!isSilent) playNote(note); 
        if (!isPlaying || currentNotes.length === 0) return;

        const targetNote = currentNotes[currentNoteIndex];

        if (note === targetNote) {
            setScore(s => s + 1);
            
            if (currentNoteIndex === currentNotes.length - 1) {
                setFeedback('correct');
                confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } });
                
                if (isFixedScore) {
                    setIsPlaying(false);
                    setShowSummary(true);
                    saveSession();
                } else {
                    setTimeout(() => {
                        setFeedback(null);
                        generateNewNotes();
                    }, 500);
                }
            } else {
                setCurrentNoteIndex(idx => idx + 1);
                setLastNoteTime(Date.now());
            }
        } else {
            setScore(s => Math.max(0, s - 1));
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 500);
        }
    };

    // Update the ref to always point to the latest handleNoteInput closure
    useEffect(() => {
        handleNoteInputRef.current = handleNoteInput;
    });

    useEffect(() => {
        // Polling for remote events
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/api/remote/poll/${sessionId}`);
                if (res.data.events && res.data.events.length > 0) {
                    res.data.events.forEach(event => {
                        // Call the latest version of the handler through the ref
                        if (handleNoteInputRef.current) {
                            handleNoteInputRef.current(event.note);
                        }
                    });
                }
            } catch (err) {
                // Silently fail polling
            }
        }, 300); // Poll every 300ms
        
        return () => clearInterval(pollRef.current);
    }, [sessionId]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const scoreId = params.get('scoreId');
        if (scoreId) {
            const fetchScore = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`/api/scores/${scoreId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.notes) {
                        setCurrentNotes(res.data.notes);
                        setIsFixedScore(true);
                        setScoreTitle(res.data.title);
                    }
                } catch (err) {
                    console.error('Failed to fetch score');
                }
            };
            fetchScore();
        }
    }, []);

    const handleStart = () => {
        setScore(0);
        setDuration(0);
        setCurrentNoteIndex(0);
        setFeedback(null);
        setShowSummary(false);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
            
            if (!isFixedScore) {
                generateNewNotes();
            }
        } else {
            clearInterval(timerRef.current);
            stopMicrophone();
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying]);

    // Auto-stop after 2 minutes (120 seconds)
    useEffect(() => {
        if (isPlaying && duration >= 120) {
            handleStop();
        }
    }, [duration, isPlaying]);

    const generateNewNotes = () => {
        const startIndex = NOTES.findIndex(n => n.name === rangeStart);
        const endIndex = NOTES.findIndex(n => n.name === rangeEnd);
        
        let pool = NOTES.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
        
        if (!includeSemitones) {
            pool = pool.filter(n => !n.name.includes('#'));
        }

        if (pool.length === 0) pool = [NOTES[0]];

        const newNotes = [];
        for (let i = 0; i < noteCount; i++) {
            newNotes.push(pool[Math.floor(Math.random() * pool.length)].name);
        }
        
        setCurrentNotes(newNotes);
        setCurrentNoteIndex(0);
        setLastNoteTime(Date.now());
    };

    const startMicrophone = async () => {
        if (!window.isSecureContext) {
            alert('Akses mikrofon hanya diizinkan di lingkungan aman (HTTPS atau localhost). Silakan gunakan HTTPS jika mengakses via IP.');
            return;
        }

        try {
            await Tone.start();
            audioContextRef.current = Tone.getContext().rawContext;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Browser Anda tidak mendukung akses media (getUserMedia).');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            const detectPitch = AMDF({ sampleRate: audioContextRef.current.sampleRate });
            const buffer = new Float32Array(analyser.fftSize);
            let lastDetectedNote = null;
            let detectionCount = 0;

            const update = () => {
                analyser.getFloatTimeDomainData(buffer);
                
                // Hitung volume (RMS) untuk memastikan suara cukup keras
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) {
                    sum += buffer[i] * buffer[i];
                }
                const rms = Math.sqrt(sum / buffer.length);
                
                // Hanya deteksi jika volume > 0.01 (abaikan kebisingan kecil)
                if (rms > 0.01) {
                    const pitch = detectPitch(buffer);
                    if (pitch) {
                        const note = getClosestNote(pitch);
                        if (note) {
                            setDetectedNote(note); // Visualisasi real-time
                            // Cek konsistensi: harus terdeteksi 3x berturut-turut
                            if (note === lastDetectedNote) {
                                detectionCount++;
                                if (detectionCount === 3 && handleNoteInputRef.current) {
                                    handleNoteInputRef.current(note, true);
                                    detectionCount = 0; // Reset setelah berhasil
                                }
                            } else {
                                lastDetectedNote = note;
                                detectionCount = 1;
                            }
                        } else {
                            setDetectedNote(null);
                        }
                    } else {
                        setDetectedNote(null);
                    }
                } else {
                    setDetectedNote(null);
                }
                
                requestRef.current = requestAnimationFrame(update);
            };
            update();
            setIsMicOn(true);
        } catch (err) {
            console.error('Microphone error:', err);
            if (err.name === 'NotAllowedError') {
                alert('Izin mikrofon ditolak. Silakan aktifkan di pengaturan browser.');
            } else if (err.name === 'NotFoundError') {
                alert('Mikrofon tidak ditemukan.');
            } else {
                alert('Gagal mengakses mikrofon: ' + err.message);
            }
        }
    };

    const stopMicrophone = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        setIsMicOn(false);
    };

    const handleStop = async () => {
        setIsPlaying(false);
        setShowSummary(true);
        try {
            await axios.post('/api/sessions', 
                { duration, score },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
        } catch (err) {
            console.error('Failed to save session');
        }
    };

    const effectiveIp = manualIp || window.location.hostname;
    const portSuffix = window.location.port ? `:${window.location.port}` : '';
    const remoteUrl = `${window.location.protocol}//${effectiveIp}${portSuffix}/remote-keyboard?sessionId=${sessionId}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}&showKeyNames=${showKeyNames}`;

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8">
            <div className="glass p-4 flex flex-wrap gap-6 items-center justify-center">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted uppercase font-bold">Start Note</label>
                    <select 
                        value={rangeStart} 
                        onChange={(e) => setRangeStart(e.target.value)}
                        disabled={isPlaying}
                        className="bg-black/20 text-var(--color-text-main) p-2 rounded-md focus:ring-2 ring-primary outline-none"
                    >
                        {NOTES.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted uppercase font-bold">End Note</label>
                    <select 
                        value={rangeEnd} 
                        onChange={(e) => setRangeEnd(e.target.value)}
                        disabled={isPlaying}
                        className="bg-black/20 text-var(--color-text-main) p-2 rounded-md focus:ring-2 ring-primary outline-none"
                    >
                        {NOTES.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted uppercase font-bold">Note Count</label>
                    <select 
                        value={noteCount} 
                        onChange={(e) => setNoteCount(Number(e.target.value))}
                        disabled={isPlaying}
                        className="bg-black/20 text-var(--color-text-main) p-2 rounded-md focus:ring-2 ring-primary outline-none"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} Notes</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <input 
                        type="checkbox" 
                        id="semitones" 
                        checked={includeSemitones} 
                        onChange={(e) => setIncludeSemitones(e.target.checked)}
                        disabled={isPlaying}
                        className="w-5 h-5 accent-primary"
                    />
                    <label htmlFor="semitones" className="text-sm font-semibold select-none">Include Semitones (#)</label>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="glass p-6 flex flex-col items-center gap-2">
                    <Trophy className="text-yellow-400" size={32} />
                    <span className="text-text-muted text-sm uppercase tracking-wider">Score</span>
                    <span className="text-4xl font-bold text-text-main">{score}</span>
                </div>
                <div className="glass p-6 flex flex-col items-center gap-2">
                    <Timer className="text-primary" size={32} />
                    <span className="text-text-muted text-sm uppercase tracking-wider">Duration</span>
                    <span className="text-4xl font-bold text-text-main">
                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="glass p-6 flex flex-col items-center justify-center gap-4">
                    {!isPlaying ? (
                        <button onClick={handleStart} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-xl">
                            <Play fill="white" /> {showSummary ? 'Try Again' : 'Start'}
                        </button>
                    ) : (
                        <button onClick={handleStop} className="bg-red-500 hover:bg-red-600 text-white w-full flex items-center justify-center gap-2 py-4 text-xl rounded-lg">
                            <Square fill="white" /> Stop
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-xl font-semibold">Music Sheet</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowQR(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/30 transition-all text-sm font-medium"
                        >
                            <Smartphone size={16} /> Open Mobile Keyboard
                        </button>
                        <button 
                            onClick={isMicOn ? stopMicrophone : startMicrophone}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${isMicOn ? 'bg-primary/20 border-primary text-primary' : 'bg-black/10 border-black/20 text-text-muted'}`}
                        >
                            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                            {isMicOn ? 'Listening...' : 'Real Piano Off'}
                        </button>
                    </div>
                </div>
                
                <div className={`relative transition-all duration-300 min-h-[300px] bg-[#fefbe8] rounded-3xl shadow-xl border-4 border-white overflow-hidden ${feedback === 'correct' ? 'scale-[1.02]' : feedback === 'wrong' ? 'shake' : ''}`}>
                    {isPlaying ? (
                        <div style={{ 
                            position: 'absolute',
                            left: '60%',
                            top: '55%',
                            transform: 'translate(-50%, -50%)',
                            width: '480px',
                            maxWidth: '95%'
                        }}>
                            <MusicSheet 
                                notes={currentNotes} 
                                currentIndex={currentNoteIndex} 
                                playedUpTo={isPlaying ? currentNoteIndex - 1 : -1} 
                                showTimeSignature={false}
                                showClef={true}
                                showBrace={true}
                                showRest={false}
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-black/40 animate-pulse py-8">
                            <Play size={64} fill="currentColor" className="opacity-10" />
                            <p className="text-2xl font-bold tracking-tight">Please, click button Start</p>
                            <p className="text-sm font-medium">Pilih jangkauan nada di atas lalu tekan Start untuk mulai latihan</p>
                        </div>
                    )}
                    
                    {feedback === 'correct' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-success/15 backdrop-blur-[1px] text-success font-black text-3xl z-[60]">
                            CORRECT!
                        </div>
                    )}
                    {feedback === 'wrong' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-error/15 backdrop-blur-[1px] text-error font-black text-3xl z-[60] pointer-events-none">
                            WRONG
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 relative w-[95vw] left-1/2 -translate-x-1/2">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-xl font-semibold">Virtual Keyboard</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showKeyNames"
                            checked={showKeyNames}
                            onChange={(e) => setShowKeyNames(e.target.checked)}
                            className="w-4 h-4 accent-primary"
                        />
                        <label htmlFor="showKeyNames" className="text-sm font-medium text-text-muted select-none cursor-pointer">Show Key Names</label>
                    </div>
                </div>
                <PianoKeyboard 
                    onKeyPress={handleNoteInput} 
                    lastPlayedNote={currentNotes.length > 0 && feedback === 'correct' ? currentNotes[currentNoteIndex] : null} 
                    detectedNote={detectedNote}
                    rangeStart={rangeStart} 
                    rangeEnd={rangeEnd} 
                    showKeyNames={showKeyNames}
                    showOctaves={showKeyNames}
                />
            </div>

            {/* Modal QR Code */}
            {/* Modal QR Code */}
            <AnimatePresence>
                {showQR && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="glass p-8 max-sm w-full flex flex-col items-center gap-4 relative"
                        >
                            <button 
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
                            >
                                <X size={24} />
                            </button>
                            
                            <div className="bg-primary/20 p-3 rounded-full">
                                <Smartphone size={24} className="text-primary" />
                            </div>
                            
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Mobile Keyboard</h2>
                                <p className="text-text-muted text-xs mt-1">Gunakan HP Anda sebagai keyboard piano lewat internet!</p>
                            </div>

                            {window.location.hostname === 'localhost' && (
                                <div className="w-full flex flex-col gap-1">
                                    <label className="text-[10px] text-text-muted uppercase font-bold px-1">Computer IP Address (Local WiFi)</label>
                                    <input 
                                        type="text"
                                        placeholder="Contoh: 10.27.58.52"
                                        value={manualIp}
                                        onChange={(e) => setManualIp(e.target.value)}
                                        className="bg-black/20 text-text-main p-2 rounded-lg text-sm focus:ring-2 ring-primary outline-none text-center"
                                    />
                                    <p className="text-[9px] text-text-muted italic px-1">Abaikan jika menggunakan ngrok.</p>
                                </div>
                            )}

                            {effectiveIp && effectiveIp !== 'localhost' ? (
                                <>
                                    <div className="bg-white p-3 rounded-xl shadow-xl">
                                        <QRCodeCanvas value={remoteUrl} size={180} level="H" />
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg w-full text-center overflow-hidden">
                                        <code className="text-[10px] break-all text-text-muted">{remoteUrl}</code>
                                    </div>
                                    <p className="text-[10px] text-text-muted italic text-center">Scan QR ini di HP Anda. Mendukung koneksi internet/ngrok.</p>
                                </>
                            ) : (
                                <div className="p-8 text-center text-error bg-error/10 rounded-xl border border-error/20">
                                    <p className="text-sm font-bold">Domain/IP Belum Terdeteksi</p>
                                    <p className="text-[10px] mt-1">Silakan buka lewat ngrok atau masukkan IP lokal di atas.</p>
                                </div>
                            )}

                            <button onClick={() => setShowQR(false)} className="btn-primary w-full py-2">Tutup</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSummary && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="glass p-8 max-w-sm w-full flex flex-col items-center gap-6 text-center"
                        >
                            <div className="bg-yellow-400 p-4 rounded-full shadow-lg shadow-yellow-400/20">
                                <Trophy size={48} className="text-white" />
                            </div>
                            
                            <div>
                                <h2 className="text-3xl font-bold">Session Complete!</h2>
                                <p className="text-text-muted mt-2">Amazing progress today!</p>
                            </div>

                            <div className="flex gap-8 w-full border-y border-white/10 py-6">
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-xs text-text-muted uppercase font-bold">Final Score</span>
                                    <span className="text-3xl font-bold text-primary">{score}</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-xs text-text-muted uppercase font-bold">Duration</span>
                                    <span className="text-3xl font-bold text-primary">
                                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                            
                            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
                                Ok
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
};

export default Practice;
