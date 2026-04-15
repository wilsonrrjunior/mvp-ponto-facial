import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const pageStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  padding: '2rem',
  gap: '2rem',
};

const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  width: '45%',
};

const webcamContainerStyle = {
  width: '100%',
  maxWidth: '500px',
  height: 'auto',
  aspectRatio: '4 / 3',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  background: '#2c2c3e',
};

const baseButtonStyle = {
  border: 'none',
  padding: '0.8rem 2rem',
  borderRadius: '8px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s',
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  background: '#e94560',
  color: 'white',
  boxShadow: '0 4px 10px rgba(233, 69, 96, 0.3)',
};

const dangerButtonStyle = {
  ...baseButtonStyle,
  background: '#ff5555',
  color: 'white',
  boxShadow: '0 4px 10px rgba(255, 85, 85, 0.3)',
  fontSize: '0.9rem',
  padding: '0.4rem 1rem',
};

const inputStyle = {
  width: '100%',
  maxWidth: '500px',
  padding: '0.8rem 1.2rem',
  borderRadius: '8px',
  border: '2px solid #2c2c3e',
  background: '#1a1a2e',
  color: '#e0e0f0',
  fontSize: '1rem',
};

const listContainerStyle = {
  width: '100%',
  background: '#1a1a2e',
  borderRadius: '12px',
  padding: '1.5rem',
};

const listItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.8rem 0',
  borderBottom: '1px solid #2c2c3e',
};

const Cadastro = () => {
  const webcamRef = useRef(null);
  const [nome, setNome] = useState('');
  const [funcionarios, setFuncionarios] = useState({});
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchFuncionarios = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/funcionarios`);
      setFuncionarios(response.data);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    }
  }, []);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  const showFeedback = (message, type) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const cadastrar = useCallback(async () => {
    if (!nome.trim()) {
      showFeedback('Por favor, insira um nome.', 'error');
      return;
    }
    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      showFeedback('Não foi possível capturar a imagem.', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/cadastrar`, { nome, imagem: imageSrc });
      showFeedback(response.data.mensagem, 'success');
      setNome('');
      fetchFuncionarios();
    } catch (error) {
      const detail = error.response?.data?.detail || 'Erro ao cadastrar.';
      showFeedback(detail, 'error');
    } finally {
      setLoading(false);
    }
  }, [nome, fetchFuncionarios]);

  const deletar = async (nomeFuncionario) => {
    if (window.confirm(`Tem certeza que deseja remover ${nomeFuncionario}?`)) {
      try {
        await axios.delete(`${API_URL}/funcionarios/${nomeFuncionario}`);
        showFeedback(`${nomeFuncionario} removido com sucesso.`, 'success');
        fetchFuncionarios();
      } catch (error) {
        showFeedback('Erro ao remover funcionário.', 'error');
      }
    }
  };

  return (
    <div style={pageStyle}>
      <div style={columnStyle}>
        <h1 style={{ fontSize: '2.5rem', color: '#e0e0f0' }}>Cadastro de Funcionários</h1>
        <div style={webcamContainerStyle}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
          />
        </div>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Funcionário"
          style={inputStyle}
        />
        <button onClick={cadastrar} style={primaryButtonStyle} disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Foto'}
        </button>
        {feedback.message && (
          <p style={{ color: feedback.type === 'success' ? '#50fa7b' : '#ff5555' }}>
            {feedback.message}
          </p>
        )}
      </div>

      <div style={columnStyle}>
        <h2 style={{ fontSize: '2rem' }}>Funcionários Cadastrados</h2>
        <div style={listContainerStyle}>
          {Object.keys(funcionarios).length === 0 ? (
            <p>Nenhum funcionário cadastrado.</p>
          ) : (
            Object.entries(funcionarios).map(([nome, data]) => (
              <div key={nome} style={listItemStyle}>
                <span>
                  {nome} ({data.total_fotos} foto(s))
                </span>
                <button onClick={() => deletar(nome)} style={dangerButtonStyle}>
                  Remover
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
