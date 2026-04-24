import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { generateMusicXML, SAMPLE_NOTES } from '../utils/musicXmlGenerator';
import { motion, AnimatePresence } from 'framer-motion';

const MusicSheet = ({ notes = [], currentIndex = 0 }) => {
    const containerRef = useRef();
    const osmdRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const prevIndexRef = useRef(currentIndex);

    // 1. Initialize and Load OSMD
    useEffect(() => {
        if (!containerRef.current) return;
        
        // Clean up previous instance
        containerRef.current.innerHTML = '';
        
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
            autoResize: true,
            drawPartNames: false,
            drawTitle: false,
            drawSubtitle: false,
            drawComposer: false,
            drawLyricist: false,
            drawMetronomeMarks: false,
            renderBackend: 'svg',
            coloringMode: 0,
            colorNotes: false,
            defaultColorNotehead: '#000000',
            defaultColorRest: '#000000',
            defaultColorStem: '#000000',
            defaultColorLabel: '#000000',
            defaultColorTitle: '#000000',
            drawingParameters: 'compact',
            fillParentWidth: false, // JANGAN paksa lebar penuh agar bisa di-center
        });

        osmdRef.current = osmd;

        // Use SAMPLE_NOTES if no notes provided to demonstrate capabilities
        const notesToRender = notes.length > 0 ? notes : SAMPLE_NOTES;
        const xml = generateMusicXML(notesToRender, "Piano Practice");
        
        osmd.load(xml).then(() => {
            // Berikan sedikit margin agar tidak "dempet" tapi tetap bisa di-center
            osmd.EngravingRules.PageLeftMargin = 5;
            osmd.EngravingRules.PageRightMargin = 5;
            osmd.EngravingRules.PageTopMargin = 5;
            osmd.EngravingRules.PageBottomMargin = 5;
            osmd.EngravingRules.RenderSingleHorizontalStaffline = false;
            
            // Gunakan requestAnimationFrame untuk memastikan browser sudah menghitung layout
            requestAnimationFrame(() => {
                if (containerRef.current && containerRef.current.offsetWidth > 0) {
                    osmd.render();
                    osmd.cursor.show();
                    osmd.cursor.reset();
                    setIsLoaded(true);
                } else {
                    const checkWidth = setInterval(() => {
                        if (containerRef.current && containerRef.current.offsetWidth > 0) {
                            osmd.render();
                            osmd.cursor.show();
                            osmd.cursor.reset();
                            setIsLoaded(true);
                            clearInterval(checkWidth);
                        }
                    }, 100);
                }
            });
        }).catch(err => {
            console.error("OSMD Load Error:", err);
        });

        return () => {
            osmdRef.current = null;
        };
    }, [notes]);

    // 2. Sync Cursor with currentIndex
    useEffect(() => {
        if (!osmdRef.current || !isLoaded) return;

        const osmd = osmdRef.current;
        if (!osmd.cursor) return; // Tambahkan safety check
        
        // Reset or Move Cursor
        if (currentIndex === 0) {
            osmd.cursor.reset();
        } else if (currentIndex > prevIndexRef.current) {
            // Move forward
            const diff = currentIndex - prevIndexRef.current;
            for (let i = 0; i < diff; i++) {
                osmd.cursor.next();
            }
        } else if (currentIndex < prevIndexRef.current) {
            // If jumped back, easier to reset and move forward
            osmd.cursor.reset();
            for (let i = 0; i < currentIndex; i++) {
                osmd.cursor.next();
            }
        }

        prevIndexRef.current = currentIndex;
    }, [currentIndex, isLoaded]);

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
                style={{ 
                    filter: 'contrast(1.1) brightness(1.0)',
                    backgroundColor: 'transparent'
                }}
            ></div>

            <style>{`
                /* Cursor styling */
                .osmdCursor {
                    opacity: 0.35 !important;
                    background-color: #10b981 !important;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default MusicSheet;
