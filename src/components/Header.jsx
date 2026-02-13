export default function Header() {

    const styles = {
        header: {
            display: "flex",
            alignItems: "center",
            padding: "15px 17px",
            backgroundColor: "#d9dbef85",
            color: "#fff",
        },
        logo: {
            height: "60px",
            width: "auto",
            marginRight: "20px",
        },
        content: {
            display: "flex",
            flexDirection: "column",
        },
        title: {
            margin: 0,
            fontSize: "24px",
        },
        subtitle: {
            margin: 0,
            fontSize: "14px",
        }
    };

    return (
        <header style={styles.header}>
            <img
                src="https://s3storage.nayatel.com/customer-shifa/uploads/Shifa_Logo_f0b37af56f.webp"
                alt="Shifa International Hospital Logo"
                style={styles.logo}
            />

            <div style={styles.content}>

            </div>
        </header>
    );
}
