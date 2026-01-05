export default function MyButton(props) {
    const { title, onClick, type = "submit" } = props;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={props.disabled}
            className="my-btn"
            style={{ backgroundColor: "#6b83eeff", borderRadius: "5px", color: "white", cursor: "pointer" }}
        >
            {title}
        </button>
    );
}
