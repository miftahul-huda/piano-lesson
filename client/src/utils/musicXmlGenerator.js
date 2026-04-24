/**
 * Utility to convert an array of notes into a MusicXML string for OSMD.
 * 
 * Each note can be:
 *   - A plain string: 'C4' (defaults to quarter note)
 *   - An object: { note: 'C4', duration: 'quarter', dotted: false }
 *   - An array of simultaneous notes (chord): ['C4', 'E4'] or [{ note: 'C4', duration: 'half' }, { note: 'E4', duration: 'half' }]
 * 
 * Supported durations: 'whole', 'half', 'quarter', 'eighth', 'sixteenth'
 * Dotted: add dotted: true to triple the note length by half
 */

const DIVISIONS = 4; // divisions per quarter note
const BEATS_PER_MEASURE = 4;
const MEASURE_TOTAL_DIVISIONS = DIVISIONS * BEATS_PER_MEASURE; // = 16

const DURATION_CONFIG = {
    'whole':     { divisions: 16, type: 'whole' },
    'half':      { divisions: 8,  type: 'half' },
    'quarter':   { divisions: 4,  type: 'quarter' },
    'eighth':    { divisions: 2,  type: 'eighth' },
    'sixteenth': { divisions: 1,  type: '16th' },
};

/**
 * Normalize a note entry to a standard object.
 * @param {string|object} entry
 * @returns {{ note: string, duration: string, dotted: boolean }}
 */
const normalizeNote = (entry) => {
    if (typeof entry === 'string') {
        return { note: entry, duration: 'quarter', dotted: false };
    }
    return {
        note: entry.note || entry,
        duration: entry.duration || 'quarter',
        dotted: entry.dotted || false,
    };
};

/**
 * Get the number of MusicXML divisions for a given duration + dotted flag.
 */
const getDivisions = (duration, dotted) => {
    const base = DURATION_CONFIG[duration]?.divisions ?? 4;
    return dotted ? Math.round(base * 1.5) : base;
};

/**
 * Parse note string like 'C4', 'F#3' into { step, alter, octave }
 */
const parsePitch = (noteStr) => {
    const hasAccidental = noteStr.includes('#');
    const step = noteStr.charAt(0).toUpperCase();
    const octave = parseInt(hasAccidental ? noteStr.charAt(2) : noteStr.charAt(1), 10);
    return { step, alter: hasAccidental ? 1 : 0, octave };
};

/**
 * Render a single MusicXML <note> element.
 */
const renderNote = (noteStr, duration, dotted, voice, staff, isChord = false, beam = null) => {
    const { step, alter, octave } = parsePitch(noteStr);
    const divs = getDivisions(duration, dotted);
    const type = DURATION_CONFIG[duration]?.type ?? 'quarter';

    return `
      <note>
        ${isChord ? '<chord/>' : ''}
        <pitch>
          <step>${step}</step>
          ${alter ? '<alter>1</alter>' : ''}
          <octave>${octave}</octave>
        </pitch>
        <duration>${divs}</duration>
        <voice>${voice}</voice>
        <type>${type}</type>
        ${dotted ? '<dot/>' : ''}
        <staff>${staff}</staff>
        ${beam ? `<beam number="1">${beam}</beam>` : ''}
      </note>`;
};

/**
 * Helper to determine beam state for a sequence of notes
 */
const getBeamState = (index, total) => {
    if (total <= 1) return null;
    if (index === 0) return 'begin';
    if (index === total - 1) return 'end';
    return 'continue';
};

/**
 * Render a MusicXML <rest> element.
 */
const renderRest = (duration, voice, staff) => {
    const divs = getDivisions(duration, false);
    const type = DURATION_CONFIG[duration]?.type ?? 'quarter';
    return `
      <note>
        <rest/>
        <duration>${divs}</duration>
        <voice>${voice}</voice>
        <type>${type}</type>
        <staff>${staff}</staff>
      </note>`;
};

