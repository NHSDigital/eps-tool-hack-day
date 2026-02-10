import { Header } from "nhsuk-react-components";

export default function AppHeader() {
    return (
        // @ts-expect-error - Header types mismatch with React 19
        <Header>
            <Header.Container>
                <div className="nhsuk-header__logo">
                    <a className="nhsuk-header__link" href="/" aria-label="NHS homepage">
                        <img src="/site/nhs-rebranded.png" alt="NHS Rebranded" style={{ height: "50px" }} />
                    </a>
                </div>
            </Header.Container>
        </Header>
    );
}
