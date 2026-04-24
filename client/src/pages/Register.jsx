import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Music } from 'lucide-react';

const Register = () => {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('http://localhost:5001/api/auth/google-login', { 
                googleToken: credentialResponse.credential 
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/practice');
            window.location.reload();
        } catch (err) {
            setError('Google authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md p-8 flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/20 p-4 rounded-2xl">
                        <Music size={48} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mt-2">Join PianoMaster</h1>
                    <p className="text-text-muted">Start your musical journey today</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center border border-red-500/20">{error}</div>}

                <div className="flex justify-center mt-4">
                    <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => setError('Google Signup Failed')}
                        theme="filled_black"
                        shape="pill"
                        text="signup_with"
                    />
                </div>

                <p className="text-center text-text-muted text-sm mt-4">
                    Already have an account? <Link to="/login" className="text-primary font-semibold no-underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
