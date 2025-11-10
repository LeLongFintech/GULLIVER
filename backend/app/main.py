from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
import os
from .analyzer import StockAnalyzer
from .risk_engine import get_engine

# Load environment variables
load_dotenv()

# Configure API
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả origins trong môi trường development
    allow_credentials=False,  # Đặt False khi allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash-lite')

# Initialize StockAnalyzer
analyzer = StockAnalyzer(data_path=os.getenv("DATA_DIR"))

class StockRequest(BaseModel):
    symbol: str

@app.post("/api/ai/diagnose")
async def analyze_stock(request: StockRequest):
    try:
        # Get stock metrics
        metrics = analyzer.get_stock_metrics(request.symbol)
        
        # Generate analysis prompt
        prompt = analyzer.generate_analysis_prompt(metrics)
        
        # Get response from Gemini
        response = model.generate_content(prompt)
        
        # Return the analysis
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
#  Manipulation Watch V1
# =========================

@app.get("/api/risk/score")
async def risk_score(
    ticker: str = Query(..., description="Mã cổ phiếu, ví dụ VCB"),
    date: str | None = Query(None, description="YYYY-MM-DD (optional)")
):
    eng = get_engine()
    return eng.score(ticker, date)

@app.get("/api/risk/history")
async def risk_history(
    ticker: str = Query(...),
    days: int = Query(180, ge=1, le=1000)
):
    eng = get_engine()
    return eng.history(ticker, days)

@app.get("/api/risk/top")
async def risk_top(
    date: str = Query(..., description="YYYY-MM-DD"),
    k: int = Query(50, ge=1, le=500)
):
    eng = get_engine()
    return {"date": date, "top": eng.top(date, k)}