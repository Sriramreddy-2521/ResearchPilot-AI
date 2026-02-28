import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WikiAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTopics: any[];
}

export const WikiAnalysisModal: React.FC<WikiAnalysisModalProps> = ({ isOpen, onClose, selectedTopics }) => {
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isComparison = selectedTopics.length > 1;

    useEffect(() => {
        if (isOpen && selectedTopics.length > 0) {
            handleAnalyze();
        } else {
            setResult(null);
            setError(null);
        }
    }, [isOpen, selectedTopics]);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isComparison) {
                const response = await api.compareWiki(
                    selectedTopics.map(t => String(t.pageid)),
                    selectedTopics.map(t => t.title)
                );
                setResult(response.comparison);
            } else {
                const topic = selectedTopics[0];
                const response = await api.researchWiki(String(topic.pageid), topic.title);
                setResult(response.analysis);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process Wikipedia topics');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 mt-0">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden m-4">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <div className="flex items-center">
                        {isComparison ? <Sparkles className="mr-3 text-emerald-600" size={24} /> : <BookOpen className="mr-3 text-indigo-600" size={24} />}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isComparison ? "AI Topic Comparison" : "AI Topic Research"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                                <span>{selectedTopics.map(t => t.title).join(' vs ')}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                        title="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isComparison ? 'border-emerald-200 border-t-emerald-600' : 'border-indigo-200 border-t-indigo-600'}`}></div>
                            <p className="text-gray-600 font-medium animate-pulse">
                                {isComparison ? "Comparing topics across multiple dimensions..." : "Analyzing Wikipedia content..."}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500">
                            <AlertCircle size={48} className="mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                            <p>{error}</p>
                            <button
                                onClick={handleAnalyze}
                                className={`mt-6 px-4 py-2 text-white rounded-lg transition ${isComparison ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : result ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            <div className="prose max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-8 border border-gray-200 rounded-xl shadow-sm">
                                                <table className="min-w-full divide-y divide-gray-200 bg-white" {...props} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => <thead className="bg-gray-50/80" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-6 pb-2 border-b border-gray-100" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4 flex items-center before:content-[''] before:w-1 before:h-6 before:bg-indigo-500 before:mr-3 before:rounded-full" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-600 leading-relaxed mb-5 text-base" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-none pl-0 text-gray-600 mb-6 space-y-3" {...props} />,
                                        li: ({ node, ...props }) => <li className="flex items-start before:content-['•'] before:text-indigo-400 before:font-bold before:mr-2 before:text-lg" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                                        hr: ({ node, ...props }) => <hr className="my-10 border-gray-200" {...props} />
                                    }}
                                >
                                    {result}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
