import MyButton from "./MyButtons";

export default function Pagination({
    currentPage,
    totalPages,
    onPrev,
    onNext
}) {
    return (
        <div className="pagination">
            <MyButton
                title="Previous"
                disabled={currentPage <= 1}
                onClick={onPrev}
                type="button"
            />

            <span className="page-info">
                Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
            </span>

            <MyButton
                title="Next"
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={onNext}
                type="button"
            />
        </div>
    );
}
