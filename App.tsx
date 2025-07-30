import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { generateSocialContent } from './services/geminiService';
import { GeneratedContent, SocialPlatform, AdvancedOptions, Tone } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>('Instagram');
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    numCaptions: 3,
    numHashtags: 15,
    tone: 'Casual',
    includeEmojis: true,
    generationTarget: 'Both',
  });

  const handleGenerate = useCallback(async (prompt: string, platform: SocialPlatform, options: AdvancedOptions) => {
    if (!prompt.trim()) {
      setError('Please enter a description for your post.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const result = await generateSocialContent(prompt, platform, options);
      setGeneratedContent(result);
    } catch (e) {
      console.error(e);
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-3xl mx-auto">
        <Header />
        <main className="mt-8">
          <InputForm
            onGenerate={handleGenerate}
            isLoading={isLoading}
            selectedPlatform={platform}
            onPlatformChange={setPlatform}
            advancedOptions={advancedOptions}
            onAdvancedOptionsChange={setAdvancedOptions}
          />

          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !generatedContent && !error && (
             <div className="mt-10 text-center text-slate-500 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-lg">
                <SparklesIcon className="h-12 w-12 mb-4 text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-400">Your results will appear here</h2>
                <p className="mt-2 max-w-md">Describe your image or video, and our AI will craft the perfect captions and hashtags for you.</p>
            </div>
          )}

          <ResultsDisplay content={generatedContent} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
};

export default App;
