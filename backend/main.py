import os
import io
import base64
import pickle
import logging
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from PIL import Image
from deepface import DeepFace
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="MVP Ponto Facial", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configurações ──────────────────────────────────────────────────────────────
DB_PATH = os.getenv("DB_PATH", "/data/face_db.pkl")
MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "opencv"

# ArcFace com similaridade cosseno: 1.0 = idêntico, 0.0 = sem relação.
# Faces do mesmo indivíduo costumam ter similaridade ≥ 0.50.
SIMILARITY_THRESHOLD = 0.50


# ── Persistência ───────────────────────────────────────────────────────────────

def load_db() -> dict:
    """Carrega o banco de embeddings do disco."""
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            return pickle.load(f)
    return {}  # { nome: [embedding_array, ...] }


def save_db(db: dict) -> None:
    """Salva o banco de embeddings no disco."""
    with open(DB_PATH, "wb") as f:
        pickle.dump(db, f)


# ── Helpers ────────────────────────────────────────────────────────────────────

def decode_base64_image(b64_str: str) -> np.ndarray:
    """Converte base64 (com ou sem header data-URL) em array BGR para o DeepFace."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]

    img_bytes = base64.b64decode(b64_str)
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    rgb = np.array(pil_img)
    # DeepFace usa OpenCV internamente, que opera em BGR
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def get_embedding(bgr_array: np.ndarray) -> Optional[np.ndarray]:
    """Extrai embedding ArcFace do primeiro rosto detectado. Retorna None se não houver rosto."""
    try:
        results = DeepFace.represent(
            img_path=bgr_array,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
        )
        if results:
            return np.array(results[0]["embedding"], dtype=np.float32)
        return None
    except Exception as exc:
        log.warning("Nenhum rosto detectado: %s", exc)
        return None


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Similaridade cosseno entre dois vetores (resultado em [-1, 1])."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


# ── Schemas ────────────────────────────────────────────────────────────────────

class CadastrarRequest(BaseModel):
    nome: str
    imagem: str  # base64


class ReconhecerRequest(BaseModel):
    imagem: str  # base64


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "MVP Ponto Facial está no ar", "modelo": MODEL_NAME}


@app.post("/cadastrar")
def cadastrar(req: CadastrarRequest):
    nome = req.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome não pode ser vazio.")

    try:
        bgr = decode_base64_image(req.imagem)
    except Exception as exc:
        log.error("Erro ao decodificar imagem: %s", exc)
        raise HTTPException(status_code=400, detail="Imagem inválida ou corrompida.")

    embedding = get_embedding(bgr)
    if embedding is None:
        raise HTTPException(status_code=422, detail="Nenhum rosto detectado na imagem.")

    db = load_db()
    if nome not in db:
        db[nome] = []
    db[nome].append(embedding)
    save_db(db)

    total = len(db[nome])
    log.info("Cadastrado: %s (%d foto(s))", nome, total)
    return {
        "sucesso": True,
        "mensagem": f"Foto {total} de {nome} salva com sucesso.",
        "total_fotos": total,
    }


@app.post("/reconhecer")
def reconhecer(req: ReconhecerRequest):
    try:
        bgr = decode_base64_image(req.imagem)
    except Exception as exc:
        log.error("Erro ao decodificar imagem: %s", exc)
        raise HTTPException(status_code=400, detail="Imagem inválida ou corrompida.")

    embedding = get_embedding(bgr)
    if embedding is None:
        return {"reconhecido": False, "motivo": "Nenhum rosto detectado."}

    db = load_db()
    if not db:
        return {"reconhecido": False, "motivo": "Nenhum funcionário cadastrado ainda."}

    # Busca a maior similaridade entre todos os embeddings cadastrados
    best_nome: Optional[str] = None
    best_similarity: float = -1.0

    for nome, embeddings in db.items():
        for emb in embeddings:
            sim = cosine_similarity(embedding, emb)
            if sim > best_similarity:
                best_similarity = sim
                best_nome = nome

    # Converte similaridade para percentual de confiança (0–100)
    confidence = round(best_similarity * 100, 1)

    log.info(
        "Melhor match: %s | similaridade=%.4f | confiança=%.1f%%",
        best_nome,
        best_similarity,
        confidence,
    )

    if best_similarity < SIMILARITY_THRESHOLD:
        return {
            "reconhecido": False,
            "motivo": "Confiança insuficiente.",
            "confianca": confidence,
        }

    return {
        "reconhecido": True,
        "nome": best_nome,
        "confianca": confidence,
        "horario": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }


@app.get("/funcionarios")
def listar_funcionarios():
    db = load_db()
    return {
        nome: {"total_fotos": len(encs)}
        for nome, encs in db.items()
    }


@app.delete("/funcionarios/{nome}")
def deletar_funcionario(nome: str):
    db = load_db()
    if nome not in db:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
    del db[nome]
    save_db(db)
    return {"sucesso": True, "mensagem": f"{nome} removido do sistema."}
