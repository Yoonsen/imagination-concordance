import { useEffect, useState, useRef } from "react";
import { FiSearch, FiSettings, FiRefreshCw } from 'react-icons/fi';

export default function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading corpus data...");
  const [results, setResults] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [hoveredMeta, setHoveredMeta] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState(20);
  const [limit, setLimit] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef(null);

  useEffect(() => {
    const fetchCorpus = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}corpus.json?v=${Date.now()}`);
        const data = await res.json();
        const meta = data.dhlabids || [];
        setMetadata(meta);
        setStatus(`Loaded metadata for ${meta.length} documents.`);
      } catch (err) {
        setStatus("Error loading corpus.");
        console.error(err);
      }
    };
    fetchCorpus();
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        registrationRef.current = registration;
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              showUpdateNotification();
            }
          });
        });
      });
    }
  }, []);

  const showUpdateNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Update Available', {
        body: 'A new version of the app is available. Click to refresh.',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      }).onclick = () => {
        if (registrationRef.current && registrationRef.current.waiting) {
          registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      };
    }
  };

  const handleUpdate = () => {
    if (registrationRef.current && registrationRef.current.waiting) {
      registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const performSearch = async () => {
    if (!query) return alert("Enter search term");
    if (!metadata.length) return alert("Corpus not loaded");

    setIsLoading(true);
    setStatus("Searching...");
    setResults([]);

    const urns = metadata.map(m => m.urn);
    const body = {
      urns,
      query,
      limit,
      window: windowSize,
      html_formatting: true
    };

    try {
      const res = await fetch("https://api.nb.no/dhlab/conc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const conc = await res.json();
      const entries = Object.keys(conc.conc || {}).map(key => ({
        text: conc.conc[key],
        urn: conc.urn[key]
      }));

      setResults(entries);
      setStatus(`Found ${entries.length} matches for "${query}"`);
    } catch (err) {
      setStatus("Search failed.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = (e, meta) => {
    setHoveredMeta(meta);
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setTooltipPos({
      x: rect.left,
      y: rect.top + scrollTop - 10
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Update Banner */}
      {updateAvailable && (
        <div className="bg-blue-500 text-white p-2 text-center">
          <div className="container mx-auto flex justify-between items-center">
            <span>New version available!</span>
            <button 
              onClick={handleUpdate}
              className="bg-white text-blue-500 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Fixed header with search */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-4xl mx-auto py-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && performSearch()}
                placeholder="Search term (e.g. Norge)"
              />
              <button 
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setShowSettings(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                onClick={performSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="max-w-4xl mx-auto">
          <div className="text-sm text-gray-600 py-2">
            {status}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
            <div className="h-full overflow-y-auto">
              {results.map(({ text, urn }, i) => {
                const meta = metadata.find(m => m.urn === urn);
                return (
                  <div
                    key={i}
                    className="p-6 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                    onClick={() =>
                      window.open(
                        `https://www.nb.no/items/${urn}?searchText="${encodeURIComponent(
                          [...text.matchAll(/<b>(.*?)<\/b>/g)].map(m => m[1]).join(" ")
                        )}"~${[...text.matchAll(/<b>(.*?)<\/b>/g)].length}`,
                        "_blank"
                      )
                    }
                    onMouseEnter={(e) => handleMouseEnter(e, meta)}
                    onMouseLeave={() => setHoveredMeta(null)}
                  >
                    <div 
                      className="text-lg leading-relaxed mb-3 text-gray-800"
                      dangerouslySetInnerHTML={{ __html: text }} 
                    />
                    {meta && (
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="font-medium">{meta.title || "Unknown Title"}</span>
                        <span className="italic">{meta.author || "Unknown Author"}</span>
                        <span>{meta.year || "Unknown Year"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Search Settings</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Context Window</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={windowSize}
                    onChange={e => setWindowSize(parseInt(e.target.value))}
                    min="5"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Results</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={limit}
                    onChange={e => setLimit(parseInt(e.target.value))}
                    min="100"
                    max="5000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip */}
        {hoveredMeta && (
          <div
            className="fixed bg-white shadow-xl rounded-lg p-4 z-50 pointer-events-none border border-gray-100"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <h3 className="text-lg font-semibold mb-1 text-gray-800">{hoveredMeta.title || "Unknown Title"}</h3>
            <p className="text-gray-600 italic">{hoveredMeta.author || "Unknown Author"}</p>
            <p className="text-gray-600">{hoveredMeta.year || "Unknown Year"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
