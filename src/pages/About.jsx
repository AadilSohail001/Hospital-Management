export default function About() {
    return (
        <>
            <h2>About Us</h2>
            <div className="about-content">
                <p>Welcome to our website. We are dedicated to providing the best user experience with our application.</p>

                <div className="about-section">
                    <h3>Our Mission</h3>
                    <p>To create intuitive and efficient tools that help users manage their data securely and effectively.</p>
                </div>

                <div className="about-section">
                    <h3>Our Vision</h3>
                    <p>To be the leading platform for user management and data security solutions.</p>
                </div>

                <div className="about-section">
                    <h3>Our Values</h3>
                    <ul>
                        <li>User-Centric Design</li>
                        <li>Security First</li>
                        <li>Continuous Improvement</li>
                        <li>Transparency and Trust</li>
                    </ul>
                </div>
            </div>
        </>
    );
}