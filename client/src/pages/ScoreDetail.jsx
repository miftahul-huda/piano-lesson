import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AMDF } from 'pitchfinder';
import MusicSheet from '../components/MusicSheet';
import PianoKeyboard, { NOTE_TO_FREQUENCY } from '../components/PianoKeyboard';
import { Mic, MicOff, ChevronLeft, Play, Square, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import { SAMPLE_NOTES } from '../utils/musicXmlGenerator';

const ScoreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [score, setScore] = useState(null);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [isMicOn, setIsMicOn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [detectedNote, setDetectedNote] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    const audioContextRef = useRef();
    const analyserRef = useRef();
    const streamRef = useRef();
    const requestRef = useRef();
    const handleNoteInputRef = useRef();
    const synthRef = useRef();

    useEffect(() => {
        // Inisialisasi sampler dengan suara piano asli (Salamander Grand Piano)
        synthRef.current = new Tone.Sampler({
            urls: {
                A0: "A0.mp3",
                C1: "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                A1: "A1.mp3",
                C2: "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                A2: "A2.mp3",
                C3: "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                A3: "A3.mp3",
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
                C5: "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                A5: "A5.mp3",
                C6: "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                A6: "A6.mp3",
                C7: "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                A7: "A7.mp3",
                C8: "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => {
                setIsAudioReady(true);
            }
        }).toDestination();

        return () => {
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
            if (synthRef.current) synthRef.current.dispose();
        };
    }, []);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/scores/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setScore(res.data);
            } catch (err) {
                console.error('Failed to fetch score', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    navigate('/collection');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchScore();
    }, [id, navigate]);

    const playNote = (note) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const freq = NOTE_TO_FREQUENCY[note];
        if (!freq) return;

        const now = audioContextRef.current.currentTime;
        const masterGain = audioContextRef.current.createGain();
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1);

        const osc = audioContextRef.current.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(masterGain);
        masterGain.connect(audioContextRef.current.destination);
        osc.start(now);
        osc.stop(now + 1);
    };

    const handleNoteInput = (note, isSilent = false) => {
        if (!isSilent) playNote(note);
        if (!isMicOn || !score || !score.notes) return;

        const targetNote = score.notes[currentNoteIndex];
        if (note === targetNote) {
            if (currentNoteIndex < score.notes.length - 1) {
                setCurrentNoteIndex(prev => prev + 1);
            } else {
                // Selesai!
                alert("Lagu selesai! Bagus sekali!");
            }
        }
    };

    const toggleAudioPlayback = async () => {
        if (isPlayingAudio) {
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
            setIsPlayingAudio(false);
            return;
        }

        await Tone.start();
        Tone.Transport.cancel(0);
        
        const synth = synthRef.current;
        if (!synth || !isAudioReady) return;
        
        const notesToPlay = (score?.notes && score.notes.length > 0) ? score.notes : SAMPLE_NOTES;

        const BPM = 120;
        const secondsPerBeat = 60 / BPM;
        Tone.Transport.bpm.value = BPM;

        // Duration in beats (quarter note = 1 beat)
        const durationBeats = {
            'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25
        };
        // Tone.js duration string
        const durationMap = {
            'whole': '1m', 'half': '2n', 'quarter': '4n', 'eighth': '8n', 'sixteenth': '16n'
        };

        let timeAccSeconds = 0;

        notesToPlay.forEach((entry, index) => {
            const isChord = Array.isArray(entry);
            const notes = isChord ? entry : [entry];
            
            const normalized = notes.map(n => {
                if (typeof n === 'string') return { note: n, duration: 'quarter', dotted: false };
                return { ...n, duration: n.duration || 'quarter', dotted: n.dotted || false };
            });

            const durName = normalized[0].duration;
            const dotted = normalized[0].dotted || false;
            const beats = (durationBeats[durName] || 1) * (dotted ? 1.5 : 1);
            const durationStr = (durationMap[durName] || '4n') + (dotted ? '.' : '');
            const pitches = normalized.map(n => n.note);
            const scheduleAt = timeAccSeconds;

            Tone.Transport.schedule((time) => {
                synth.triggerAttackRelease(pitches, durationStr, time);
                Tone.Draw.schedule(() => {
                    setCurrentNoteIndex(index);
                }, time);
            }, scheduleAt);

            timeAccSeconds += beats * secondsPerBeat;
        });

        // Use a setTimeout to stop after all notes finish (with 2s buffer for release tails)
        const totalDurationMs = (timeAccSeconds + 2.0) * 1000;
        setTimeout(() => {
            Tone.Transport.stop();
            setIsPlayingAudio(false);
            setCurrentNoteIndex(0);
        }, totalDurationMs);

        Tone.Transport.start();
        setIsPlayingAudio(true);
    };

    useEffect(() => {
        handleNoteInputRef.current = handleNoteInput;
    });

    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            audioContextRef.current = context;
            
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            const source = context.createMediaStreamSource(stream);
            source.connect(analyser);
            analyserRef.current = analyser;

            const detectPitch = AMDF({ sampleRate: context.sampleRate });
            const buffer = new Float32Array(analyser.fftSize);
            
            let detectionCount = 0;
            let lastNote = null;

            const update = () => {
                analyser.getFloatTimeDomainData(buffer);
                
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
                const rms = Math.sqrt(sum / buffer.length);

                if (rms > 0.01) {
                    const pitch = detectPitch(buffer);
                    if (pitch) {
                        const freq = pitch;
                        let closest = null;
                        let minDiff = Infinity;
                        
                        Object.entries(NOTE_TO_FREQUENCY).forEach(([name, f]) => {
                            const diff = Math.abs(f - freq);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closest = name;
                            }
                        });

                        if (closest) {
                            setDetectedNote(closest);
                            if (closest === lastNote) {
                                detectionCount++;
                            } else {
                                lastNote = closest;
                                detectionCount = 1;
                            }

                            if (detectionCount === 3 && handleNoteInputRef.current) {
                                handleNoteInputRef.current(closest, true);
                                detectionCount = 0;
                            }
                        }
                    }
                } else {
                    setDetectedNote(null);
                    lastNote = null;
                    detectionCount = 0;
                }
                requestRef.current = requestAnimationFrame(update);
            };

            update();
            setIsMicOn(true);
        } catch (err) {
            console.error('Error mic:', err);
        }
    };

    const stopMicrophone = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setIsMicOn(false);
        setDetectedNote(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-text-muted">Memuat skor...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 py-12 px-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => {
                        stopMicrophone();
                        navigate('/collection');
                    }}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-lg"
                >
                    <ChevronLeft size={24} />
                    Kembali ke Koleksi
                </button>
                <div className="flex gap-4">
                    <button 
                        onClick={toggleAudioPlayback}
                        disabled={!isAudioReady}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap min-w-[140px] 
                            ${!isAudioReady ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                              isPlayingAudio ? 'bg-error text-white shadow-md shadow-error/20' : 
                              'bg-secondary text-text-main shadow-md hover:scale-105 active:scale-95'}`}
                    >
                        {!isAudioReady ? <><Loader2 size={16} className="animate-spin"/> Memuat Suara...</> :
                         isPlayingAudio ? <><Square size={16} /> Stop Audio</> : <><Play size={16} /> Mainkan Audio</>}
                    </button>

                    <button 
                        onClick={() => isMicOn ? stopMicrophone() : startMicrophone()}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap min-w-[200px] ${isMicOn ? 'bg-error text-white shadow-md shadow-error/20' : 'bg-primary text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95'}`}
                    >
                        {isMicOn ? <><MicOff size={16} /> Stop Deteksi</> : <><Mic size={16} /> Mulai Deteksi Piano</>}
                    </button>
                </div>
            </div>

            <div className="glass p-8 flex flex-col gap-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-main">{score?.title}</h1>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <p className={`text-sm font-medium px-4 py-1 rounded-full transition-all ${isMicOn ? 'bg-success/20 text-success animate-pulse' : 'bg-black/20 text-text-muted'}`}>
                            {isMicOn ? (detectedNote ? `Mendengar: ${detectedNote}` : 'Mendengarkan piano...') : 'Mikrofon Mati'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 h-auto flex flex-col relative overflow-auto shadow-xl border border-gray-100">
                    <MusicSheet 
                        notes={score?.notes || []} 
                        currentIndex={currentNoteIndex} 
                        playingIndex={isPlayingAudio ? currentNoteIndex : -1}
                    />
                </div>
            </div>

            <div className="text-center text-text-muted italic">
                <p>Pastikan piano Anda berada di ruangan yang tenang untuk hasil deteksi terbaik.</p>
            </div>
        </div>
    );
};

export default ScoreDetail;
