import React, { useRef, useCallback, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API = ''

const videoConstraints = { width: 640, height: 480, facingMode: 'user' }

export default function Reconhecer() {
  const webcamRef  = useRef(null)
  const intervalRef = useRef(null)
  const [resultado, setResultado] = useState(null)
  const [scanning,  setScanning]  = useState(false)
  const [camReady,  setCamReady]  = useState(false)
  const [error,     setError]     = useState(null)

  const capture = useCallback(async () => {
    if (!webcamRef.current) return
    const img = webcamRef.current.getScreenshot()
    if (!img) return
    try {
      const { data } = await axios.post(`${API}/reconhecer`, { imagem: img })
      setResultado(data)
      if (data.reconhecido) stopScan()
    } catch { }
  }, [])

  const startScan = useCallback(() => {
    setResultado(null)
    setError(null)
    setScanning(true)
    intervalRef.current = setInterval(capture, 1200)
  }, [capture])

  const stopScan = useCallback(() => {
    setScanning(false)
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const isSuccess = resultado?.reconhecido

  return (
    <div style={s.page}>
      <div style={s.wrapper}>

        {/* ── Header ───────────────────────────────────── */}
        <div style={s.pageHeader}>
          <div style={s.pageHeaderLeft}>
            <div style={s.statusRing(scanning)}>
              <div style={s.statusDot(scanning)} />
            </div>
            <div>
              <h1 style={s.pageTitle}>Reconhecimento Facial</h1>
              <p style={s.pageSubtitle}>
                {scanning ? 'Analisando rosto em tempo real…' : 'Pronto para identificar funcionários'}
              </p>
            </div>
          </div>
        </div>

        <div style={s.twoCol}>
          {/* ── Camera ───────────────────────────────────── */}
          <div style={s.card}>
            <div style={s.cameraShell}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.85}
                videoConstraints={videoConstraints}
                onUserMedia={() => setCamReady(true)}
                onUserMediaError={() => setError('Câmera não encontrada. Verifique as permissões do navegador.')}
                style={s.video}
                mirrored
              />
              {/* Corner brackets */}
              {['tl','tr','bl','br'].map(c => <div key={c} style={s.corner(c, scanning)} />)}
              {/* Scan line */}
              {scanning && <div style={s.scanLine} />}
              {/* Result overlay */}
              {resultado && (
                <div style={s.resultOverlay(isSuccess)}>
                  <span style={s.resultIcon}>{isSuccess ? '✓' : '✕'}</span>
                </div>
              )}
            </div>

            {error && <div style={s.errorBanner}><span>⚠</span> {error}</div>}

            <div style={s.camControls}>
              {!scanning ? (
                <button style={s.btnPrimary(camReady)} onClick={startScan} disabled={!camReady}>
                  <span style={s.btnIcon}>▶</span> Iniciar Reconhecimento
                </button>
              ) : (
                <button style={s.btnDanger} onClick={stopScan}>
                  <span style={s.btnIcon}>⏹</span> Parar
                </button>
              )}
            </div>
          </div>

          {/* ── Result panel ─────────────────────────────── */}
          <div style={s.card}>
            <p style={s.panelLabel}>Resultado</p>

            {!resultado && (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    <path d="M15 3.5C16.7 4.2 18 5.9 18 8" strokeLinecap="round"/>
                    <path d="M9 3.5C7.3 4.2 6 5.9 6 8"  strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={s.emptyText}>Nenhuma análise ainda</p>
                <p style={s.emptyHint}>Inicie o reconhecimento para identificar o funcionário</p>
              </div>
            )}

            {resultado && isSuccess && (
              <div style={{ ...s.resultCard, ...s.resultCardSuccess, animation: 'fadeUp 0.35s ease' }}>
                <div style={s.resultBadge('#05d98a')}>IDENTIFICADO</div>
                <div style={s.resultName}>{resultado.nome}</div>
                <div style={s.resultMeta}>
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Confiança</span>
                    <span style={s.metaValue('#60a5fa')}>{resultado.confianca}%</span>
                  </div>
                  <div style={s.metaDivider} />
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Horário</span>
                    <span style={s.metaValue('#e8f0fe')}>{resultado.horario}</span>
                  </div>
                </div>
                {/* Confidence bar */}
                <div style={s.confBar}>
                  <div style={s.confTrack}>
                    <div style={s.confFill(resultado.confianca, '#05d98a')} />
                  </div>
                  <span style={{ color: '#05d98a', fontSize: '0.78rem', fontWeight: 700 }}>{resultado.confianca}%</span>
                </div>
                <button style={s.btnGhost} onClick={() => { setResultado(null); startScan() }}>
                  Reconhecer outro
                </button>
              </div>
            )}

            {resultado && !isSuccess && (
              <div style={{ ...s.resultCard, ...s.resultCardFail, animation: 'fadeUp 0.35s ease' }}>
                <div style={s.resultBadge('#f04567')}>NÃO RECONHECIDO</div>
                <p style={{ color: '#8fafd8', fontSize: '0.92rem', marginTop: '0.5rem' }}>{resultado.motivo}</p>
                {resultado.confianca !== undefined && (
                  <div style={s.confBar}>
                    <div style={s.confTrack}>
                      <div style={s.confFill(resultado.confianca, '#f04567')} />
                    </div>
                    <span style={{ color: '#f04567', fontSize: '0.78rem', fontWeight: 700 }}>{resultado.confianca}%</span>
                  </div>
                )}
                <button style={s.btnGhost} onClick={() => { setResultado(null); startScan() }}>
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    justifyContent: 'center',
    padding: '2.5rem 1.5rem',
  },
  wrapper: {
    width: '100%',
    maxWidth: '1080px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.8rem',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statusRing: (active) => ({
    position: 'relative',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: active
      ? 'rgba(37,99,235,0.18)'
      : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? '0 0 16px rgba(37,99,235,0.3)' : 'none',
    transition: 'all 0.3s',
    flexShrink: 0,
  }),
  statusDot: (active) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: active ? '#3b82f6' : '#4a6a9a',
    boxShadow: active ? '0 0 8px #3b82f6' : 'none',
    transition: 'all 0.3s',
  }),
  pageTitle: {
    fontSize: '1.55rem',
    fontWeight: '800',
    color: '#e8f0fe',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '0.85rem',
    color: '#8fafd8',
    margin: 0,
    marginTop: '0.1rem',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  },
  card: {
    background: 'rgba(8,18,48,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(56,130,246,0.14)',
    borderRadius: '20px',
    padding: '1.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  cameraShell: {
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#000',
    aspectRatio: '4/3',
    border: '1px solid rgba(56,130,246,0.18)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  corner: (pos, active) => {
    const size = 18, thick = 2.5
    const color = active ? '#3b82f6' : 'rgba(56,130,246,0.4)'
    const base = {
      position: 'absolute', width: size, height: size,
      borderColor: color, borderStyle: 'solid', borderWidth: 0,
      transition: 'border-color 0.3s',
    }
    const map = {
      tl: { top: 10, left: 10, borderTopWidth: thick, borderLeftWidth: thick, borderTopLeftRadius: 4 },
      tr: { top: 10, right: 10, borderTopWidth: thick, borderRightWidth: thick, borderTopRightRadius: 4 },
      bl: { bottom: 10, left: 10, borderBottomWidth: thick, borderLeftWidth: thick, borderBottomLeftRadius: 4 },
      br: { bottom: 10, right: 10, borderBottomWidth: thick, borderRightWidth: thick, borderBottomRightRadius: 4 },
    }
    return { ...base, ...map[pos] }
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0, height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #00c2ff 50%, #3b82f6 70%, transparent 100%)',
    boxShadow: '0 0 10px #3b82f6, 0 0 20px rgba(59,130,246,0.4)',
    animation: 'scanDown 1.6s linear infinite',
    zIndex: 2,
  },
  resultOverlay: (success) => ({
    position: 'absolute', inset: 0,
    background: success ? 'rgba(5,217,138,0.12)' : 'rgba(240,69,103,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3,
    animation: 'fadeUp 0.3s ease',
  }),
  resultIcon: {
    fontSize: '4rem',
    lineHeight: 1,
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'rgba(240,69,103,0.1)',
    border: '1px solid rgba(240,69,103,0.25)',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    color: '#f04567',
    fontSize: '0.87rem',
  },
  camControls: {
    display: 'flex',
    gap: '0.8rem',
  },
  btnPrimary: (enabled) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.75rem 1.2rem',
    borderRadius: '12px', border: 'none',
    background: enabled
      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
      : 'rgba(255,255,255,0.06)',
    color: enabled ? '#fff' : '#4a6a9a',
    fontWeight: '700', fontSize: '0.95rem',
    cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? '0 4px 20px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
    transition: 'all 0.2s', fontFamily: 'inherit',
  }),
  btnDanger: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.75rem 1.2rem',
    borderRadius: '12px', border: 'none',
    background: 'linear-gradient(135deg, #f04567 0%, #c73054 100%)',
    color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(240,69,103,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  btnIcon: { fontSize: '0.85rem' },
  btnGhost: {
    marginTop: '0.4rem',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(56,130,246,0.2)',
    background: 'rgba(37,99,235,0.08)',
    color: '#60a5fa',
    fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  },
  panelLabel: {
    fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#4a6a9a', margin: 0,
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', padding: '2rem 1rem',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'rgba(37,99,235,0.1)',
    border: '1px solid rgba(56,130,246,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#4a6a9a',
  },
  emptyText: { color: '#8fafd8', fontWeight: '600', fontSize: '0.95rem' },
  emptyHint: { color: '#4a6a9a', fontSize: '0.82rem', lineHeight: 1.5 },
  resultCard: {
    display: 'flex', flexDirection: 'column', gap: '0.7rem',
    borderRadius: '14px', padding: '1.2rem',
  },
  resultCardSuccess: {
    background: 'rgba(5,217,138,0.06)',
    border: '1px solid rgba(5,217,138,0.2)',
  },
  resultCardFail: {
    background: 'rgba(240,69,103,0.06)',
    border: '1px solid rgba(240,69,103,0.2)',
  },
  resultBadge: (color) => ({
    display: 'inline-flex', alignItems: 'center',
    fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em',
    color, background: `${color}18`,
    border: `1px solid ${color}33`,
    padding: '0.25rem 0.7rem', borderRadius: '100px',
    alignSelf: 'flex-start',
  }),
  resultName: {
    fontSize: '1.7rem', fontWeight: '800',
    color: '#e8f0fe', letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  resultMeta: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  metaLabel: { fontSize: '0.72rem', color: '#4a6a9a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metaValue: (color) => ({ fontSize: '0.95rem', color, fontWeight: '700' }),
  metaDivider: { width: '1px', height: '28px', background: 'rgba(56,130,246,0.15)' },
  confBar: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  confTrack: {
    flex: 1, height: '5px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '100px', overflow: 'hidden',
  },
  confFill: (pct, color) => ({
    height: '100%', width: `${pct}%`,
    background: `linear-gradient(90deg, ${color}99, ${color})`,
    borderRadius: '100px', transition: 'width 0.5s ease',
  }),
}