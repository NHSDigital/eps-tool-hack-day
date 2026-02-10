
import { Button } from "nhsuk-react-components";
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { useRef, useEffect, useState } from "react";

interface PrescriptionViewerProps {
    result: any;
    setResult: (result: any) => void;
    onBack: () => void;
}

export default function PrescriptionViewer({ result, setResult, onBack }: PrescriptionViewerProps) {
    const embedRef = useRef<HTMLIFrameElement>(null);
    const jsonViewRef = useRef<HTMLDivElement>(null);
    const [highlightPath, setHighlightPath] = useState<string | null>(null);

    const sendToEmbed = (data: any) => {
        if (embedRef.current) {
            console.log("Sending to embed");
            // Use the provided data directly
            const json = JSON.stringify(data || result);
            const options = {
                theme: "light",
                direction: "RIGHT",
            };
            embedRef.current.contentWindow?.postMessage(
                {
                    json,
                    options,
                },
                "*"
            );
        } else {
            console.warn("Embed ref is null");
        }
    };

    const scrollToPath = (path: string) => {
        if (!jsonViewRef.current) return;

        // Clean up the path to match what might be visible
        // path comes from JsonCrack as "object.entry[0].resource.id" etc.
        // We want to scroll to the LAST part of the path (the leaf node or key)

        // Example: "entry[0].resource.resourceType" -> "resourceType"
        const parts = path.split('.');
        let lastPart = parts[parts.length - 1];

        // Remove array indices like "[0]" from the key name
        lastPart = lastPart.replace(/\[\d+\]/g, '');

        // Find all potential matches
        // Optimization: Query only property elements to reduce iteration count
        // react18-json-view uses specific classes for properties
        const elements = jsonViewRef.current.querySelectorAll('.json-view--property');
        let targetElement: Element | null = null;

        // specific implementation details: react18-json-view often puts quotes around keys in some themes, or not.
        // We look for exact text match of the key.
        for (const el of Array.from(elements)) {
            const text = el.textContent;
            // Properties usually don't have quotes in the textContent if styled via CSS content, 
            // but let's check both raw and quoted just in case.
            if (text === `"${lastPart}"` || text === lastPart) {
                targetElement = el;
                break;
            }
        }

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add a temporary highlight class
            targetElement.classList.add('highlight-pulse');
            setTimeout(() => {
                targetElement?.classList.remove('highlight-pulse');
            }, 2000);
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // console.log("Rx msg:", event.data);
            if (event.data && event.data.jsoncrackEmbedLoaded) {
                console.log("Embed loaded, sending JSON");
                sendToEmbed(result);
            }

            // Handle node click from JsonCrack
            if (event.data && event.data.event === 'nodeClick') {
                console.log("Node clicked:", event.data);
                const node = event.data.node;

                if (node) {
                    // 1. Copy text content (value) to clipboard
                    // The 'value' might be in node.value or node.text or similar depending on JsonCrack version
                    // We'll try a few common properties or stringify the node if it's an object.

                    let textToCopy = "";
                    if (typeof node === 'object') {
                        // If it's a leaf node, it might have a value property
                        if ('value' in node) {
                            textToCopy = String(node.value);
                        } else if ('text' in node) {
                            textToCopy = String(node.text);
                        } else {
                            // It's a container node, stringify it
                            textToCopy = JSON.stringify(node);
                        }
                    } else {
                        textToCopy = String(node);
                    }

                    if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy)
                            .then(() => console.log("Copied to clipboard:", textToCopy))
                            .catch(err => console.error("Failed to copy:", err));
                    }

                    // 2. Navigation / Scroll
                    // Use the path provided in the event
                    if (event.data.path) {
                        scrollToPath(event.data.path);
                    }
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const timer = setTimeout(() => {
            if (result) {
                console.log("Debounced update triggered");
                sendToEmbed(result);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="nhsuk-grid-column-full">
            <h1>Prescription Created</h1>
            <Button onClick={onBack} style={{ marginBottom: "20px" }}>
                Back to Home
            </Button>

            <div style={{ display: "grid", gridTemplateColumns: "35% 65%", gridTemplateRows: "auto 1fr", gap: "20px", height: "85vh" }}>

                {/* Header Left */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Bundle JSON</h3>
                </div>

                {/* Header Right */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Visualiser</h3>
                </div>

                {/* Content Left */}
                <div
                    ref={jsonViewRef}
                    style={{ border: "1px solid #ccc", display: "flex", flexDirection: "column", overflow: "auto", background: "#fff" }}
                >
                    <JsonView
                        src={result}
                        theme="default"
                        editable={true}
                        onChange={() => {
                            // Trigger re-render to activate debounce
                            setResult({ ...result });
                        }}
                        onEdit={() => setResult({ ...result })}
                        onAdd={() => setResult({ ...result })}
                        onDelete={() => setResult({ ...result })}
                    />
                </div>

                {/* Content Right */}
                <div style={{ border: "1px solid #ccc" }}>
                    <iframe
                        ref={embedRef}
                        id="jsoncrackEmbed"
                        title="JsonCrack Embed"
                        src="https://jsoncrack.com/widget"
                        width="120%"
                        height="100%"
                        style={{ border: "none" }}
                        sandbox="allow-scripts allow-same-origin"
                        allow="clipboard-read; clipboard-write"
                        onLoad={() => {
                            console.log("Iframe loaded, triggering send");
                            sendToEmbed(result);
                        }}
                    ></iframe>
                </div>
            </div>

        </div>
    );
}
