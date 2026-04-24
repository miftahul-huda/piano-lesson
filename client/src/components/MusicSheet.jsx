import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { generateMusicXML, SAMPLE_NOTES } from '../utils/musicXmlGenerator';

const MusicSheet = ({ notes = [], currentIndex = 0, playingIndex = -1, playedUpTo = -1 }) => {
    const containerRef = useRef();
    const osmdRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const prevIndexRef = useRef(currentIndex);
    const prevPlayingIndexRef = useRef(-1);
    const notePositionsRef = useRef([]); // Array of Note[] at each cursor position

    // Build a list of Note arrays for each cursor position
    const buildNotePositions = (osmd) => {
        const positions = [];
        osmd.cursor.reset();
        while (!osmd.cursor.Iterator.EndReached) {
            const notesAtPos = osmd.cursor.NotesUnderCursor() || [];
            positions.push(notesAtPos.filter(n => !n.isRest()));
            osmd.cursor.next();
        }
        osmd.cursor.reset();
        notePositionsRef.current = positions;
    };

    const setNotesColor = (osmd, index, color) => {
        const positions = notePositionsRef.current;
        const notesAtPos = positions[index];
        if (notesAtPos && notesAtPos.length > 0) {
            notesAtPos.forEach(note => {
                note.NoteheadColor = color;
                note.StemColor = color;
            });
            return true;
        }
        return false;
    };

    // 1. Initialize and Load OSMD
    useEffect(() => {
        if (!containerRef.current) return;
        
        containerRef.current.innerHTML = '';
        setIsLoaded(false);
        prevPlayingIndexRef.current = -1;
        
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
            autoResize: true,
            drawPartNames: false,
            drawTitle: false,
            drawSubtitle: false,
            drawComposer: false,
            drawLyricist: false,
            drawMetronomeMarks: false,
            renderBackend: 'svg',
            coloringMode: 0,  // No auto-coloring
            defaultColorNotehead: '#000000',
            defaultColorRest: '#000000',
            defaultColorStem: '#000000',
            defaultColorLabel: '#000000',
            drawingParameters: 'compact',
            fillParentWidth: false,
            cursorsOptions: [{ type: 0, color: '#6366f1', alpha: 0.25, follow: true }]
        });

        osmdRef.current = osmd;

        const notesToRender = notes.length > 0 ? notes : SAMPLE_NOTES;
        const xml = generateMusicXML(notesToRender, "Piano Practice");
        
        osmd.load(xml).then(() => {
            osmd.EngravingRules.PageLeftMargin = 5;
            osmd.EngravingRules.PageRightMargin = 5;
            osmd.EngravingRules.PageTopMargin = 5;
            osmd.EngravingRules.PageBottomMargin = 5;
            osmd.EngravingRules.RenderSingleHorizontalStaffline = false;
            
            requestAnimationFrame(() => {
                const doRender = () => {
                    osmd.render();
                    buildNotePositions(osmd);
                    osmd.cursor.show();
                    osmd.cursor.reset();
                    setIsLoaded(true);
                };

                if (containerRef.current && containerRef.current.offsetWidth > 0) {
                    doRender();
                } else {
                    const checkWidth = setInterval(() => {
                        if (containerRef.current && containerRef.current.offsetWidth > 0) {
                            doRender();
                            clearInterval(checkWidth);
                        }
                    }, 100);
                }
            });
        }).catch(err => {
            console.error("OSMD Load Error:", err);
        });

        return () => { osmdRef.current = null; };
    }, [notes]);

    // 2. Color only the currently playing note; reset the previous one
    useEffect(() => {
        if (!osmdRef.current || !isLoaded) return;

        const osmd = osmdRef.current;
        let needsRender = false;

        // Reset previous note to black
        if (prevPlayingIndexRef.current >= 0) {
            if (setNotesColor(osmd, prevPlayingIndexRef.current, '#000000')) needsRender = true;
        }

        // Color current note blue, or reset all if stopped
        if (playingIndex >= 0) {
            if (setNotesColor(osmd, playingIndex, '#3b82f6')) needsRender = true;
        }

        if (needsRender) {
            osmd.render();
            osmd.cursor.show();
            osmd.cursor.reset();
            const targetPos = playingIndex >= 0 ? playingIndex : currentIndex;
            for (let i = 0; i < targetPos; i++) osmd.cursor.next();
        }

        prevPlayingIndexRef.current = playingIndex;
    }, [playingIndex, isLoaded]);

    // 2b. Cumulative coloring for Practice mode (all notes up to playedUpTo stay green)
    useEffect(() => {
        if (!osmdRef.current || !isLoaded) return;
        const osmd = osmdRef.current;
        const positions = notePositionsRef.current;
        let needsRender = false;

        // Reset all notes to black first, then color up to playedUpTo
        positions.forEach((notesAtPos) => {
            notesAtPos.forEach(note => { note.NoteheadColor = '#000000'; note.StemColor = '#000000'; });
        });

        if (playedUpTo >= 0) {
            for (let i = 0; i <= playedUpTo; i++) {
                const notesAtPos = positions[i];
                if (notesAtPos && notesAtPos.length > 0) {
                    notesAtPos.forEach(note => {
                        note.NoteheadColor = '#10b981'; // green
                        note.StemColor = '#10b981';
                    });
                    needsRender = true;
                }
            }
        } else {
            // Reset all to black if playedUpTo is -1
            needsRender = positions.some(pos => pos.length > 0);
        }

        if (needsRender) {
            osmd.render();
            osmd.cursor.show();
            osmd.cursor.reset();
            for (let i = 0; i < currentIndex; i++) osmd.cursor.next();
        }
    }, [playedUpTo, isLoaded]);

    // 3. Sync cursor with currentIndex (practice mode, not during playback)
    useEffect(() => {
        if (!osmdRef.current || !isLoaded || playingIndex >= 0) return;

        const osmd = osmdRef.current;
        if (!osmd.cursor) return;
        
        if (currentIndex === 0) {
            osmd.cursor.reset();
        } else if (currentIndex > prevIndexRef.current) {
            const diff = currentIndex - prevIndexRef.current;
            for (let i = 0; i < diff; i++) osmd.cursor.next();
        } else if (currentIndex < prevIndexRef.current) {
            osmd.cursor.reset();
            for (let i = 0; i < currentIndex; i++) osmd.cursor.next();
        }

        prevIndexRef.current = currentIndex;
    }, [currentIndex, isLoaded, playingIndex]);

    return (
        <div className="relative w-full py-4 min-h-[300px] flex items-center justify-center">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm z-10 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-text-muted font-medium">Menyusun Notasi...</p>
                    </div>
                </div>
            )}
            <div 
                ref={containerRef} 
                className={`w-full flex flex-col items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundColor: 'transparent' }}
            ></div>

            <style>{`
                .osmdCursor {
                    opacity: 0.25 !important;
                    background-color: #6366f1 !important;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default MusicSheet;
