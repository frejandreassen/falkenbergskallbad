import React, { useState, useEffect } from 'react';
import { getTemperature } from "@/lib/actions";
function formatTemperature(tempString) {
  const temp = parseFloat(tempString); // Convert string to float
  const formatter = new Intl.NumberFormat('sv-SE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
  });
  return formatter.format(temp); // Format according to Swedish standards
}

export function Temperature() {
  const [temperature, setTemperature] = useState(null);

  useEffect(() => {
    const fetchTemperature = async () => {
      const temp = await getTemperature();
      setTemperature(temp);
    };

    fetchTemperature();
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="flex items-center space-x-2">
      <ThermometerIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <div className="text-2xl font-semibold leading-none -translate-y-px">
        {temperature !== null ? (
          <>
            {formatTemperature(temperature)}
            <span className="text-base font-medium translate-y-0.5">°C</span>
          </>
        ) : (
          <span>...</span> // Display loading or similar text while fetching
        )}
      </div>
    </div>
  );
}

function ThermometerIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>)
  );
}
