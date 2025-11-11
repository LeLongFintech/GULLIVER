# app/risk_engine.py

from __future__ import annotations
import os
from pathlib import Path
from dataclasses import dataclass

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# ======================
# Config V2: RF (behavior + extra features)
# ======================
PRICE_UNIT  = 1.0        # 1.0 nếu close đã là đơn vị chuẩn; đổi nếu dữ liệu là "nghìn VND"
RANDOM_SEED = 42

OHLCV_FILE = "OHLCV_Merge.csv"
SHARE_FILE = "Share_outstanding.csv"

# Các feature đã dùng để tạo churn_flag (rule-based) → KHÔNG cho vào model
RULE_FEATURES = ["ret_1d", "vol_z20", "gap_open"]

# Feature hành vi dùng để train model (behavior-only + extra features)
BEHAVIOR_FEATURES = [
    # return & price/volume structure (không dùng ret_1d, vol_z20, gap_open)
    "ret_3d", "ret_5d",
    "range_rel", "close_loc",

    # rolling 3d / 5d / 10d
    "turnover_3d", "volz_3d", "range_3d", "close_loc_3d",
    "turnover_5d", "volz_5d", "range_5d", "close_loc_5d",
    "turnover_10d", "volz_10d", "range_10d", "close_loc_10d",

    # cross-sectional ranking
    "turnover_pct", "mkt_cap_pct",

    # ===== extra behavior features =====
    "vol_change_5d",      # tốc độ thay đổi volume 5 ngày
    "turnover_vol_ratio", # tỷ lệ turnover / |vol_z20|
    "abs_ret_5d",         # biên độ giá tuyệt đối 5 ngày
    "volatility_10d",     # độ biến động ret_1d trong 10 ngày
    "price_slope_5d",     # slope giá 5 ngày gần nhất
]

LABEL_COL = "churn_flag"


# =========================================================
# Helper: chuẩn hoá tên cột (tái dùng đúng logic V1)
# =========================================================
def _standardize_cols(df: pd.DataFrame) -> pd.DataFrame:
    """Chuẩn hoá tên cột phổ biến từ nhiều nguồn khác nhau."""
    if df is None:
        return df
    mapping: dict[str, str] = {}
    low = {c.lower().strip(): c for c in df.columns}

    def pick(names: list[str]) -> str | None:
        for n in names:
            if n in low:
                return low[n]
        for n in names:
            for k in low:
                if n in k:
                    return low[k]
        return None

    # OHLCV
    if pick(["ticker", "mã", "ma", "symbol"]):
        mapping[pick(["ticker", "mã", "ma", "symbol"])] = "ticker"
    if pick(["date", "ngày", "trading_date"]):
        mapping[pick(["date", "ngày", "trading_date"])] = "date"
    if pick(["open", "giá mở"]):
        mapping[pick(["open", "giá mở"])] = "open"
    if pick(["high", "cao nhất"]):
        mapping[pick(["high", "cao nhất"])] = "high"
    if pick(["low", "thấp nhất"]):
        mapping[pick(["low", "thấp nhất"])] = "low"
    if pick(["close", "đóng cửa"]):
        mapping[pick(["close", "đóng cửa"])] = "close"
    if pick(["volume", "khối lượng", "vol"]):
        mapping[pick(["volume", "khối lượng", "vol"])] = "volume"
    if pick(["exchange", "sàn"]):
        mapping[pick(["exchange", "sàn"])] = "exchange"

    # shares theo năm
    if pick(["năm", "year"]):
        mapping[pick(["năm", "year"])] = "year"
    if "Mã" in df.columns and "ticker" not in mapping:
        mapping["Mã"] = "ticker"
    if "Năm" in df.columns and "year" not in mapping:
        mapping["Năm"] = "year"
    if "shares_outstanding" in df.columns:
        mapping["shares_outstanding"] = "shares_outstanding"

    return df.rename(columns=mapping)


