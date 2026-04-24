import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadScore = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [message, setMessage] = useState('');

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/scores/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setStatus('success');
            setMessage('Music sheet berhasil diunggah dan diparse!');
            setTitle('');
            setFile(null);
            // Reset input file manually
            document.getElementById('file-input').value = '';
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            setStatus('error');
            setMessage(err.response?.data?.message || 'Gagal mengunggah file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 flex flex-col gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl">
                        <Upload className="text-primary" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Upload Music Sheet</h1>
                        <p className="text-text-muted">Unggah PDF atau Gambar untuk diparse menjadi notasi latihan.</p>
                    </div>
                </div>

                <form onSubmit={handleUpload} className="flex flex-col gap-6 mt-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-muted uppercase px-1">Judul Lagu</label>
                        <input 
                            type="text"
                            required
                            placeholder="Contoh: Twinkle Twinkle Little Star"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-black/20 text-text-main p-4 rounded-xl border border-white/5 focus:ring-2 ring-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-muted uppercase px-1">File Music Sheet (PDF/JPG/PNG)</label>
                        <div className="relative">
                            <input 
                                id="file-input"
                                type="file"
                                required
                                accept=".pdf,image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="hidden"
                            />
                            <label 
                                htmlFor="file-input"
                                className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                {file ? (
                                    <div className="flex items-center gap-3 text-primary font-semibold">
                                        <FileText size={24} />
                                        {file.name}
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="text-text-muted group-hover:text-primary transition-colors mb-2" size={48} />
                                        <span className="text-text-muted group-hover:text-text-main">Klik untuk memilih file</span>
                                        <span className="text-[10px] text-text-muted mt-2 italic">Maksimal 5MB</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <AnimatePresence>
                        {status && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`flex items-center gap-3 p-4 rounded-xl ${
                                    status === 'success' ? 'bg-success/20 text-success border border-success/20' : 'bg-error/20 text-error border border-error/20'
                                }`}
                            >
                                {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="text-sm font-medium">{message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit"
                        disabled={uploading}
                        className="btn-primary py-4 text-lg mt-2 relative overflow-hidden"
                    >
                        {uploading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin" size={20} />
                                Sedang Memproses...
                            </div>
                        ) : (
                            'Upload & Parse'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default UploadScore;
