import { Header, Container, Button } from "nhsuk-react-components";

export function meta() {
  return [
    { title: "NHS EPS Tool" },
    { name: "description", content: "Create a prescription" },
  ];
}

export default function Home() {
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
              <Button
                onClick={() =>
                  fetch(
                    "https://hackapp-pr-11.dev.eps.national.nhs.uk/api/create",
                    { method: "POST" }
                  )
                }
              >
                Create a prescription
              </Button>
            </div>
          </div>
        </main>
      </Container>
    </>
  );
}
