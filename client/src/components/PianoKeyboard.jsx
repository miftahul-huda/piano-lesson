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

const PianoKeyboard = ({ onKeyPress, lastPlayedNote, rangeStart, rangeEnd, showKeyNames = true, showOctaves = true }) => {
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

    return (
        <div className="flex justify-center relative select-none mt-8 h-48 overflow-x-auto w-full pb-4 px-4 glass !rounded-2xl max-w-full pt-6 shadow-sm">
            <div className="flex relative mx-auto">
            {displayNotes.map((note, index) => {
                const isBlack = note.type === 'black';
                const isActive = lastPlayedNote === note.name;
                const isMiddleC = note.name === 'C4';
                
                return (
                    <div
                        key={note.name}
                        onClick={() => onKeyPress(note.name)}
                        className={`
                            cursor-pointer transition-all duration-75
                            ${isBlack ? 'bg-slate-900 w-8 h-28 -mx-4 z-10 rounded-b-md border border-slate-700' : `w-14 h-44 border border-slate-200 rounded-b-lg ${isMiddleC ? 'bg-amber-100 shadow-inner' : 'bg-white'}`}
                            ${isActive ? '!bg-primary' : ''}
                            hover:brightness-90 active:scale-95 flex items-end justify-center pb-4
                        `}
                        title={note.name}
                    >
                        {showKeyNames && !isBlack && (
                            <span className={`text-xs font-bold ${isMiddleC ? 'text-amber-700' : 'text-slate-400'}`}>
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
