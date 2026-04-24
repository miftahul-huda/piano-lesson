import React from 'react';

const generateNotesAndFreqs = () => {
    const notes = [];
    const freqs = {};
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let keyNumber = 1;
    const addNote = (name, hasSharp) => {
        notes.push({ name, type: hasSharp ? 'black' : 'white' });
        freqs[name] = Number((440 * Math.pow(2, (keyNumber - 49) / 12)).toFixed(2));
        keyNumber++;
    };
    
    addNote('A0', false);
    addNote('A#0', true);
    addNote('B0', false);
    
    for (let octave = 1; octave <= 7; octave++) {
        noteNames.forEach(n => addNote(`${n}${octave}`, n.includes('#')));
    }
    addNote('C8', false);
    
    return { notes, freqs };
};

const { notes: NOTES, freqs: NOTE_TO_FREQUENCY } = generateNotesAndFreqs();

const PianoKeyboard = ({ onKeyPress, lastPlayedNote, detectedNote, rangeStart, rangeEnd, showKeyNames = true, showOctaves = true }) => {
    let displayNotes = NOTES;
    if (rangeStart && rangeEnd) {
        let startIndex = NOTES.findIndex(n => n.name === rangeStart);
        let endIndex = NOTES.findIndex(n => n.name === rangeEnd);
        if (startIndex > endIndex) {
            const temp = startIndex;
            startIndex = endIndex;
            endIndex = temp;
        }
        displayNotes = NOTES.slice(startIndex, endIndex + 1);
    }

    const whiteNotesCount = displayNotes.filter(n => n.type === 'white').length;
    // Tuts hitam biasanya ~65% lebar tuts putih
    const whiteKeyWidthPercent = 100 / whiteNotesCount;
    const blackKeyWidthPercent = whiteKeyWidthPercent * 0.65;

    return (
        <div className="flex justify-center relative select-none mt-8 h-52 w-full px-4 glass !rounded-2xl pt-6 shadow-sm overflow-hidden">
            <div className="flex relative w-full h-full">
            {displayNotes.map((note, index) => {
                const isBlack = note.type === 'black';
                const isActive = lastPlayedNote === note.name;
                const isDetected = detectedNote === note.name;
                const isMiddleC = note.name === 'C4';
                
                return (
                    <div
                        key={note.name}
                        onClick={() => onKeyPress(note.name)}
                        style={{ 
                            width: isBlack ? `${blackKeyWidthPercent}%` : `${whiteKeyWidthPercent}%`,
                            marginLeft: isBlack ? `-${blackKeyWidthPercent / 2}%` : '0',
                            marginRight: isBlack ? `-${blackKeyWidthPercent / 2}%` : '0'
                        }}
                        className={`
                            cursor-pointer transition-all duration-75 relative
                            ${isBlack ? 
                                'bg-slate-900 h-28 z-10 rounded-b-sm border border-slate-700' : 
                                `h-44 border border-slate-200 rounded-b-lg ${isMiddleC ? 'bg-amber-100 shadow-inner' : 'bg-white'}`
                            }
                            ${isActive ? '!bg-success' : isDetected ? '!bg-cyan-400 opacity-90 scale-[0.98]' : ''}
                            hover:brightness-90 active:scale-95 flex items-end justify-center pb-4
                        `}
                        title={note.name}
                    >
                        {showKeyNames && !isBlack && (
                            <span className={`text-[10px] font-bold truncate ${isMiddleC ? 'text-amber-700' : 'text-slate-400'}`}>
                                {showOctaves ? note.name : note.name.replace(/\d+/, '')}
                            </span>
                        )}
                    </div>
                );
            })}
            </div>
        </div>
    );
};

export default PianoKeyboard;
export { NOTES, NOTE_TO_FREQUENCY };
