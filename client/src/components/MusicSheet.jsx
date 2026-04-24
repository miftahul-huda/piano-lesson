import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector, GhostNote } from 'vexflow';
import { motion, AnimatePresence } from 'framer-motion';

const NoteShatter = ({ x, y }) => {
    const particles = Array.from({ length: 12 });
    return (
        <div className="absolute pointer-events-none z-50" style={{ left: x, top: y }}>
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                        x: (Math.random() - 0.5) * 120,
                        y: (Math.random() - 0.5) * 120,
                        opacity: 0,
                        scale: 0
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute w-2 h-2 bg-success rounded-full shadow-md"
                />
            ))}
        </div>
    );
};

const MusicSheet = ({ notes = [], currentIndex = 0 }) => {
    const containerRef = useRef();
    const [shatters, setShatters] = useState([]);
    const prevIndexRef = useRef(currentIndex);
    const lastBatchRef = useRef("");
    const notePositionsRef = useRef([]);

    // 1. Render Dasar VexFlow
    useEffect(() => {
        const batchKey = notes.join(',');
        if (batchKey === lastBatchRef.current) return;
        lastBatchRef.current = batchKey;

        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        const staveWidth = Math.max(240, notes.length * 65 + 100);
        renderer.resize(staveWidth + 80, 200);
        const context = renderer.getContext();

        context.setStrokeStyle('#94a3b8');
        context.setFillStyle('#94a3b8');

        const staveTreble = new Stave(40, 10, staveWidth);
        staveTreble.addClef('treble').addTimeSignature('4/4').setContext(context).draw();

        const staveBass = new Stave(40, 90, staveWidth);
        staveBass.addClef('bass').addTimeSignature('4/4').setContext(context).draw();

        new StaveConnector(staveTreble, staveBass).setType(StaveConnector.type.BRACE).setContext(context).draw();

        const localPositions = [];
        const trebleTickables = [];
        const bassTickables = [];

        notes.forEach((noteStr, idx) => {
            const hasAccidental = noteStr.includes('#');
            const noteName = noteStr.charAt(0).toLowerCase();
            const octave = parseInt(hasAccidental ? noteStr.charAt(2) : noteStr.charAt(1), 10);
            const isBass = octave <= 3;

            const vfNote = new StaveNote({
                clef: isBass ? 'bass' : 'treble',
                keys: [`${noteName}${hasAccidental ? '#' : ''}/${octave}`],
                duration: 'q'
            });

            if (hasAccidental) vfNote.addModifier(new Accidental('#'), 0);
            vfNote.setAttribute('id', `vf-note-${idx}`);
            //vfNote.setStyle({ fillStyle: '#0f172a', strokeStyle: '#0f172a' });
            vfNote.setStyle({ fillStyle: '#999', strokeStyle: '#999' });


            if (isBass) {
                bassTickables.push(vfNote);
                trebleTickables.push(new GhostNote({ duration: 'q' }));
            } else {
                trebleTickables.push(vfNote);
                bassTickables.push(new GhostNote({ duration: 'q' }));
            }
            localPositions.push({ note: vfNote, isBass, stave: isBass ? staveBass : staveTreble });
        });

        const formatter = new Formatter();
        const voiceTreble = new Voice({ num_beats: notes.length, beat_value: 4 }).setStrict(false).addTickables(trebleTickables);
        const voiceBass = new Voice({ num_beats: notes.length, beat_value: 4 }).setStrict(false).addTickables(bassTickables);
        formatter.joinVoices([voiceTreble, voiceBass]).format([voiceTreble, voiceBass], staveWidth - 50);

        voiceTreble.draw(context, staveTreble);
        voiceBass.draw(context, staveBass);

        notePositionsRef.current = localPositions;
        prevIndexRef.current = 0;
    }, [notes]);

    // 2. Logic Update Warna & Animasi (Fading Bulatan)
    useEffect(() => {
        if (!containerRef.current) return;

        notes.forEach((_, idx) => {
            const noteEl = document.getElementById(`vf-note-${idx}`);
            if (!noteEl) return;

            const noteHead = noteEl.querySelector('.vf-notehead');
            const noteHeadPaths = noteHead ? noteHead.querySelectorAll('path, text') : [];
            const stemPaths = noteEl.querySelectorAll('.vf-stem path');

            stemPaths.forEach(p => {
                // p.style.fill = '#0f172a';
                // p.style.stroke = '#0f172a';

                p.style.fill = '#777';
                p.style.stroke = '#777';
            });

            if (idx < currentIndex) {
                if (noteHead) {
                    noteHead.style.transition = 'all 0.8s ease-out';
                    noteHead.style.opacity = '0.1'; // Biarkan sedikit berbayang
                    noteHead.style.transform = 'translateY(-20px)';
                    noteHeadPaths.forEach(p => p.style.fill = '#10b981');
                }

                if (idx === currentIndex - 1 && idx !== prevIndexRef.current - 1) {
                    const data = notePositionsRef.current[idx];
                    if (data && data.note.getMetrics) {
                        const metrics = data.note.getMetrics();
                        const line = data.note.getKeyProps()[0].line;
                        const headY = data.stave.getYForLine(line);
                        const id = Date.now();
                        setShatters(prev => [...prev, { id, x: metrics.x + 40 + 7, y: headY }]);
                        setTimeout(() => setShatters(prev => prev.filter(s => s.id !== id)), 600);
                    }
                }
            } else if (idx === currentIndex) {
                noteHeadPaths.forEach(p => {
                    p.style.fill = '#3b82f6';
                    p.style.stroke = '#3b82f6';
                });
                if (noteHead) {
                    noteHead.style.opacity = '1';
                    noteHead.style.transform = 'translateY(0)';
                }
            } else {
                noteHeadPaths.forEach(p => {
                    p.style.fill = '#777';
                    p.style.stroke = '#777';
                });
                if (noteHead) {
                    noteHead.style.opacity = '1';
                    noteHead.style.transform = 'translateY(0)';
                }
            }
        });

        prevIndexRef.current = currentIndex;
    }, [currentIndex, notes]);

    return (
        <div className="relative w-full flex justify-center py-4">
            <div ref={containerRef}></div>
            <div className="absolute inset-0 pointer-events-none overflow-visible">
                <AnimatePresence>
                    {shatters.map(s => (
                        <NoteShatter key={s.id} x={s.x} y={s.y} />
                    ))}
                </AnimatePresence>
            </div>
            <style>{`
                .vf-notehead {
                    transition: all 0.3s ease;
                    transform-origin: center;
                }
 
                svg {
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default MusicSheet;
