import React from 'react';

export interface MindMapNodeData {
    name: string;
    children?: MindMapNodeData[];
}

interface Props {
    data: MindMapNodeData;
}

const MindMapNode: React.FC<{ node: MindMapNodeData; isRoot?: boolean }> = ({ node, isRoot }) => {
    return (
        <div className="flex flex-col items-center">
            {/* The Node Itself */}
            <div className={`px-4 py-2 my-2 rounded-xl border text-sm text-center shadow-sm max-w-xs transition-colors
                ${isRoot ? 'bg-indigo-600 text-white border-indigo-700 font-semibold' : 'bg-white text-gray-800 border-gray-200'}`}>
                {node.name}
            </div>

            {/* The Children */}
            {node.children && node.children.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Vertical line dropping from parent */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Horizontal connector and children wrapper */}
                    <div className="relative flex justify-center space-x-6 pt-4 border-t border-gray-300 mx-auto" style={{ minWidth: 'min-content' }}>
                        {node.children.map((child, idx) => (
                            <div key={idx} className="relative flex flex-col items-center">
                                {/* Vertical line dropping to child */}
                                <div className="absolute top-0 -mt-4 w-px h-4 bg-gray-300"></div>
                                <MindMapNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const MindMapViewer: React.FC<Props> = ({ data }) => {
    return (
        <div className="p-8 overflow-auto bg-gray-50 flex justify-center min-h-[500px] w-full items-start rounded-2xl border border-gray-200">
            <MindMapNode node={data} isRoot={true} />
        </div>
    );
};
