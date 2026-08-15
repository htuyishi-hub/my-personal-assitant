import React from 'react';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-row overflow-x-auto mx-2 -mt-1 p-2 bg-bolt-elements-background-depth-3 border border-b-none border-bolt-elements-borderColor rounded-lg rounded-b-none">
      {files.map((file, index) => (
        <div key={file.name + file.size} className="mr-2 relative">
          {imageDataList[index] ? (
            <div className="relative">
              <img src={imageDataList[index]} alt={file.name} className="max-h-20 rounded-lg" />
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-1 -right-1 z-10 bg-black rounded-full w-5 h-5 shadow-md hover:bg-gray-900 transition-colors flex items-center justify-center"
              >
                <div className="i-ph:x w-3 h-3 text-gray-200" />
              </button>
              <div className="absolute bottom-0 w-full h-5 flex items-center px-2 rounded-b-lg text-bolt-elements-textTertiary font-thin text-xs bg-bolt-elements-background-depth-2">
                <span className="truncate">{file.name}</span>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center gap-2 max-w-[220px] h-20 pl-3 pr-8 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor">
              <div className="i-ph:file-text text-2xl text-bolt-elements-textSecondary shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm text-bolt-elements-textPrimary">{file.name}</span>
                <span className="text-xs text-bolt-elements-textTertiary">{formatSize(file.size)}</span>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-1 -right-1 z-10 bg-black rounded-full w-5 h-5 shadow-md hover:bg-gray-900 transition-colors flex items-center justify-center"
              >
                <div className="i-ph:x w-3 h-3 text-gray-200" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
