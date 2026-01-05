import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import "./Layout.css";

export default function Layout() {
    return (
        <div className="layout-container">
            <Header />

            <section className="main-section">
                <Sidebar />
                <article className="content-area">
                    {/* Render child route components here */}
                    <Outlet />
                </article>
            </section>

            <Footer />
        </div>
    );
}
