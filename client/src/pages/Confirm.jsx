import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Confirm = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/auth/confirm/${token}`);
                setStatus('success');
                setMessage(res.data.message);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Confirmation failed');
            }
        };
        confirmEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass w-full max-w-md p-8 flex flex-col items-center gap-6 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 size={64} className="text-primary animate-spin" />
                        <h1 className="text-2xl font-bold">Verifying Email...</h1>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle size={64} className="text-success" />
                        <h1 className="text-2xl font-bold">Email Confirmed!</h1>
                        <p className="text-text-muted">{message}</p>
                        <Link to="/login" className="btn-primary no-underline mt-4">Go to Login</Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={64} className="text-error" />
                        <h1 className="text-2xl font-bold">Verification Failed</h1>
                        <p className="text-text-muted">{message}</p>
                        <Link to="/register" className="btn-outline no-underline mt-4">Try Registering Again</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default Confirm;
