import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PianoKeyboard from '../components/PianoKeyboard';
import { Smartphone } from 'lucide-react';

const RemoteKeyboard = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const rangeStart = searchParams.get('rangeStart') || 'C3';
    const rangeEnd = searchParams.get('rangeEnd') || 'G5';
    const showKeyNames = searchParams.get('showKeyNames') !== 'false';
    
    const [lastPressed, setLastPressed] = useState(null);

    const handleKeyPress = async (note) => {
        setLastPressed(note);
        try {
            await axios.post('/api/remote/press', {
                sessionId,
                note
            });
        } catch (err) {
            console.error('Failed to send remote press');
        }
        setTimeout(() => setLastPressed(null), 200);
    };

    if (!sessionId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <div className="glass p-8 max-w-sm">
                    <h1 className="text-2xl font-bold text-error">Missing Session ID</h1>
                    <p className="mt-4 text-text-muted">Please scan the QR code from the Practice page on your computer.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="bg-primary/20 p-4 rounded-full">
                    <Smartphone size={32} className="text-primary" />
                </div>
                <h1 className="text-xl font-bold">Remote Piano</h1>
                <p className="text-xs text-text-muted">Playing as session: {sessionId.slice(0, 8)}...</p>
            </div>
            
            <div className="w-full max-w-4xl transform scale-90 md:scale-100">
                <PianoKeyboard 
                    onKeyPress={handleKeyPress} 
                    lastPlayedNote={lastPressed}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    showKeyNames={showKeyNames}
                    showOctaves={showKeyNames}
                />
            </div>
            
            <div className="mt-8 text-sm text-text-muted animate-pulse">
                Tap keys to play on your computer
            </div>
        </div>
    );
};

export default RemoteKeyboard;
