const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
    uploadDocument: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    },

    getDocuments: async () => {
        const response = await fetch(`${API_BASE_URL}/documents`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
    },

    getDocument: async (documentId: string) => {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
        if (!response.ok) throw new Error('Failed to fetch document');
        return response.json();
    },

    queryDocument: async (documentId: string, query: string) => {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId, query }),
        });
        if (!response.ok) throw new Error('Query failed');
        return response.json();
    },

    summarizeDocument: async (documentId: string) => {
        const response = await fetch(`${API_BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId }),
        });
        if (!response.ok) throw new Error('Summarization failed');
        return response.json();
    },

    compareDocuments: async (documentId1: string, documentId2: string) => {
        const response = await fetch(`${API_BASE_URL}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id_1: documentId1, document_id_2: documentId2 }),
        });
        if (!response.ok) throw new Error('Comparison failed');
        return response.json();
    },

    generatePodcast: async (documentId: string) => {
        const response = await fetch(`${API_BASE_URL}/podcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId }),
        });
        if (!response.ok) throw new Error('Podcast generation failed');
        return response.json();
    },

    generateMindmap: async (documentId: string) => {
        const response = await fetch(`${API_BASE_URL}/mindmap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId }),
        });
        if (!response.ok) throw new Error('Mindmap generation failed');
        return response.json();
    },

    translateText: async (text: string, targetLanguage: string) => {
        const response = await fetch(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, target_language: targetLanguage }),
        });
        if (!response.ok) throw new Error('Translation failed');
        return response.json();
    },

    searchWikipedia: async (query: string, userId: string = 'default_user') => {
        const response = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, user_id: userId }),
        });
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    recordInteraction: async (pageid: string, title: string, userId: string = 'default_user') => {
        const response = await fetch(`${API_BASE_URL}/interaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageid, title, user_id: userId }),
        });
        if (!response.ok) throw new Error('Interaction tracking failed');
        return response.json();
    },

    getFeed: async (userId: string = 'default_user') => {
        const response = await fetch(`${API_BASE_URL}/feed?user_id=${userId}`);
        if (!response.ok) throw new Error('Feed failed');
        return response.json();
    },

    compareBulk: async (documentIds: string[]) => {
        const response = await fetch(`${API_BASE_URL}/compare_bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_ids: documentIds }),
        });
        if (!response.ok) throw new Error('Bulk comparison failed');
        return response.json();
    },

    researchWiki: async (pageid: string, title: string) => {
        const response = await fetch(`${API_BASE_URL}/research_wiki`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageid, title }),
        });
        if (!response.ok) throw new Error('Wiki research failed');
        return response.json();
    },

    compareWiki: async (pageids: string[], titles: string[]) => {
        const response = await fetch(`${API_BASE_URL}/compare_wiki`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageids, titles }),
        });
        if (!response.ok) throw new Error('Wiki comparison failed');
        return response.json();
    }
};