export const generateMusicXML = (notes = [], title = "Piano Practice") => {
    const header = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">`;

    const footer = `  </part>
</score-partwise>`;

    if (notes.length === 0) return header + footer;

    // Group notes into measures based on total divisions used
    const measures = [];
    let currentMeasure = [];
    let currentDivTotal = 0;

    notes.forEach((entry) => {
        // Handle chord groups (array of simultaneous notes)
        const isChordGroup = Array.isArray(entry);
        const noteList = isChordGroup ? entry.map(normalizeNote) : [normalizeNote(entry)];
        
        // For chords, all notes share the same duration (use first note's duration)
        const primaryNote = noteList[0];
        const divs = getDivisions(primaryNote.duration, primaryNote.dotted);

        // If this note doesn't fit in current measure, start new one
        if (currentDivTotal + divs > MEASURE_TOTAL_DIVISIONS && currentMeasure.length > 0) {
            measures.push(currentMeasure);
            currentMeasure = [];
            currentDivTotal = 0;
        }

        currentMeasure.push({ noteList, isChordGroup, divs, primaryNote });
        currentDivTotal += divs;

        // If measure is exactly full, start new one
        if (currentDivTotal >= MEASURE_TOTAL_DIVISIONS) {
            measures.push(currentMeasure);
            currentMeasure = [];
            currentDivTotal = 0;
        }
    });

    // Push any remaining notes
    if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
    }

    let xml = header;

    measures.forEach((measureNotes, mIdx) => {
        xml += `\n    <measure number="${mIdx + 1}">`;

        // First measure: add attributes
        if (mIdx === 0) {
            xml += `
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>${BEATS_PER_MEASURE}</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>`;
        }

        // Calculate total used divisions in this measure
        let usedDivisions = measureNotes.reduce((sum, g) => sum + g.divs, 0);

        // Function to process a staff
        const processStaff = (staffNum, voiceNum, filterFn) => {
            let beamCount = 0;
            let beamTotal = 0;
            
            // Look ahead to find groups of eighth/sixteenth notes for beaming
            const beamGroups = [];
            let currentGroup = [];
            
            measureNotes.forEach((g, i) => {
                const staffNotes = g.noteList.filter(filterFn);
                const isShortNote = g.primaryNote.duration === 'eighth' || g.primaryNote.duration === 'sixteenth';
                
                if (staffNotes.length > 0 && isShortNote) {
                    currentGroup.push(i);
                } else {
                    if (currentGroup.length > 1) beamGroups.push([...currentGroup]);
                    currentGroup = [];
                }
            });
            if (currentGroup.length > 1) beamGroups.push(currentGroup);

            measureNotes.forEach((g, i) => {
                const staffNotes = g.noteList.filter(filterFn);
                
                if (staffNotes.length > 0) {
                    // Check if this note is part of a beam group
                    const group = beamGroups.find(group => group.includes(i));
                    const beamState = group ? getBeamState(group.indexOf(i), group.length) : null;

                    // First note
                    xml += renderNote(staffNotes[0].note, g.primaryNote.duration, g.primaryNote.dotted, voiceNum, staffNum, false, beamState);
                    // Additional chord notes
                    staffNotes.slice(1).forEach(n => {
                        xml += renderNote(n.note, g.primaryNote.duration, g.primaryNote.dotted, voiceNum, staffNum, true, null);
                    });
                } else {
                    xml += renderRest(g.primaryNote.duration, voiceNum, staffNum);
                }
            });

            if (usedDivisions < MEASURE_TOTAL_DIVISIONS) {
                xml += renderRest('quarter', voiceNum, staffNum);
            }
        };

        // --- PASS 1: Treble Staff (voice 1) ---
        processStaff(1, 1, n => parsePitch(n.note).octave > 3);

        // --- PASS 2: Backup and render Bass Staff (voice 2) ---
        xml += `\n      <backup><duration>${MEASURE_TOTAL_DIVISIONS}</duration></backup>`;
        processStaff(2, 2, n => parsePitch(n.note).octave <= 3);

        xml += `\n    </measure>`;
    });

    xml += '\n' + footer;
    return xml;
};

/**
 * Sample notes demonstrating: whole, half, quarter, eighth notes,
 * dotted notes, semitones (#), and grand staff (treble + bass).
 */
export const SAMPLE_NOTES = [
    // Birama 1: Whole note C4 (treble) + C3 (bass)
    { note: 'C4', duration: 'whole' },

    // Birama 2: Half notes dengan semitone
    { note: 'E4', duration: 'half' },
    { note: 'F#4', duration: 'half' },  // F#4 = semitone

    // Birama 3: Quarter notes naik tangga nada C mayor
    { note: 'G4', duration: 'quarter' },
    { note: 'A4', duration: 'quarter' },
    { note: 'B4', duration: 'quarter' },
    { note: 'C5', duration: 'quarter' },

    // Birama 4: Eighth notes cepat + semitone A#
    { note: 'C5', duration: 'eighth' },
    { note: 'B4', duration: 'eighth' },
    { note: 'A#4', duration: 'eighth' }, // A#4 = semitone
    { note: 'A4', duration: 'eighth' },
    { note: 'G#4', duration: 'eighth' }, // G#4 = semitone
    { note: 'G4', duration: 'eighth' },
    { note: 'F#4', duration: 'eighth' }, // F#4 = semitone
    { note: 'F4', duration: 'eighth' },

    // Birama 5: Dotted notes
    { note: 'E4', duration: 'quarter', dotted: true }, // Dotted quarter = 1.5 ketuk
    { note: 'D4', duration: 'eighth' },                // Eighth = 0.5 ketuk (total 2 ketuk)
    { note: 'C#4', duration: 'half' },                 // C# = semitone, half = 2 ketuk

    // Birama 6: Akord (chord) - melodi dan harmoni bersamaan
    [{ note: 'E5', duration: 'half' }, { note: 'C3', duration: 'half' }],
    [{ note: 'D5', duration: 'quarter' }, { note: 'G3', duration: 'quarter' }],
    [{ note: 'C5', duration: 'quarter' }, { note: 'E3', duration: 'quarter' }],
];
