import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Clock, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

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
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-end pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Good Morning</h1>
                        <p className="text-gray-500 mt-1">Here is the latest from your research library.</p>
                    </div>
                    <div>
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
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${doc.status === 'ready' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                            {doc.status}
                                        </span>
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
            </div>
        </div>
    );
};

export default Dashboard;
