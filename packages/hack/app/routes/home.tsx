import { Container } from "nhsuk-react-components";
import { useState } from "react";
import AppHeader from "../components/AppHeader";
import CreatePrescription from "../components/CreatePrescription";
import PrescriptionViewer from "../components/PrescriptionViewer";

export function meta() {
  return [
    { title: "NHS EPS Tool" },
    { name: "description", content: "Create a prescription" },
  ];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

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

  if (result) {
    return (
      <>
        <AppHeader />
        <Container>
          <main className="nhsuk-main-wrapper" id="maincontent" role="main" style={{ maxWidth: "96%", margin: "0 auto" }}>
            <div className="nhsuk-grid-row">
              <div className="nhsuk-grid-column-full">
                <PrescriptionViewer
                  result={result}
                  setResult={setResult}
                  onBack={handleBack}
                />
              </div>
            </div>
          </main>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <Container>
        <main className="nhsuk-main-wrapper" id="maincontent" role="main">
          <div className="nhsuk-grid-row">
            <CreatePrescription
              loading={loading}
              statusMessage={statusMessage}
              onCreate={handleCreatePrescription}
            />
          </div>
        </main>
      </Container>
    </>
  );
}
