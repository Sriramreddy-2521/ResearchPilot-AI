import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Send, Sparkles, AlertCircle, ArrowLeft, Headphones, Network, X } from 'lucide-react';
import { api } from '../lib/api';
import { MindMapViewer, type MindMapNodeData } from '../components/MindMap';

const Workspace = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const document = location.state?.document;

    const [query, setQuery] = useState('');
    const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [generatingPodcast, setGeneratingPodcast] = useState(false);
    const [podcastAudio, setPodcastAudio] = useState<string | null>(null);
    const [podcastScript, setPodcastScript] = useState<string | null>(null);
    const [showScript, setShowScript] = useState(false);

    const [generatingMindMap, setGeneratingMindMap] = useState(false);
    const [mindMapData, setMindMapData] = useState<MindMapNodeData | null>(null);
    const [showMindMapModal, setShowMindMapModal] = useState(false);

    useEffect(() => {
        if (document && document.status === 'ready') {
            handleSummarize();
        }
    }, [document]);

    if (!document) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center flex-col">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-medium text-gray-600">No document selected</h2>
                <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">Return to Dashboard</button>
            </div>
        );
    }

    const handleSummarize = async () => {
        setSummarizing(true);
        try {
            const data = await api.summarizeDocument(document.id);
            setSummary(data.summary);
        } catch (e) {
            setSummary("Failed to generate summary. Make sure Gemini API Key is configured in backend.");
        } finally {
            setSummarizing(false);
        }
    };

    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userQuery = query;
        setChatLog(prev => [...prev, { role: 'user', content: userQuery }]);
        setQuery('');
        setLoading(true);

        try {
            const data = await api.queryDocument(document.id, userQuery);
            setChatLog(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (e) {
            setChatLog(prev => [...prev, { role: 'assistant', content: "Sorry, an error occurred while searching the document." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePodcast = async () => {
        setGeneratingPodcast(true);
        try {
            const data = await api.generatePodcast(document.id);
            setPodcastAudio(`http://localhost:8000${data.audio_url}`);
            setPodcastScript(data.script);
        } catch (e) {
            alert("Failed to generate podcast.");
        } finally {
            setGeneratingPodcast(false);
        }
    };

    const handleGenerateMindMap = async () => {
        if (mindMapData) {
            setShowMindMapModal(true);
            return;
        }

        setGeneratingMindMap(true);
        try {
            const data = await api.generateMindmap(document.id);
            setMindMapData(data.mindmap_data);
            setShowMindMapModal(true);
        } catch (e) {
            alert("Failed to generate mind map.");
        } finally {
            setGeneratingMindMap(false);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Center Panel: Chat Interface */}
            <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-100 flex items-center">
                    <button onClick={() => navigate('/')} className="mr-3 text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                        <FileText size={18} className="text-gray-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 truncate" title={document.filename}>{document.filename}</h2>
                        <p className="text-xs text-green-600 font-medium tracking-wide uppercase">RAG Active</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatLog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <Sparkles className="w-12 h-12 mb-4 text-gray-200" />
                            <p className="text-gray-500 font-medium">Ask ResearchPilot anything about this paper.</p>
                            <p className="text-sm mt-2 max-w-sm">It uses contextually retrieved sections to answer accurately.</p>
                        </div>
                    ) : (
                        chatLog.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-black text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-sm animate-pulse flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleQuery} className="relative flex items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={loading || document.status !== 'ready'}
                            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="absolute right-2 p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Panel: Summary & Insights */}
            <div className="w-96 bg-[#F7F7F5] flex flex-col overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6 flex items-center">
                        <Sparkles size={16} className="mr-2" /> Research Findings
                    </h3>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">AI Summary</h4>
                        <div className="text-sm text-gray-700 leading-relaxed prose prose-sm">
                            {document.status !== 'ready' ? (
                                <div className="text-gray-400 italic">Document is still processing in the background... check back later.</div>
                            ) : summarizing ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                </div>
                            ) : summary ? (
                                <div className="whitespace-pre-wrap">{summary}</div>
                            ) : (
                                <button onClick={handleSummarize} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-lg w-full transition-colors">
                                    Generate Summary
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
                    <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center">
                        <Headphones size={18} className="mr-2" /> Podcast Agent
                    </h4>
                    <div className="text-sm text-gray-700 leading-relaxed">
                        {document.status !== 'ready' ? (
                            <div className="text-gray-400 italic">Available after document processing...</div>
                        ) : generatingPodcast ? (
                            <div className="animate-pulse flex items-center space-x-2 text-indigo-600 font-medium">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                <span className="ml-2">Synthesizing audio script...</span>
                            </div>
                        ) : podcastAudio ? (
                            <div className="space-y-4">
                                <audio controls src={podcastAudio} className="w-full h-10 rounded-lg outline-none" />
                                <button
                                    onClick={() => setShowScript(!showScript)}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs underline"
                                >
                                    {showScript ? "Hide Script" : "Read Script"}
                                </button>
                                {showScript && podcastScript && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap mt-2 overflow-y-auto max-h-48">
                                        {podcastScript}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleGeneratePodcast} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-lg w-full transition-colors flex items-center justify-center">
                                <Headphones size={16} className="mr-2" /> Generate Podcast Audio
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6 mb-6">
                    <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center">
                        <Network size={18} className="mr-2" /> Knowledge Map
                    </h4>
                    <div className="text-sm text-gray-700 leading-relaxed">
                        {document.status !== 'ready' ? (
                            <div className="text-gray-400 italic">Available after document processing...</div>
                        ) : generatingMindMap ? (
                            <div className="animate-pulse flex items-center space-x-2 text-indigo-600 font-medium">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                <span className="ml-2">Mapping concepts...</span>
                            </div>
                        ) : (
                            <button onClick={handleGenerateMindMap} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-lg w-full transition-colors flex items-center justify-center">
                                <Network size={16} className="mr-2" /> {mindMapData ? "Open Mind Map" : "Visualise Concept Map"}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Mind Map Modal Overlay */}
            {showMindMapModal && mindMapData && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shadow-sm">
                        <h2 className="text-lg font-semibold flex items-center text-gray-800">
                            <Network className="mr-3 text-indigo-600" size={20} />
                            Knowledge Concept Map
                        </h2>
                        <button onClick={() => setShowMindMapModal(false)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-8">
                        <MindMapViewer data={mindMapData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workspace;
