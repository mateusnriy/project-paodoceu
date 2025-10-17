import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div
    style={{ width: size, height: size }}
    className="border-t-2 border-b-2 border-primary rounded-full animate-spin"
  ></div>
);
