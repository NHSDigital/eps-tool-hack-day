import { Button } from "nhsuk-react-components";
import Spinner from "./Spinner";

interface CreatePrescriptionProps {
    loading: boolean;
    statusMessage: string;
    onCreate: () => void;
}

export default function CreatePrescription({ loading, statusMessage, onCreate }: CreatePrescriptionProps) {
    return (
        <div className="nhsuk-grid-column-two-thirds">
            <h1>EPS Tool Hack Day</h1>

            {!loading && (
                <Button onClick={onCreate}>
                    Create a prescription
                </Button>
            )}

            {loading && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Spinner />
                    <p>hint: {statusMessage}</p>
                </div>
            )}
        </div>
    );
}
