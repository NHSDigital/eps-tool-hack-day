import { Header, Container, Button } from "nhsuk-react-components";
import { useState, useRef, useEffect } from "react";
import Spinner from "../components/Spinner";

export function meta() {
  return [
    { title: "NHS EPS Tool" },
    { name: "description", content: "Create a prescription" },
  ];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [jsonString, setJsonString] = useState("");

  useEffect(() => {
    if (result) {
      setJsonString(JSON.stringify(result, null, 2));
    }
  }, [result]);

  const pollStatus = async (id: string) => {
    // Simulate processing state
    setStatusMessage("We found the patient, creating a prescription...");

    // Wait for 2 seconds to simulate processing time
    setTimeout(async () => {
      try {
        // Fetch the mock response
        const response = await fetch("/site/mock.json");
        const bundle = await response.json();
        console.log("Mock Poll response:", bundle);

        setResult(bundle);
        setLoading(false);
      } catch (error) {
        console.error("Polling error:", error);
        setStatusMessage("Error polling status");
        setLoading(false);
      }
    }, 2000);
  };

  const handleCreatePrescription = () => {
    setLoading(true);
    setStatusMessage("Creating prescription...");

    // Mock API call delay
    setTimeout(() => {
      const mockId = "MOCK_ID_" + Math.floor(Math.random() * 1000);
      setPrescriptionId(mockId);
      // Start polling
      pollStatus(mockId);
    }, 2000);
  };

  const handleBack = () => {
    setLoading(false);
    setResult(null);
    setPrescriptionId(null);
    setStatusMessage("");
  };



  const embedRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.jsoncrackEmbedLoaded) {
        sendToEmbed(jsonString);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [jsonString]);

  const sendToEmbed = (j: string) => {
    if (embedRef.current) {
      // Use the provided string directly, or stringify the result object if no string is provided
      const json = j || JSON.stringify(result);
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
    }
  };

  if (result) {
    return (
      <>
        {/* @ts-expect-error - Header types mismatch with React 19 */}
        <Header>
          <Header.Container>
            <div className="nhsuk-header__logo">
              <a className="nhsuk-header__link" href="/" aria-label="NHS homepage">
                <img src="/site/nhs-rebranded.png" alt="NHS Rebranded" style={{ height: "50px" }} />
              </a>
            </div>
          </Header.Container>
        </Header>
        <Container>
          <main className="nhsuk-main-wrapper" id="maincontent" role="main" style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="nhsuk-grid-row">
              <div className="nhsuk-grid-column-full">
                <h1>Prescription Created</h1>
                <Button onClick={handleBack} style={{ marginBottom: "20px" }}>
                  Back to Home
                </Button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr", gap: "20px", height: "600px" }}>

                  {/* Header Left */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Bundle JSON</h3>
                  </div>

                  {/* Header Right */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Visualiser</h3>
                  </div>

                  {/* Content Left */}
                  <div style={{ border: "1px solid #ccc", display: "flex", flexDirection: "column" }}>
                    <textarea
                      style={{
                        flex: 1,
                        width: "100%",
                        resize: "none",
                        padding: "10px",
                        fontFamily: "monospace",
                        border: "none",
                        outline: "none",
                        backgroundColor: "#f0f0f0"
                      }}
                      value={jsonString}
                      onChange={(e) => setJsonString(e.target.value)}
                    />
                  </div>

                  {/* Content Right */}
                  <div style={{ border: "1px solid #ccc" }}>
                    <iframe
                      ref={embedRef}
                      id="jsoncrackEmbed"
                      src="https://jsoncrack.com/widget"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    ></iframe>
                  </div>
                </div>

              </div>
            </div>
          </main>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* @ts-expect-error - Header types mismatch with React 19 */}
      <Header>
        <Header.Container>
          <div className="nhsuk-header__logo">
            <a className="nhsuk-header__link" href="/" aria-label="NHS homepage">
              <img src="/site/nhs-rebranded.png" alt="NHS Rebranded" style={{ height: "50px" }} />
            </a>
          </div>
        </Header.Container>
      </Header>
      <Container>
        <main className="nhsuk-main-wrapper" id="maincontent" role="main">
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-two-thirds">
              <h1>EPS Tool Hack Day</h1>

              {!loading && (
                <Button onClick={handleCreatePrescription}>
                  Create a prescription
                </Button>
              )}

              {loading && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Spinner message={statusMessage} />
                </div>
              )}
            </div>
          </div>
        </main>
      </Container>
    </>
  );
}
