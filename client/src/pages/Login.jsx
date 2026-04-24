import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Music } from 'lucide-react';

const Login = () => {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('/api/auth/google-login', {
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
                    <div className="bg-primary/20 p-4 rounded-2xl animate-float">
                        <Music size={48} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mt-2">Welcome Back</h1>
                    <p className="text-text-muted">Master the piano with every session</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center border border-red-500/20">{error}</div>}

                <div className="flex flex-col items-center gap-4 mt-4">
                    <div className="w-full flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            theme="filled_black"
                            shape="pill"
                            text="signin_with"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
