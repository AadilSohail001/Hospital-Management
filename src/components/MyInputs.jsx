export default function MyInput({
    type = "text",
    placeholder,
    name,
    value,
    onChange,
    required = false
}) {
    const sharedColor = "#afcbddff";

    return (
        <input
            type={type}
            placeholder={placeholder}
            name={name}
            value={value || ""}
            onChange={onChange}
            required={required}
            className="my-input"
            style={{
                background: sharedColor,
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '10px'
            }}
        />
    );
}