import { Icon } from '@iconify/react';
import "../styles/Contact.css"

export default function Contact() {
    return (
        <>
            <h2>Contact Us</h2>
            <p className="subtitle">Feel free to reach out to us through the following channels:</p>

            <div className="contact-grid">
                <div className="contact-card">
                    <div className="contact-icon">
                        <Icon icon="line-md:phone-call-loop" width="32" height="32" style={{ color: '#60bb56' }} />
                    </div>
                    <h3>Phone</h3>
                    <p className="contact-detail">+1 (555) 123-4567</p>
                    <p className="contact-time">Available: Mon-Fri, 9AM-6PM EST</p>
                </div>

                <div className="contact-card">
                    <div className="contact-icon">
                        <Icon icon="streamline-emojis:e-mail-2" width="42" height="42" />
                    </div>
                    <h3>Email</h3>
                    <p className="contact-detail">support@example.com</p>
                    <p className="contact-detail">info@example.com</p>
                    <p className="contact-time">Response within 24 hours</p>
                </div>

                <div className="contact-card">
                    <div className="contact-icon">
                        <Icon icon="entypo:address" width="28" height="28" style={{ color: '#49b760' }} />
                    </div>
                    <h3>Office Address</h3>
                    <p className="contact-detail">123 Tech Street</p>
                    <p className="contact-detail">Suite 500</p>
                    <p className="contact-detail">San Francisco, CA 94107</p>
                </div>
            </div>
        </>
    );
}