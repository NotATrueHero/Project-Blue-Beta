
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { LinkOpenMode } from '../types';

interface NewsItem {
    id: number;
    title: string;
    url: string;
    score: number;
    by: string;
    time: number;
}

interface NewsProps {
    linkOpenMode: LinkOpenMode;
}

export const News: React.FC<NewsProps> = ({ linkOpenMode }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        setLoading(true);
        try {
            // Get Top Stories IDs
            const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            const ids = await res.json();
            
            // Get Details for Top 15
            const topIds = ids.slice(0, 15);
            const storyPromises = topIds.map((id: number) => 
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
            );
            
            const stories = await Promise.all(storyPromises);
            setNews(stories);
            setLoading(false);
        } catch (e) {
            console.error("News Fetch Failed", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
        >
            <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Live Intel</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Global Tech & Science Feed</p>
                </div>
                <button 
                    onClick={fetchNews} 
                    className={`flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-all text-xs tracking-widest ${loading ? 'animate-pulse' : ''}`}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Scanning...' : 'Update'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar border-4 border-white bg-black/20 p-4 md:p-8">
                {loading && news.length === 0 ? (
                    <div className="h-full flex items-center justify-center opacity-50 uppercase tracking-widest animate-pulse">
                        Establishing Uplink...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {news.map((item, index) => (
                            <a 
                                key={item.id} 
                                href={item.url} 
                                target={linkOpenMode === 'new_tab' ? "_blank" : "_self"} 
                                rel="noopener noreferrer"
                                className="group block border-l-4 border-white/20 pl-4 py-4 hover:bg-white/5 hover:border-white transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-mono opacity-60 uppercase tracking-widest mb-1">
                                            <span className="text-blue-300">#{index + 1}</span> // {new Date(item.time * 1000).toLocaleTimeString()} // {item.score} PTS
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold uppercase leading-tight group-hover:text-blue-300 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="text-xs opacity-50 mt-1">SOURCE: {new URL(item.url || 'http://localhost').hostname}</div>
                                    </div>
                                    <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs opacity-40 uppercase tracking-widest">
                <Radio size={12} className="animate-pulse text-red-500" /> Live Stream Active
            </div>
        </motion.div>
    );
};
