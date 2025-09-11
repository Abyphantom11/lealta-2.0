// Componente temporal para probar el ascenso de nivel
import React, { useState } from 'react';

const TestLevelUp = () => {
  const [showAnimation, setShowAnimation] = useState(false);

  const triggerLevelUp = () => {
    setShowAnimation(true);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-blue-600 rounded-lg">
      <button 
        onClick={triggerLevelUp}
        className="bg-white text-blue-600 px-4 py-2 rounded font-bold"
      >
        🧪 Test Level Up
      </button>
      
      {showAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">¡Ascendiste!</h2>
            <p className="mb-4">De Bronce a Plata</p>
            <button 
              onClick={() => {
                setShowAnimation(false);
                // Simular el mismo comportamiento que el Dashboard real
                setTimeout(() => {
                  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches;
                  if (!isPWAInstalled) {
                    alert('Aquí aparecería el popup PWA');
                  }
                }, 300);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded"
            >
              ¡Continuar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestLevelUp;
