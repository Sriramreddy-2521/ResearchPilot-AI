import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Clock, ChevronRight, Scale, Search, Compass, BookOpen, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { CompareModal } from '../components/CompareModal';
import { WikiAnalysisModal } from '../components/WikiAnalysisModal';

const Dashboard = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // Search & Feed State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [feed, setFeed] = useState<any[]>([]);
    const [loadingFeed, setLoadingFeed] = useState(false);

    // Wiki Selection State
    const [selectedWikiDocs, setSelectedWikiDocs] = useState<any[]>([]);
    const [isWikiModalOpen, setIsWikiModalOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        setLoadingFeed(true);
        try {
            const data = await api.getFeed();
            setFeed(data.feed || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFeed(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const data = await api.searchWikipedia(searchQuery);
            setSearchResults(data.results || []);
            setSelectedWikiDocs([]); // Clear selection on new search
        } catch (e) {
            alert("Search failed.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleInteraction = async (result: any) => {
        try {
            await api.recordInteraction(result.pageid, result.title);
            // Open link in new tab
            window.open(result.url, '_blank', 'noopener,noreferrer');
            // Refresh feed in background
            fetchFeed();
        } catch (e) {
            console.error("Interaction tracking failed", e);
            window.open(result.url, '_blank', 'noopener,noreferrer');
        }
    };

    const toggleWikiSelection = (e: React.MouseEvent | React.ChangeEvent, result: any) => {
        e.stopPropagation();
        setSelectedWikiDocs(prev => {
            const isSelected = prev.some(r => r.pageid === result.pageid);
            if (isSelected) return prev.filter(r => r.pageid !== result.pageid);
            if (prev.length >= 4) return [...prev.slice(1), result]; // Map up to 4 for comparison max
            return [...prev, result];
        });
    };

    const fetchDocuments = async () => {
        try {
            const data = await api.getDocuments();
            setDocuments(data.documents || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setUploading(true);
        try {
            await api.uploadDocument(file);
            await fetchDocuments();
        } catch (e) {
            alert("Upload failed. Ensure backend is running.");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const toggleDocumentSelection = (e: React.MouseEvent | React.ChangeEvent, doc: any) => {
        e.stopPropagation();
        setSelectedDocs(prev => {
            const isSelected = prev.some(d => d.id === doc.id);
            if (isSelected) return prev.filter(d => d.id !== doc.id);
            if (prev.length >= 2) return [prev[1], doc]; // Keep at most 2
            return [...prev, doc];
        });
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-end pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Good Morning</h1>
                        <p className="text-gray-500 mt-1">Here is the latest from your research library.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {selectedDocs.length > 0 && (
                            <button
                                onClick={() => setIsCompareModalOpen(true)}
                                disabled={selectedDocs.length !== 2}
                                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-sm transition-all focus:outline-none ${selectedDocs.length === 2 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Scale size={18} className="mr-2" />
                                Compare ({selectedDocs.length}/2)
                            </button>
                        )}
                        <label className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                            <UploadCloud size={18} className="mr-2" />
                            {uploading ? 'Uploading...' : 'Upload PDF'}
                            <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </header>

                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                        <Clock size={20} className="mr-2 text-gray-400" /> Recent Papers
                    </h2>

                    {documents.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="text-gray-400 w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No papers yet</h3>
                            <p className="text-gray-500 mt-1 max-w-sm mx-auto">Upload your first research paper to start extracting insights and generating summaries.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map((doc, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate('/workspace', { state: { document: doc } })}
                                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${doc.status === 'ready' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                {doc.status}
                                            </span>
                                            {doc.status === 'ready' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.some(d => d.id === doc.id)}
                                                    onChange={(e) => toggleDocumentSelection(e, doc)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 line-clamp-2" title={doc.filename}>{doc.filename}</h3>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <span>{doc.extracted_length ? `${(doc.extracted_length / 1000).toFixed(1)}k chars` : 'Processing'}</span>
                                        <ChevronRight size={16} className="text-transparent group-hover:text-gray-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Section */}
                <div className="pt-8 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center text-gray-800">
                            <Search size={20} className="mr-2 text-indigo-500" /> Wikipedia Research
                        </h2>

                        {selectedWikiDocs.length > 0 && (
                            <button
                                onClick={() => setIsWikiModalOpen(true)}
                                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-sm transition-all focus:outline-none text-white ${selectedWikiDocs.length > 1 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {selectedWikiDocs.length > 1 ? <Sparkles size={18} className="mr-2" /> : <BookOpen size={18} className="mr-2" />}
                                {selectedWikiDocs.length > 1 ? `Compare (${selectedWikiDocs.length})` : 'Research Topic'}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSearch} className="relative flex items-center mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Wikipedia to build your AI profile..."
                            className="w-full bg-white border border-gray-300 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        />
                        <Search className="absolute left-4 text-gray-400" size={20} />
                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="absolute right-2 px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="mb-8 space-y-3">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Search Results</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {searchResults.map((result: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleInteraction(result)}
                                        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer group flex items-start ${selectedWikiDocs.some(r => r.pageid === result.pageid) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}
                                    >
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-semibold text-lg text-indigo-700 group-hover:underline">{result.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: result.snippet + '...' }}></p>
                                        </div>
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedWikiDocs.some(r => r.pageid === result.pageid)}
                                                onChange={(e) => toggleWikiSelection(e, result)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Personalized Feed Section */}
                <div className="pt-4 border-t border-gray-200 pb-12">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                        <Compass size={20} className="mr-2 text-emerald-500" /> Discovery Feed
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">Recommended topics based on your recent searches and interactions.</p>

                    {loadingFeed ? (
                        <div className="flex items-center space-x-2 text-indigo-600 p-4">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            <span className="ml-2 font-medium">Curating your feed...</span>
                        </div>
                    ) : feed.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                            Make some searches and click on results to see personalized recommendations here.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {feed.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => handleInteraction(item)}
                                    className="bg-white p-5 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{item.title}</h4>
                                        <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.snippet + '...' }}></p>
                                    </div>
                                    <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Read Article <ChevronRight size={14} className="ml-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CompareModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                document1={selectedDocs[0]}
                document2={selectedDocs[1]}
            />

            <WikiAnalysisModal
                isOpen={isWikiModalOpen}
                onClose={() => setIsWikiModalOpen(false)}
                selectedTopics={selectedWikiDocs}
            />
        </div>
    );
};

export default Dashboard;
