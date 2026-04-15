import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem',
  gap: '1.5rem',
};

const webcamContainerStyle = {
  width: '640px',
  height: '480px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  background: '#2c2c3e',
};

const buttonStyle = {
  background: '#e94560',
  color: 'white',
  border: 'none',
  padding: '1rem 2.5rem',
  borderRadius: '8px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s',
  boxShadow: '0 4px 10px rgba(233, 69, 96, 0.3)',
};

const resultStyle = {
  marginTop: '1rem',
  padding: '1.5rem',
  borderRadius: '12px',
  background: '#1a1a2e',
  width: '640px',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const successStyle = {
  ...resultStyle,
  border: '2px solid #50fa7b',
};

const errorStyle = {
  ...resultStyle,
  border: '2px solid #ff5555',
};

const Reconhecer = () => {
  const webcamRef = useRef(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const capturar = useCallback(async () => {
    setLoading(true);
    setResultado(null);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setResultado({ reconhecido: false, motivo: 'Não foi possível capturar a imagem.' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/reconhecer`, { imagem: imageSrc });
      setResultado(response.data);
    } catch (error) {
      const detail = error.response?.data?.detail || 'Erro ao conectar ao servidor.';
      setResultado({ reconhecido: false, motivo: detail });
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2.5rem', color: '#e0e0f0' }}>Reconhecimento Facial</h1>
      <div style={webcamContainerStyle}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
        />
      </div>
      <button onClick={capturar} style={buttonStyle} disabled={loading}>
        {loading ? 'Processando...' : 'Bater Ponto'}
      </button>

      {resultado && (
        <div style={resultado.reconhecido ? successStyle : errorStyle}>
          {resultado.reconhecido ? (
            <>
              <h2 style={{ color: '#50fa7b' }}>Ponto Registrado!</h2>
              <p style={{ fontSize: '1.2rem' }}><strong>Funcionário:</strong> {resultado.nome}</p>
              <p><strong>Confiança:</strong> {resultado.confianca}%</p>
              <p><strong>Horário:</strong> {resultado.horario}</p>
            </>
          ) : (
            <>
              <h2 style={{ color: '#ff5555' }}>Falha no Reconhecimento</h2>
              <p style={{ fontSize: '1.2rem' }}><strong>Motivo:</strong> {resultado.motivo}</p>
              {resultado.confianca && <p><strong>Confiança:</strong> {resultado.confianca}%</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reconhecer;