def _zscore_rolling(s: pd.Series, win: int) -> pd.Series:
    m = s.rolling(win, min_periods=max(5, win // 3)).mean()
    sd = s.rolling(win, min_periods=max(5, win // 3)).std()
    return (s - m) / sd


# =========================================================
# Artifacts: lưu model đã train
# =========================================================
@dataclass
class RiskArtifacts:
    model: RandomForestClassifier


# =========================================================
# Core Engine: ManipulationWatchV1 (RF version)
# =========================================================
class ManipulationWatchV1:
    """
    V2: OHLCV + Shares theo năm → feature hành vi + cấu trúc →
        RandomForest (supervised, behavior + extra features) → risk 0–10 theo ngày.
    """

    def __init__(self, data_dir: str | None = None):
        # Dùng chung DATA_DIR như StockAnalyzer để nhất quán
        env_dir = (os.getenv("DATA_DIR") or "").strip()
        root = data_dir or env_dir or ""
        if not root:
            root = str(Path(__file__).resolve().parents[2] / "frontend" / "public")
        self.data_dir = Path(root)

        self.df: pd.DataFrame | None = None      # full feature frame
        self.scores: pd.DataFrame | None = None  # risk per (date, ticker)
        self.art: RiskArtifacts | None = None    # fitted RF model

        self._load_and_fit()

    # ---------------- Load & Features ----------------
    def _load_and_fit(self) -> None:
        ohlcv_path = self.data_dir / OHLCV_FILE
        shares_path = self.data_dir / SHARE_FILE
        if not ohlcv_path.exists():
            raise FileNotFoundError(f"Không thấy {ohlcv_path}")
        if not shares_path.exists():
            raise FileNotFoundError(f"Không thấy {shares_path}")

        o = pd.read_csv(ohlcv_path)
        s = pd.read_csv(shares_path)

        # drop index thừa nếu có
        for col in ["Unnamed: 0", "Unnamed: 0.1"]:
            if col in o.columns:
                o = o.drop(columns=[col])
            if col in s.columns:
                s = s.drop(columns=[col])

        o = _standardize_cols(o)
        s = _standardize_cols(s)

        # chuẩn hoá cơ bản
        o["ticker"] = o["ticker"].astype(str).str.upper().str.strip()
        o["date"] = pd.to_datetime(o["date"])
        o["year"] = o["date"].dt.year

        for c in ["open", "high", "low", "close", "volume"]:
            if c in o.columns:
                o[c] = pd.to_numeric(o[c], errors="coerce")
        # nếu giá đang là "nghìn VND", chỉnh PRICE_UNIT = 1000; mặc định 1.0
        o["close"] = o["close"] * PRICE_UNIT
        o = o.sort_values(["ticker", "date"]).reset_index(drop=True)

        s["ticker"] = s["ticker"].astype(str).str.upper().str.strip()
        s["year"] = pd.to_numeric(s["year"], errors="coerce").astype("Int64")
        if "shares_outstanding" in s.columns:
            s["shares_outstanding"] = pd.to_numeric(
                s["shares_outstanding"], errors="coerce"
            )
            # coi 0 hoặc số âm là thiếu dữ liệu, để tránh chia 0 → inf
            s.loc[s["shares_outstanding"] <= 0, "shares_outstanding"] = np.nan

        # merge shares theo ticker-year
        df = o.merge(
            s[["ticker", "year", "shares_outstanding"]],
            on=["ticker", "year"],
            how="left",
        )

        # ffill/bfill shares theo từng ticker
        df_sorted = df.sort_values(["ticker", "year"])
        df["shares_outstanding"] = (
            df_sorted.groupby("ticker")["shares_outstanding"]
            .transform(lambda x: x.ffill().bfill())
        )

        # loại bỏ dòng không đủ dữ liệu cơ bản
        df = df.dropna(subset=["close", "volume", "shares_outstanding"]).copy()

        # ---------- Feature engineering ----------
        g = df.groupby("ticker", group_keys=False)

        # Return ngắn hạn
        df["ret_1d"] = g["close"].pct_change(1)
        df["ret_3d"] = g["close"].pct_change(3)
        df["ret_5d"] = g["close"].pct_change(5)

        # Biên độ / vị trí giá
        df["range_rel"] = (df["high"] - df["low"]) / g["close"].shift(1)
        df["close_loc"] = (
            df["close"] - (df["high"] + df["low"]) / 2
        ) / (df["high"] - df["low"]).replace(0, np.nan)

        # Gap mở cửa
        df["gap_open"] = (df["open"] - g["close"].shift(1)) / g["close"].shift(1)

        # Z-score khối lượng 20 phiên
        df["vol_z20"] = g["volume"].apply(lambda s_: _zscore_rolling(s_, 20))

        # Turnover & market cap
        df["turnover"] = df["volume"] / df["shares_outstanding"]
        df["mkt_cap"] = df["close"] * df["shares_outstanding"]

        # Rolling 3d / 5d / 10d cho hành vi
        for w in (3, 5, 10):
            df[f"turnover_{w}d"] = g["turnover"].apply(
                lambda s_: s_.rolling(w, min_periods=max(2, w // 2)).mean()
            )
            df[f"volz_{w}d"] = g["vol_z20"].apply(
                lambda s_: s_.rolling(w, min_periods=max(2, w // 2)).mean()
            )
            df[f"range_{w}d"] = g["range_rel"].apply(
                lambda s_: s_.rolling(w, min_periods=max(2, w // 2)).mean()
            )
            df[f"close_loc_{w}d"] = g["close_loc"].apply(
                lambda s_: s_.rolling(w, min_periods=max(2, w // 2)).mean()
            )

        # ===== extra behavior features (giống notebook fine-tuned) =====
        df = df.sort_values(["ticker", "date"]).reset_index(drop=True)
        g2 = df.groupby("ticker", group_keys=False)

        # Tốc độ thay đổi khối lượng trong 5 ngày
        df["vol_change_5d"] = g2["volume"].transform(
            lambda x: (x / x.shift(5)) - 1
        )

        # Tỷ lệ giữa thanh khoản và độ “bất thường” volume
        df["turnover_vol_ratio"] = df["turnover"] / (df["vol_z20"].abs() + 1e-6)

        # Biên độ giá tuyệt đối 5 ngày
        df["abs_ret_5d"] = df["ret_5d"].abs()

        # Độ biến động 10 ngày (rolling std của ret_1d)
        df["volatility_10d"] = g2["ret_1d"].transform(
            lambda x: x.rolling(10, min_periods=5).std()
        )

        # Xu hướng giá trong 5 ngày (price slope)
        df["price_slope_5d"] = g2["close"].transform(
            lambda x: (x - x.shift(5)) / 5
        )

        # Rule gán nhãn churn_flag: KL đột biến nhưng biên độ hẹp
        df[LABEL_COL] = (
            (df["vol_z20"] > 2.0) & (df["range_rel"].abs() < 0.01)
        ).astype(int)

        # Chuẩn hoá chéo theo ngày (ranking percentile)
        df["turnover_pct"] = df.groupby("date")["turnover"].rank(pct=True)
        df["mkt_cap_pct"] = df.groupby("date")["mkt_cap"].rank(pct=True)

        # ---------- Chọn vũ trụ train: blue-chips ----------
        agg = (
            df.groupby("ticker")
            .agg(
                med_turn=("turnover", "median"),
                med_cap=("mkt_cap", "median"),
            )
            .replace([np.inf, -np.inf], np.nan)
            .dropna()
        )
        thr_turn = agg["med_turn"].quantile(0.7)
        thr_cap = agg["med_cap"].quantile(0.7)
        blue = set(
            agg[
                (agg["med_turn"] >= thr_turn)
                & (agg["med_cap"] >= thr_cap)
            ].index
        )

        # Train mask: blue-chips, dữ liệu trước 2024-01-01
        train_mask = (df["ticker"].isin(blue)) & (
            df["date"] < pd.Timestamp("2024-01-01")
        )

        # Chuẩn bị tập train cho RF: chỉ feature hành vi + nhãn
        train_df = (
            df.loc[train_mask]
            .replace([np.inf, -np.inf], np.nan)
            .dropna(subset=BEHAVIOR_FEATURES + [LABEL_COL])
            .copy()
        )

        X_train = train_df[BEHAVIOR_FEATURES]
        y_train = train_df[LABEL_COL].astype(int)

        # ---------- Train RandomForest (behavior + extra features) ----------
        rf = RandomForestClassifier(
            n_estimators=400,
            max_depth=None,
            min_samples_leaf=3,            # như cấu hình fine-tuned trên notebook
            n_jobs=-1,
            random_state=RANDOM_SEED,
            class_weight="balanced_subsample",
        )
        rf.fit(X_train, y_train)

        # ---------- Score toàn bộ vũ trụ ----------
        valid_df = (
            df.replace([np.inf, -np.inf], np.nan)
            .dropna(subset=BEHAVIOR_FEATURES)
            .copy()
        )
        X_all = valid_df[BEHAVIOR_FEATURES]
        prob = rf.predict_proba(X_all)[:, 1]  # P(churn_flag = 1)

        out = valid_df[
            ["date", "ticker", "exchange", "close", "volume", "turnover", "mkt_cap"]
        ].copy()
        out["risk_raw"] = prob
        out["risk_pct_daily"] = out.groupby("date")["risk_raw"].rank(pct=True)
        out["risk_0_10"] = (out["risk_pct_daily"] * 10).clip(0, 10).round(1)

        self.df = df
        self.scores = (
            out.sort_values(["date", "risk_0_10"], ascending=[True, False])
            .reset_index(drop=True)
        )
        self.art = RiskArtifacts(model=rf)

    # ---------------- Public APIs (giữ nguyên format) ----------------
    def score(self, ticker: str, date: str | None = None) -> dict:
        if self.scores is None:
            raise RuntimeError("Risk engine chưa khởi tạo.")
        t = ticker.upper().strip()
        s = self.scores[self.scores["ticker"] == t]
        if s.empty:
            return {"ticker": t, "message": "No data"}
        if date:
            d = pd.to_datetime(date)
            row = s[s["date"] == d].tail(1)
            if row.empty:
                # lấy phiên gần nhất trước date
                row = s[s["date"] <= d].tail(1)
        else:
            row = s.tail(1)
        if row.empty:
            return {"ticker": t, "message": "No data at selected date"}
        r = row.iloc[-1]
        return {
            "ticker": t,
            "date": str(pd.to_datetime(r["date"]).date()),
            "risk_0_10": float(r["risk_0_10"]),
            "alert": bool(r["risk_0_10"] >= 8.0),
            "context": {
                "close": float(r["close"]),
                "volume": float(r["volume"]),
                "turnover": float(r["turnover"]),
                "mkt_cap": float(r["mkt_cap"]),
            },
        }

    def history(self, ticker: str, days: int = 180) -> dict:
        t = ticker.upper().strip()
        s = self.scores[self.scores["ticker"] == t].sort_values("date")
        if s.empty:
            return {"ticker": t, "history": []}
        tail = s.tail(days)
        return {
            "ticker": t,
            "history": [
                {
                    "date": str(pd.to_datetime(d).date()),
                    "risk_0_10": float(v),
                }
                for d, v in zip(tail["date"], tail["risk_0_10"])
            ],
        }

    def top(self, date: str, k: int = 50) -> list[dict]:
        d = pd.to_datetime(date)
        s = self.scores[self.scores["date"] == d].nlargest(k, "risk_0_10")
        return [
            {
                "ticker": t,
                "risk_0_10": float(x),
                "close": float(c),
                "volume": float(v),
            }
            for t, x, c, v in zip(
                s["ticker"], s["risk_0_10"], s["close"], s["volume"]
            )
        ]


# Singleton lười khởi tạo
_RISK: ManipulationWatchV1 | None = None


def get_engine() -> ManipulationWatchV1:
    global _RISK
    if _RISK is None:
        _RISK = ManipulationWatchV1(data_dir=os.getenv("DATA_DIR"))
    return _RISK
