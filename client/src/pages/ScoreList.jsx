import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Play, Calendar, Music, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ScoreList = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/scores', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setScores(res.data);
            } catch (err) {
                console.error('Failed to fetch scores');
            } finally {
                setLoading(false);
            }
        };
        fetchScores();
    }, []);

    const filteredScores = scores.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-text-muted animate-pulse">Memuat koleksi lagu...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold">Koleksi Lagu</h1>
                    <p className="text-text-muted mt-1">Daftar lagu hasil parsing yang siap dilatih.</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Cari judul lagu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass bg-white/5 border-none pl-12 pr-6 py-3 w-full md:w-64 outline-none focus:ring-2 ring-primary transition-all"
                    />
                </div>
            </div>

            {filteredScores.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass p-20 text-center flex flex-col items-center gap-4 border-dashed border-2 border-white/5"
                >
                    <div className="bg-white/5 p-6 rounded-full">
                        <Music size={48} className="text-text-muted" />
                    </div>
                    <p className="text-text-muted text-lg">Belum ada lagu. Silakan unggah lagu pertama Anda!</p>
                    <button 
                        onClick={() => navigate('/upload')}
                        className="btn-primary mt-2"
                    >
                        Upload Lagu
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredScores.map((score, idx) => (
                        <motion.div
                            key={score.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/score/${score.id}`)}
                            className="glass p-6 group cursor-pointer hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                                        <FileText className="text-primary" size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{score.title}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-text-muted text-xs">
                                                <Calendar size={14} />
                                                {new Date(score.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-text-muted text-xs">
                                                <Music size={14} />
                                                {score.notes?.length || 0} Nada
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-primary p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Play size={18} className="text-white fill-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScoreList;
