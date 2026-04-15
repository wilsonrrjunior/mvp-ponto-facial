import React, { useRef, useCallback, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API = ''
const TOTAL = 5

const POSES = [
  { emoji: '😐', label: 'Frente', hint: 'Olhe diretamente para a câmera' },
  { emoji: '↙️', label: 'Esquerda', hint: 'Vire levemente para a esquerda' },
  { emoji: '↘️', label: 'Direita', hint: 'Vire levemente para a direita' },
  { emoji: '😊', label: 'Sorrindo', hint: 'Sorria naturalmente' },
  { emoji: '👆', label: 'Queixo alto', hint: 'Levante levemente o queixo' },
]

const videoConstraints = { width: 640, height: 480, facingMode: 'user' }

export default function Cadastro() {
  const webcamRef = useRef(null)
  const [nome, setNome] = useState('')
  const [camReady, setCamReady] = useState(false)
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [flash, setFlash] = useState(false)
  const [funcionarios, setFuncionarios] = useState({})

  const fetchFuncionarios = async () => {
    try { const { data } = await axios.get(`${API}/funcionarios`); setFuncionarios(data) } catch { }
  }
  useEffect(() => { fetchFuncionarios() }, [])

  const capturar = useCallback(() => {
    if (!webcamRef.current || fotos.length >= TOTAL) return
    const img = webcamRef.current.getScreenshot()
    if (!img) return
    setFlash(true)
    setTimeout(() => setFlash(false), 180)
    setFotos(p => [...p, img])
    setMsg(null)
  }, [fotos.length])

  const desfazer = () => setFotos(p => p.slice(0, -1))
  const resetar  = () => { setFotos([]); setNome(''); setMsg(null) }

  const cadastrar = async () => {
    if (!nome.trim()) return setMsg({ ok: false, txt: 'Insira o nome do funcionário.' })
    if (fotos.length < TOTAL) return setMsg({ ok: false, txt: `Capture todas as ${TOTAL} fotos.` })
    setLoading(true); setMsg(null)
    try {
      for (const img of fotos) await axios.post(`${API}/cadastrar`, { nome: nome.trim(), imagem: img })
      setMsg({ ok: true, txt: `${nome.trim()} cadastrado com ${TOTAL} fotos com sucesso!` })
      setFotos([]); setNome(''); fetchFuncionarios()
    } catch (err) {
      setMsg({ ok: false, txt: err.response?.data?.detail || 'Erro ao cadastrar.' })
    } finally { setLoading(false) }
  }

  const done  = fotos.length === TOTAL
  const pct   = (fotos.length / TOTAL) * 100
  const pose  = POSES[fotos.length] ?? POSES[TOTAL - 1]

  return (
    <div style={s.page}>
      <div style={s.wrapper}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Cadastro de Funcionário</h1>
          <p style={s.pageSubtitle}>Capture {TOTAL} fotos em poses diferentes para melhor precisão</p>
        </div>

        <div style={s.grid}>

          {/* ── Câmera ────────────────────────────────────── */}
          <div style={s.card}>

            {/* Instrução atual */}
            <div style={s.instrBox(done)}>
              <div style={s.instrEmoji}>{done ? '🎉' : pose.emoji}</div>
              <div>
                <div style={s.instrStep}>{done ? 'Captura concluída!' : `Foto ${fotos.length + 1} de ${TOTAL} — ${pose.label}`}</div>
                <div style={s.instrHint}>{done ? 'Preencha o nome e clique em cadastrar.' : pose.hint}</div>
              </div>
            </div>

            {/* Camera shell */}
            <div style={s.camShell}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.88}
                videoConstraints={videoConstraints}
                onUserMedia={() => setCamReady(true)}
                onUserMediaError={() => setMsg({ ok: false, txt: 'Câmera não encontrada. Verifique as permissões.' })}
                style={{ ...s.video, filter: done ? 'brightness(0.35) saturate(0.5)' : 'none' }}
                mirrored
              />
              {/* Corners */}
              {['tl','tr','bl','br'].map(c => <div key={c} style={s.corner(c, !done && camReady)} />)}
              {/* Flash */}
              {flash && <div style={s.flashEl} />}
              {/* Done overlay */}
              {done && (
                <div style={s.doneOverlay}>
                  <div style={s.doneCheck}>✓</div>
                  <span style={s.doneLabel}>Fotos capturadas</span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div>
              <div style={s.progressHead}>
                <span style={s.progressLabel}>Progresso</span>
                <span style={s.progressCount(done)}>{fotos.length} / {TOTAL}</span>
              </div>
              <div style={s.track}>
                <div style={s.fill(pct, done)} />
              </div>
            </div>

            {/* Thumbnails */}
            <div style={s.thumbsRow}>
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div key={i} style={s.thumb(!!fotos[i])}>
                  {fotos[i]
                    ? <img src={fotos[i]} alt={`foto ${i+1}`} style={s.thumbImg} />
                    : <span style={s.thumbNum}>{i + 1}</span>
                  }
                  {fotos[i] && <div style={s.thumbCheck}>✓</div>}
                </div>
              ))}
            </div>

            {/* Camera controls */}
            <div style={s.row}>
              {!done && (
                <button style={s.btnCapture(camReady && !done)} onClick={capturar} disabled={!camReady || done}>
                  <span>📷</span> Capturar
                  {fotos.length > 0 && <span style={s.btnBadge}>{TOTAL - fotos.length} restante{TOTAL - fotos.length !== 1 ? 's' : ''}</span>}
                </button>
              )}
              {fotos.length > 0 && (
                <button style={s.btnGhost} onClick={desfazer} disabled={loading}>
                  ↩ Refazer
                </button>
              )}
              {fotos.length > 0 && (
                <button style={s.btnGhost} onClick={resetar} disabled={loading}>
                  🗑
                </button>
              )}
            </div>
          </div>

          {/* ── Formulário ────────────────────────────────── */}
          <div style={s.card}>

            {/* Nome */}
            <div>
              <label style={s.fieldLabel}>Nome do funcionário</label>
              <input
                id="input-nome"
                type="text"
                placeholder="Ex: João Silva"
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cadastrar()}
                style={s.input}
              />
            </div>

            {/* Checklist */}
            <div style={s.checklist}>
              <p style={s.checklistTitle}>Poses necessárias</p>
              {POSES.map((p, i) => (
                <div key={i} style={s.checkItem(!!fotos[i])}>
                  <div style={s.checkCircle(!!fotos[i])}>
                    {fotos[i] ? '✓' : <span style={{ color: '#4a6a9a', fontSize: '0.75rem' }}>{i+1}</span>}
                  </div>
                  <div style={s.checkText}>
                    <span style={{ fontSize: '0.92rem', color: fotos[i] ? '#e8f0fe' : '#8fafd8' }}>
                      {p.emoji} {p.label}
                    </span>
                    {fotos[i] && <img src={fotos[i]} alt="" style={s.inlineThumb} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem */}
            {msg && (
              <div style={s.msgBox(msg.ok)}>
                {msg.ok ? '✅' : '⚠️'} {msg.txt}
              </div>
            )}

            {/* Cadastrar */}
            <button
              style={s.btnSubmit(!loading && done && !!nome.trim())}
              onClick={cadastrar}
              disabled={loading || !done || !nome.trim()}
            >
              {loading
                ? <><span style={s.spinner} /> Cadastrando…</>
                : <><span>💾</span> Cadastrar com {TOTAL} fotos</>
              }
            </button>

            {/* Lista */}
            <div style={s.listWrap}>
              <p style={s.listTitle}>
                Cadastrados
                <span style={s.listCount}>{Object.keys(funcionarios).length}</span>
              </p>
              {Object.keys(funcionarios).length === 0
                ? <p style={s.listEmpty}>Nenhum funcionário cadastrado ainda.</p>
                : (
                  <ul style={s.list}>
                    {Object.entries(funcionarios).map(([n, info]) => (
                      <li key={n} style={s.listItem}>
                        <div style={s.listAvatar}>
                          {n[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={s.listName}>{n}</div>
                          <div style={s.listSub}>{info.total_fotos} foto{info.total_fotos !== 1 ? 's' : ''}</div>
                        </div>
                        <button
                          style={s.btnDelete}
                          onClick={async () => {
                            if (!window.confirm(`Remover ${n}?`)) return
                            await axios.delete(`${API}/funcionarios/${encodeURIComponent(n)}`)
                            fetchFuncionarios()
                          }}
                          title="Remover"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              }
            </div>
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
    width: '100%', maxWidth: '1080px',
    display: 'flex', flexDirection: 'column', gap: '1.8rem',
  },
  pageHeader: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  pageTitle: {
    fontSize: '1.55rem', fontWeight: '800',
    color: '#e8f0fe', letterSpacing: '-0.03em', margin: 0,
  },
  pageSubtitle: {
    fontSize: '0.85rem', color: '#8fafd8', margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '1.5rem', alignItems: 'start',
  },
  card: {
    background: 'rgba(8,18,48,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(56,130,246,0.14)',
    borderRadius: '20px',
    padding: '1.6rem',
    display: 'flex', flexDirection: 'column', gap: '1.1rem',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  instrBox: (done) => ({
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    background: done ? 'rgba(5,217,138,0.07)' : 'rgba(37,99,235,0.1)',
    border: `1px solid ${done ? 'rgba(5,217,138,0.22)' : 'rgba(59,130,246,0.22)'}`,
    borderRadius: '12px', padding: '0.85rem 1rem',
    transition: 'all 0.3s',
  }),
  instrEmoji: { fontSize: '1.7rem', lineHeight: 1, flexShrink: 0 },
  instrStep: {
    fontSize: '0.82rem', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    color: '#60a5fa', marginBottom: '0.15rem',
  },
  instrHint: { fontSize: '0.9rem', fontWeight: '600', color: '#e8f0fe' },
  camShell: {
    position: 'relative', borderRadius: '14px',
    overflow: 'hidden', background: '#000',
    border: '1px solid rgba(56,130,246,0.18)',
    aspectRatio: '4/3',
  },
  video: {
    width: '100%', height: '100%', objectFit: 'cover',
    display: 'block', transition: 'filter 0.4s',
  },
  corner: (pos, active) => {
    const size = 18, thick = 2.5
    const color = active ? '#3b82f6' : 'rgba(56,130,246,0.35)'
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
  flashEl: {
    position: 'absolute', inset: 0,
    background: 'rgba(255,255,255,0.55)',
    pointerEvents: 'none', zIndex: 4,
  },
  doneOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', zIndex: 3,
  },
  doneCheck: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'rgba(5,217,138,0.2)',
    border: '2px solid rgba(5,217,138,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#05d98a', fontSize: '1.6rem', fontWeight: '800',
    boxShadow: '0 0 24px rgba(5,217,138,0.3)',
  },
  doneLabel: {
    color: '#05d98a', fontWeight: '700', fontSize: '0.9rem',
    background: 'rgba(0,0,0,0.5)',
    padding: '0.2rem 0.8rem', borderRadius: '100px',
  },
  progressHead: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '0.5rem',
  },
  progressLabel: { fontSize: '0.78rem', fontWeight: '700', color: '#4a6a9a', textTransform: 'uppercase', letterSpacing: '0.07em' },
  progressCount: (done) => ({ fontSize: '0.82rem', fontWeight: '800', color: done ? '#05d98a' : '#60a5fa' }),
  track: { height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' },
  fill: (pct, done) => ({
    height: '100%', width: `${pct}%`,
    background: done
      ? 'linear-gradient(90deg, #05d98a, #00ffa3)'
      : 'linear-gradient(90deg, #2563eb, #00c2ff)',
    borderRadius: '100px', transition: 'width 0.35s ease, background 0.4s',
    boxShadow: done ? '0 0 8px rgba(5,217,138,0.4)' : '0 0 8px rgba(37,99,235,0.4)',
  }),
  thumbsRow: { display: 'flex', gap: '0.5rem', justifyContent: 'center' },
  thumb: (filled) => ({
    position: 'relative',
    width: 56, height: 44, borderRadius: '8px',
    border: `1.5px solid ${filled ? 'rgba(5,217,138,0.5)' : 'rgba(56,130,246,0.2)'}`,
    overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: filled ? 'transparent' : 'rgba(8,18,48,0.8)',
    transition: 'border-color 0.25s', flexShrink: 0,
  }),
  thumbNum: { color: '#4a6a9a', fontSize: '0.75rem', fontWeight: '700' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbCheck: {
    position: 'absolute', top: 2, right: 3,
    color: '#05d98a', fontSize: '0.6rem', fontWeight: '900',
  },
  row: { display: 'flex', gap: '0.6rem', alignItems: 'center' },
  btnCapture: (enabled) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
    padding: '0.72rem 1.1rem',
    borderRadius: '12px', border: 'none',
    background: enabled ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.05)',
    color: enabled ? '#fff' : '#4a6a9a',
    fontWeight: '700', fontSize: '0.9rem', cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? '0 4px 18px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
    fontFamily: 'inherit', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  }),
  btnBadge: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '100px', padding: '0.1rem 0.5rem',
    fontSize: '0.72rem', fontWeight: '700',
  },
  btnGhost: {
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: '1px solid rgba(56,130,246,0.2)',
    background: 'rgba(37,99,235,0.07)',
    color: '#60a5fa', fontWeight: '600', fontSize: '0.85rem',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#4a6a9a', marginBottom: '0.5rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(56,130,246,0.2)',
    background: 'rgba(8,18,48,0.8)',
    color: '#e8f0fe', fontSize: '1rem',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border 0.2s, box-shadow 0.2s',
  },
  checklist: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  checklistTitle: {
    fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#4a6a9a', margin: 0, marginBottom: '0.2rem',
  },
  checkItem: (done) => ({
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    padding: '0.5rem 0.8rem',
    borderRadius: '10px',
    background: done ? 'rgba(5,217,138,0.06)' : 'rgba(37,99,235,0.05)',
    border: `1px solid ${done ? 'rgba(5,217,138,0.18)' : 'rgba(56,130,246,0.1)'}`,
    transition: 'all 0.25s',
  }),
  checkCircle: (done) => ({
    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
    background: done ? '#05d98a' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${done ? '#05d98a' : 'rgba(56,130,246,0.3)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: done ? '#000' : 'transparent',
    fontSize: '0.72rem', fontWeight: '900',
    boxShadow: done ? '0 0 8px rgba(5,217,138,0.4)' : 'none',
    transition: 'all 0.25s',
  }),
  checkText: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '0.5rem',
  },
  inlineThumb: {
    width: 38, height: 28, objectFit: 'cover',
    borderRadius: '5px', border: '1px solid rgba(5,217,138,0.3)',
    flexShrink: 0,
  },
  msgBox: (ok) => ({
    padding: '0.8rem 1rem', borderRadius: '10px', fontSize: '0.88rem', lineHeight: '1.5',
    background: ok ? 'rgba(5,217,138,0.08)' : 'rgba(240,69,103,0.08)',
    border: `1px solid ${ok ? 'rgba(5,217,138,0.25)' : 'rgba(240,69,103,0.25)'}`,
    color: ok ? '#05d98a' : '#f04567',
  }),
  btnSubmit: (enabled) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.82rem 1.2rem', borderRadius: '12px', border: 'none',
    background: enabled ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.05)',
    color: enabled ? '#fff' : '#4a6a9a',
    fontWeight: '700', fontSize: '0.95rem',
    cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
    boxShadow: enabled ? '0 4px 20px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
    transition: 'all 0.2s',
  }),
  spinner: {
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  listWrap: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' },
  listTitle: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#4a6a9a', margin: 0,
  },
  listCount: {
    background: 'rgba(37,99,235,0.2)',
    border: '1px solid rgba(59,130,246,0.25)',
    color: '#60a5fa',
    fontSize: '0.72rem', fontWeight: '800',
    padding: '0.05rem 0.5rem', borderRadius: '100px',
  },
  listEmpty: { color: '#4a6a9a', fontSize: '0.85rem', textAlign: 'center', padding: '0.8rem 0' },
  list: {
    listStyle: 'none', margin: 0, padding: 0,
    display: 'flex', flexDirection: 'column', gap: '0.4rem',
    maxHeight: '220px', overflowY: 'auto',
  },
  listItem: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    padding: '0.55rem 0.8rem',
    background: 'rgba(37,99,235,0.05)',
    border: '1px solid rgba(56,130,246,0.1)',
    borderRadius: '10px',
  },
  listAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #2563eb, #00c2ff)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.82rem', fontWeight: '800', color: '#fff',
    boxShadow: '0 0 10px rgba(37,99,235,0.35)',
  },
  listName: { fontSize: '0.9rem', fontWeight: '600', color: '#e8f0fe' },
  listSub: { fontSize: '0.75rem', color: '#4a6a9a' },
  btnDelete: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
    border: '1px solid rgba(240,69,103,0.2)',
    background: 'rgba(240,69,103,0.08)',
    color: '#f04567', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: '800', transition: 'all 0.2s',
  },
}