import { FaStar } from "react-icons/fa";

export default function StarRating({
  rating,
  setRating,
  size = 20,
  activeColor = "#fbbf24",
  inactiveColor = "#d1d5db",
}) {
 const handleClick = (star) => {
  setRating((prev) => (prev === star ? star - 1 : star));
};

  return (
    <div
      className="d-flex align-items-center"
      style={{ gap: "4px" }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={size}
          color={star <= rating ? activeColor : inactiveColor}
          onClick={() => handleClick(star)}
          style={{
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}