
import React, { useState, useCallback, ChangeEvent } from 'react';
import type { UploadedImage, Quality } from './types';
import { generateImages } from './services/geminiService';

const MAX_IMAGES = 5;

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const downloadImage = (base64Image: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- SVG Icon Components (defined outside App to prevent re-creation) ---
const UploadIcon = ({ className = "h-10 w-10" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-gray-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z"/>
    </svg>
);

// --- UI Components (defined outside App) ---

interface ImageUploaderProps {
    uploadedImages: UploadedImage[];
    onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onImageRemove: (index: number) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ uploadedImages, onImageUpload, onImageRemove }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-300 mb-2">Upload Images (up to {MAX_IMAGES})</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Upload preview ${index + 1}`} className="w-full h-full rounded-lg object-cover" />
                    <button
                        onClick={() => onImageRemove(index)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                        aria-label={`Remove image ${index + 1}`}
                    >
                        <TrashIcon />
                    </button>
                </div>
            ))}

            {uploadedImages.length < MAX_IMAGES && (
                 <label htmlFor="file-upload" className="relative cursor-pointer flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <UploadIcon className="h-8 w-8" />
                    <p className="mt-1 text-xs text-gray-400 text-center px-1">Add Image</p>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onImageUpload} accept="image/png, image/jpeg, image/webp" multiple />
                 </label>
            )}
        </div>
    </div>
);

interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
        >
            <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
    </div>
);

const App: React.FC = () => {
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [removeBackground, setRemoveBackground] = useState<boolean>(false);
    const [characterDescription, setCharacterDescription] = useState<string>('');
    const [backgroundSetting, setBackgroundSetting] = useState<string>('');
    const [quality, setQuality] = useState<Quality>('Standard');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const currentImageCount = uploadedImages.length;
            const slotsAvailable = MAX_IMAGES - currentImageCount;
            if (slotsAvailable <= 0) {
                setError(`You cannot upload more than ${MAX_IMAGES} images.`);
                return;
            }

            const filesToProcess = Array.from(files).slice(0, slotsAvailable);
            
            if (files.length > slotsAvailable) {
                setError(`You can only upload ${MAX_IMAGES} images in total. The first ${slotsAvailable} file(s) were added.`);
            } else {
                setError(null);
            }

            try {
                const newImages: UploadedImage[] = await Promise.all(
                    filesToProcess.map(async (file) => {
                        const base64 = await fileToBase64(file);
                        return { base64, mimeType: file.type, name: file.name };
                    })
                );
                setUploadedImages(prev => [...prev, ...newImages]);
            } catch (err) {
                setError("Failed to read one or more image files.");
                console.error(err);
            }
             // Reset the input value to allow re-uploading the same file(s)
            event.target.value = '';
        }
    }, [uploadedImages]);

    const handleImageRemove = useCallback((indexToRemove: number) => {
        setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    const handleGenerate = async () => {
        if (uploadedImages.length === 0) {
            setError("Please upload at least one image first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]); // Clear previous results
        try {
            const newImageArray = await generateImages(
                uploadedImages,
                characterDescription,
                backgroundSetting,
                removeBackground
            );
            setGeneratedImages(newImageArray); // Set the 4 new images
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadAll = () => {
        if (generatedImages.length === 0) return;
        generatedImages.forEach((img, index) => {
            downloadImage(img, `image-creator-${Date.now()}-${index + 1}.png`);
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Image Creator
                        </span>
                    </h1>
                    <div className="mt-4 inline-block text-left">
                        <div className="flex flex-col items-start gap-y-3 text-gray-300">
                            <a href="https://www.youtube.com/watch?v=jF0ICBTCn2Q" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-white transition-colors duration-200 text-lg">
                                <YouTubeIcon />
                                <span>Hướng dẫn A-Z cách tạo App này chỉ trong 5 phút</span>
                            </a>
                            <a href="https://www.facebook.com/richardvo.tt/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-white transition-colors duration-200 text-lg">
                                <FacebookIcon />
                                <span>Kết nối với Tuấn</span>
                            </a>
                        </div>
                        <p className="mt-4 text-lg text-gray-400">
                            Design by <a href="https://www.facebook.com/richardvo.tt/" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Tuan Vo</a> @ <a href="https://elearning.nghecongso.com/academy" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Nghe Cong So</a>
                        </p>
                    </div>
                </header>
                
                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Controls */}
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 flex flex-col gap-6 h-fit">
                        <ImageUploader uploadedImages={uploadedImages} onImageUpload={handleImageUpload} onImageRemove={handleImageRemove} />
                        
                        <ToggleSwitch label="Remove Background" enabled={removeBackground} onChange={setRemoveBackground} />

                        <div>
                            <label htmlFor="char-desc" className="block text-sm font-medium text-gray-300 mb-2">Character Description</label>
                            <textarea
                                id="char-desc"
                                rows={3}
                                value={characterDescription}
                                onChange={(e) => setCharacterDescription(e.target.value)}
                                placeholder="e.g., a warrior with glowing blue eyes, wearing silver armor"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="bg-setting" className="block text-sm font-medium text-gray-300 mb-2">Background & Setting</label>
                            <textarea
                                id="bg-setting"
                                rows={3}
                                value={backgroundSetting}
                                onChange={(e) => setBackgroundSetting(e.target.value)}
                                placeholder="e.g., a mystical forest at night, with fireflies"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Output Quality</label>
                            <div className="flex gap-2">
                                {(['Standard', '2K', '4K'] as Quality[]).map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${quality === q ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <button
                            onClick={handleGenerate}
                            disabled={isLoading || uploadedImages.length === 0}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate'
                            )}
                        </button>
                    </div>

                    {/* Right Column: Results */}
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-200">Results</h2>
                            {generatedImages.length > 0 && (
                                <button 
                                    onClick={handleDownloadAll}
                                    className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.6)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                                >
                                    <DownloadIcon />
                                    Download All
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="aspect-square bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                                        <svg className="w-10 h-10 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
                                        </svg>
                                    </div>
                                ))
                            ) : generatedImages.length > 0 ? (
                                generatedImages.map((img, index) => (
                                    <div key={index} className="aspect-square rounded-lg overflow-hidden group relative">
                                        <img src={`data:image/png;base64,${img}`} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
                                         <button onClick={() => downloadImage(img, `image-creator-${Date.now()}-${index + 1}.png`)} className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DownloadIcon />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center text-center text-gray-500 h-full py-16">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-semibold">Your generated images will appear here.</p>
                                    <p className="text-sm">Upload an image and provide a description to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
