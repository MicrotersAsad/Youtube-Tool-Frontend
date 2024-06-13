import React from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((star, i) => {
        const ratingValue = i + 1;
        return (
          <label key={i}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => setRating(ratingValue)}
              className="hidden"
            />
            <FaStar
              size={24}
              color={ratingValue <= rating ? "#ffc107" : "#e4e5e9"}
              className="cursor-pointer"
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;
