import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRetoolState } from "@tryretool/custom-component-support";

export const FindInPage: React.FC = () => {
    const [content] = useRetoolState<string>("content", "<p>Your content goes here. Any text in this area will be searchable.</p>");

    const [query, setQuery] = useState("");
    const [matchCount, setMatchCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const contentRef = useRef<HTMLDivElement>(null);
    const matchesRef = useRef<HTMLElement[]>([]);
    const originalHTMLRef = useRef<string | null>(null);

    useEffect(() => {
        originalHTMLRef.current = content;
        if (contentRef.current) {
            contentRef.current.innerHTML = content;
        }
        matchesRef.current = [];
        setMatchCount(0);
        setCurrentIndex(-1);
        setQuery("");
    }, [content]);

    const focusMatch = (idx: number) => {
        matchesRef.current.forEach((m, i) => {
            m.style.background = i === idx ? "#FF9500" : "#FFE566";
            m.style.color = i === idx ? "#fff" : "#1a1600";
            m.style.outline = i === idx ? "2px solid #FF9500" : "none";
        });
        matchesRef.current[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setCurrentIndex(idx);
    };

    const highlight = useCallback((term: string) => {
        if (!contentRef.current || !originalHTMLRef.current) return;
        contentRef.current.innerHTML = originalHTMLRef.current;
        matchesRef.current = [];

        if (!term.trim()) {
            setMatchCount(0);
            setCurrentIndex(-1);
            return;
        }

        const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

        function walk(node: Node) {
            if (node.nodeType === 3) {
                const txt = node.textContent ?? "";
                re.lastIndex = 0;
                if (!re.test(txt)) return;
                re.lastIndex = 0;
                const frag = document.createDocumentFragment();
                let last = 0;
                let m: RegExpExecArray | null;
                while ((m = re.exec(txt)) !== null) {
                    if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
                    const mark = document.createElement("mark");
                    mark.textContent = m[0];
                    mark.style.cssText = "background:#FFE566;color:#1a1600;border-radius:2px;padding:0 1px;";
                    frag.appendChild(mark);
                    matchesRef.current.push(mark);
                    last = re.lastIndex;
                }
                if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
                node.parentNode?.replaceChild(frag, node);
            } else if (node.nodeType === 1 && node.nodeName !== "MARK") {
                Array.from(node.childNodes).forEach(walk);
            }
        }
        walk(contentRef.current);

        const count = matchesRef.current.length;
        setMatchCount(count);
        if (count > 0) {
            focusMatch(0);
        } else {
            setCurrentIndex(-1);
        }
    }, []);

    const next = () => {
        if (!matchesRef.current.length) return;
        focusMatch((currentIndex + 1) % matchesRef.current.length);
    };

    const prev = () => {
        if (!matchesRef.current.length) return;
        focusMatch(currentIndex <= 0 ? matchesRef.current.length - 1 : currentIndex - 1);
    };

    return (
        <div style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, background: "#fff" }}>
                <span style={{ color: "#888" }}>🔍</span>
                <input
                    aria-label="Search text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); highlight(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.shiftKey ? prev() : next(); }}
                    placeholder="Find in page…"
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 14 }}
                />
                <span
                    aria-live="polite"
                    style={{ fontSize: 12, color: matchCount === 0 && query ? "#c0392b" : "#888", whiteSpace: "nowrap", minWidth: 64, textAlign: "right" }}
                >
                    {query ? (matchCount === 0 ? "no results" : `${currentIndex + 1} / ${matchCount}`) : ""}
                </span>
                <button aria-label="Previous match" onClick={prev} disabled={matchCount === 0} style={{ border: "1px solid #e0e0e0", borderRadius: 5, background: "none", padding: "3px 8px", cursor: "pointer" }}>↑</button>
                <button aria-label="Next match" onClick={next} disabled={matchCount === 0} style={{ border: "1px solid #e0e0e0", borderRadius: 5, background: "none", padding: "3px 8px", cursor: "pointer" }}>↓</button>
            </div>

            <div ref={contentRef} style={{ lineHeight: 1.8, fontSize: 14 }} />
        </div>
    );
};