import React from 'react'

const ErrorComponent = ({ errors, setCurrentStep }) => {
  // Convert errors to array if it's an object
  const errorArray = Array.isArray(errors) 
    ? errors 
    : Object.values(errors || {}).map(value => ({ message: value }));

  const hasErrors = errorArray.length > 0;

  return (
    <div className="space-y-4 my-10">
      <h3 className="text-2xl font-bold text-gray-900">Något gick fel</h3>
      <p className="text-gray-600">Ett fel uppstod och vi kunde inte behandla din förfrågan.</p>
      <p className="text-gray-600">Vänligen försök igen eller kontakta support om problemet kvarstår.</p>
     
      {hasErrors && (
        <>
          <h4 className="text-xl font-bold text-gray-900">Felmeddelande</h4>
          {errorArray.map((e, i) => (
            <p key={i} className="text-red-500">
              {e.message || 'Ett okänt fel uppstod'}
            </p>
          ))}
        </>
      )}
    </div>
  )
}

export default ErrorComponent