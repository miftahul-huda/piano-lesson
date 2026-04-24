const sequelize = require('./config/database');
const User = require('./models/User');
const Score = require('./models/Score');

const SAMPLE_NOTES = [
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

async function insertSample() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Temukan sembarang user yang ada
    const user = await User.findOne();
    if (!user) {
      console.log('Belum ada user di database. Harap login terlebih dahulu.');
      process.exit(1);
    }

    const score = await Score.create({
      title: 'Grand Symphony Showcase',
      originalFile: 'sample_symphony.json',
      notes: SAMPLE_NOTES,
      userId: user.id
    });

    console.log('Berhasil menyimpan sampel skor:', score.title);
    process.exit(0);
  } catch (error) {
    console.error('Gagal:', error);
    process.exit(1);
  }
}

insertSample();
