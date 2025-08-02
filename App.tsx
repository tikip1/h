import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { generateTitleAndTags } from './services/geminiService';
import { SparklesIcon, DownloadIcon } from './components/icons';
import type { ProcessableImage, ProcessResult, GeneratedContent } from './types';

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessableImage[]>([]);
  const [results, setResults] = useState<Record<string, ProcessResult>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFileToImage = (file: File): Promise<ProcessableImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve({ id: crypto.randomUUID(), dataUrl, base64, filename: file.name });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = useCallback((files: File[]) => {
    Promise.all(files.map(handleFileToImage)).then(newImages => {
      setImages(prev => [...prev, ...newImages]);
    }).catch(err => {
        console.error("Error reading files:", err);
        setGlobalError("There was an error processing one or more of your files.");
    });
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (images.length === 0) return;
    
    setIsProcessing(true);
    setGlobalError(null);

    const imagesToProcess = images.filter(img => !results[img.id] || 'status' in (results[img.id] || {}));

    setResults(prev => {
        const newResults = {...prev};
        imagesToProcess.forEach(img => {
            newResults[img.id] = { status: 'loading' };
        });
        return newResults;
    });

    const promises = imagesToProcess.map(image => 
        generateTitleAndTags(image.base64)
            .then(result => ({ id: image.id, data: result }))
            .catch(err => ({ id: image.id, error: err instanceof Error ? err.message : 'An unknown error occurred.' }))
    );

    for (const promise of promises) {
        const result = await promise;
        if ('data' in result) {
            setResults(prev => ({ ...prev, [result.id]: result.data }));
        } else {
            setResults(prev => ({ ...prev, [result.id]: { status: 'error', message: result.error } }));
        }
    }

    setIsProcessing(false);
  }, [images, results]);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setResults(prev => {
        const newResults = {...prev};
        delete newResults[id];
        return newResults;
    });
  }, []);
  
  const handleReset = useCallback(() => {
    setImages([]);
    setResults({});
    setGlobalError(null);
    setIsProcessing(false);
  }, []);
  
  const handleDownloadCSV = useCallback(() => {
    const successfulResults = images.map(img => ({
        image: img,
        result: results[img.id]
    })).filter(item => item.result && 'title' in item.result) as { image: ProcessableImage; result: GeneratedContent }[];

    if (successfulResults.length === 0) return;

    const escapeCsvField = (field: string) => {
        if (/[,"\n]/.test(field)) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    };

    const headers = ['filename', 'title', 'tags'];
    const rows = successfulResults.map(item => [
        escapeCsvField(item.image.filename),
        escapeCsvField(item.result.title),
        escapeCsvField(item.result.tags.join(', ')),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'image_metadata.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [images, results]);

  const canGenerate = images.length > 0 && !isProcessing && images.some(img => !results[img.id] || 'status' in (results[img.id] || {}));
  const hasSuccessfulResults = Object.values(results).some(r => r && 'title' in r);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Bulk Photo Tagger
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Upload multiple photos to instantly generate titles & comma-separated tags.
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <ImageUploader onImageUpload={handleImageUpload} disabled={isProcessing} />

            {globalError && (
                <div className="mt-6 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">
                    {globalError}
                </div>
            )}

            {images.length > 0 && (
                 <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
                    <button
                      onClick={handleGenerateClick}
                      disabled={!canGenerate}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <SparklesIcon />
                      {isProcessing ? 'Generating...' : `Generate for ${images.filter(img => !results[img.id] || 'status' in (results[img.id] || {})).length} Images`}
                    </button>
                     <button
                        onClick={handleReset}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-8 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear All
                    </button>
                    {hasSuccessfulResults && (
                        <button
                            onClick={handleDownloadCSV}
                            disabled={isProcessing}
                            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <DownloadIcon />
                            Download CSV
                        </button>
                    )}
                 </div>
            )}
           
           <ResultDisplay 
                images={images}
                results={results}
                onRemove={handleRemoveImage}
                isProcessing={isProcessing}
            />

        </main>
      </div>
    </div>
  );
};

export default App;