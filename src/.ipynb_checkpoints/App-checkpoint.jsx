import { useEffect, useState } from "react";
import "./assets/styles.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading corpus data...");
  const [results, setResults] = useState([]);
  const [metadata, setMetadata] = useState([]);
const [hoveredMeta, setHoveredMeta] = useState(null);
const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchCorpus = async () => {
      try {
        const res = await fetch(`/corpus.json?v=${Date.now()}`);
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

  const performSearch = async () => {
    if (!query) return alert("Enter search term");
    if (!metadata.length) return alert("Corpus not loaded");

    setStatus("Searching...");
    setResults([]);

    const urns = metadata.map(m => m.urn);
    const body = {
      urns,
      query,
      limit: 1000,
      window: 20,
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
    }
  };



    
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ImagiNation Concordances</h1>
      <div className="input-group mb-3" style={{ maxWidth: 400, margin: "0 auto" }}>
        <input
          type="text"
          className="form-control"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && performSearch()}
          placeholder="e.g. Norge"
        />
        <button className="btn btn-primary" onClick={performSearch}>
          Search
        </button>
      </div>
      <div className="border p-3" style={{ overflowY: "auto", height: "60vh" }}>
        <div style={{ fontSize: 12, marginBottom: 10, color: "#555" }}>{status}</div>
    
{results.map(({ text, urn }, i) => {
  const meta = metadata.find(m => m.urn === urn);

  return (
    <div
      key={i}
      className="concordance"
      onClick={() =>
        window.open(
          `https://www.nb.no/items/${urn}?searchText="${encodeURIComponent(
            [...text.matchAll(/<b>(.*?)<\/b>/g)].map(m => m[1]).join(" ")
          )}"~${[...text.matchAll(/<b>(.*?)<\/b>/g)].length}`,
          "_blank"
        )
      }
      onMouseEnter={e => {
        setHoveredMeta(meta);
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ x: rect.left, y: rect.bottom + window.scrollY + 5 });
      }}
      onMouseLeave={() => setHoveredMeta(null)}
    >
      <p dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
})}
          {hoveredMeta && (
  <div
    style={{
      position: "absolute",
      left: tooltipPos.x,
      top: tooltipPos.y,
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      padding: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      zIndex: 1000
    }}
  >
    <strong>{hoveredMeta.title || "Unknown Title"}</strong><br />
    <em>{hoveredMeta.author || "Unknown Author"}</em><br />
    <span>{hoveredMeta.year || "Unknown Year"}</span>
  </div>
)}

      </div>
    </div>
  );
}
