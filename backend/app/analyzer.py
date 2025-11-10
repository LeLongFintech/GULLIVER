from typing import Dict, List, Optional
import pandas as pd
import os
from pathlib import Path


def _find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Try to find a column in df whose name matches any candidate (case-insensitive, substring).
    Returns the matching column name or None."""
    if df is None:
        return None
    cols = list(df.columns)
    low_cols = [c.lower() for c in cols]
    for cand in candidates:
        lc = cand.lower()
        # exact match
        for i, c in enumerate(low_cols):
            if c == lc:
                return cols[i]
        # contains
        for i, c in enumerate(low_cols):
            if lc in c:
                return cols[i]
    return None


def _to_number(v: any) -> float:
    try:
        if pd.isna(v):
            return 0.0
        s = str(v).strip()
        # remove commas and whitespace
        s = s.replace(',', '').replace('\xa0', '').strip()
        # handle parentheses for negative numbers
        if s.startswith('(') and s.endswith(')'):
            s = '-' + s[1:-1]
        return float(s)
    except Exception:
        return 0.0


class StockAnalyzer:
    def __init__(self, data_path: str = None):
        # Ưu tiên DATA_DIR từ env; nếu không có thì fallback
        env_dir = os.getenv("DATA_DIR", "").strip()
        if data_path:
            self.data_path = data_path
        elif env_dir:
            self.data_path = os.path.abspath(env_dir) + os.sep
        else:
            repo_root = Path(__file__).resolve().parents[2]
            public_dir = repo_root / "frontend" / "public"
            if public_dir.exists():
                self.data_path = str(public_dir.resolve()) + os.sep
            else:
                # Fallback 2: .../data/data_cleaned (giữ tương thích cũ)
                self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'data_cleaned')) + os.sep

        self.balance_sheet: Optional[pd.DataFrame] = None
        self.income_statement: Optional[pd.DataFrame] = None
        self.cash_flow: Optional[pd.DataFrame] = None
        self.indicators: Optional[pd.DataFrame] = None
        self.average_indicators: Optional[pd.DataFrame] = None
        self.load_data()

    def load_data(self):
        """Load all necessary CSV files. Keeps DataFrames or raises a descriptive exception."""
        try:
            self.balance_sheet = pd.read_csv(os.path.join(self.data_path, 'Balance_sheet.csv'), encoding='utf-8-sig')
            self.income_statement = pd.read_csv(os.path.join(self.data_path, 'Income_statement.csv'), encoding='utf-8-sig')
            self.cash_flow = pd.read_csv(os.path.join(self.data_path, 'Cash_flow.csv'), encoding='utf-8-sig')
            self.indicators = pd.read_csv(os.path.join(self.data_path, 'Indicators.csv'), encoding='utf-8-sig')
            # Average_indicators là OPTIONAL
            avg_path = os.path.join(self.data_path, 'Average_indicators.csv')
            if os.path.exists(avg_path):
                self.average_indicators = pd.read_csv(avg_path, encoding='utf-8-sig')
            else:
                self.average_indicators = None
        except FileNotFoundError as e:
            raise Exception(f"Data file not found: {e.filename}")
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")

    def _select_rows_by_symbol(self, df: pd.DataFrame, symbol: str) -> pd.DataFrame:
        """Return rows matching symbol using a fuzzy column detection for the 'symbol' column."""
        if df is None:
            raise Exception("Dataframe is not loaded")
        sym_col = _find_column(df, ['symbol', 'ma', 'mã', 'ticker', 'code'])
        if not sym_col:
            raise Exception("Không tìm thấy cột mã cổ phiếu (symbol) trong dữ liệu.")
        mask = df[sym_col].astype(str).str.upper().str.strip() == symbol.upper().strip()
        result = df[mask]
        return result

    def get_stock_metrics(self, symbol: str) -> Dict:
        """Return a dict of metrics or raise a descriptive exception."""
        if not symbol:
            raise Exception("Symbol is empty")
        try:
            valuation = self._get_valuation_metrics(symbol)
            growth = self._get_growth_metrics(symbol)
            performance = self._get_performance_metrics(symbol)
            financial_health = self._get_financial_health_metrics(symbol)
            dividend = self._get_dividend_metrics(symbol)

            return {
                'valuation': valuation,
                'growth': growth,
                'performance': performance,
                'financial_health': financial_health,
                'dividend': dividend,
            }
        except Exception as e:
            # bubble up with symbol context
            raise Exception(f"Error analyzing stock {symbol}: {str(e)}")

    def _get_valuation_metrics(self, symbol: str) -> Dict:
        if self.indicators is None or self.average_indicators is None:
            raise Exception('Indicators data not loaded')

        rows = self._select_rows_by_symbol(self.indicators, symbol)
        if rows.empty:
            raise Exception(f'No indicators data found for symbol {symbol}')
        stock_indicators = rows.iloc[-1]

        # try to find sector column
        sector_col = _find_column(self.indicators, ['sector', 'industry', 'nganh'])
        sector_val = stock_indicators[sector_col] if sector_col and sector_col in stock_indicators else None

        # find pe/pb columns
        pe_col = _find_column(self.indicators, ['p/e', 'pe', 'price to earnings', 'pe_ratio'])
        pb_col = _find_column(self.indicators, ['p/b', 'pb', 'price to book', 'pb_ratio'])

        industry_rows = None
        if sector_val is not None and not pd.isna(sector_val):
            sector_col_avg = _find_column(self.average_indicators, ['sector', 'industry', 'nganh'])
            if sector_col_avg:
                industry_rows = self.average_indicators[self.average_indicators[sector_col_avg].astype(str).str.strip().str.lower() == str(sector_val).strip().lower()]

        industry_avg = industry_rows.iloc[-1] if industry_rows is not None and not industry_rows.empty else None

        return {
            'pe_ratio': float(_to_number(stock_indicators.get(pe_col, 0))) if pe_col else 0.0,
            'pb_ratio': float(_to_number(stock_indicators.get(pb_col, 0))) if pb_col else 0.0,
            'industry_pe': float(_to_number(industry_avg.get('Average P/E', 0))) if industry_avg is not None and 'Average P/E' in industry_avg else 0.0,
            'industry_pb': float(_to_number(industry_avg.get('Average P/B', 0))) if industry_avg is not None and 'Average P/B' in industry_avg else 0.0,
        }

    def _get_growth_metrics(self, symbol: str) -> Dict:
        if self.income_statement is None:
            raise Exception('Income statement data not loaded')
        rows = self._select_rows_by_symbol(self.income_statement, symbol)
        if rows.empty:
            return {'revenue_growth': 0.0, 'eps_growth': 0.0}

        revenue_col = _find_column(self.income_statement, ['revenue', 'doanh thu', 'doanh thu thuần', 'net revenue'])
        eps_col = _find_column(self.income_statement, ['eps', 'earnings per share', 'lãi cơ bản trên cổ phiếu'])

        revenue_growth = self._calculate_growth_rate(rows, revenue_col) if revenue_col else 0.0
        eps_growth = self._calculate_growth_rate(rows, eps_col) if eps_col else 0.0

        return {'revenue_growth': revenue_growth, 'eps_growth': eps_growth}

    def _get_performance_metrics(self, symbol: str) -> Dict:
        if self.indicators is None:
            raise Exception('Indicators data not loaded')
        rows = self._select_rows_by_symbol(self.indicators, symbol)
        if rows.empty:
            return {'roe': 0.0, 'roa': 0.0, 'profit_margin': 0.0}

        recent = rows.iloc[-1]
        roe_col = _find_column(self.indicators, ['roe', 'return on equity'])
        roa_col = _find_column(self.indicators, ['roa', 'return on assets'])
        pm_col = _find_column(self.indicators, ['profit margin', 'margin'])

        return {
            'roe': float(_to_number(recent.get(roe_col, 0))),
            'roa': float(_to_number(recent.get(roa_col, 0))),
            'profit_margin': float(_to_number(recent.get(pm_col, 0)))
        }

    def _get_financial_health_metrics(self, symbol: str) -> Dict:
        # Ưu tiên lấy từ Indicators (thường có sẵn tỉ số)
        if self.indicators is not None:
            rows = self._select_rows_by_symbol(self.indicators, symbol)
            if not rows.empty:
                recent = rows.iloc[-1]
                dte_col_ind = _find_column(self.indicators, ['debt to equity', 'debt/equity', 'debt_equity', 'nợ/vốn', 'd/e'])
                cr_col_ind  = _find_column(self.indicators, ['current ratio', 'liquidity', 'current_ratio', 'khả năng thanh toán', 'thanh khoản hiện hành'])
                dte = float(_to_number(recent.get(dte_col_ind, 0))) if dte_col_ind else 0.0
                cr  = float(_to_number(recent.get(cr_col_ind, 0))) if cr_col_ind else 0.0
                if dte or cr:
                    return {'debt_to_equity': dte, 'current_ratio': cr}

            # Fallback Balance_sheet (nếu Indicators không có)
            if self.balance_sheet is None:
                return {'debt_to_equity': 0.0, 'current_ratio': 0.0}
            rows_bs = self._select_rows_by_symbol(self.balance_sheet, symbol)
            if rows_bs.empty:
                return {'debt_to_equity': 0.0, 'current_ratio': 0.0}

            recent_bs = rows_bs.iloc[-1]
            dte_col_bs = _find_column(self.balance_sheet, ['debt to equity', 'debt/equity', 'debt_equity', 'nợ/vốn', 'd/e'])
            cr_col_bs  = _find_column(self.balance_sheet, ['current ratio', 'liquidity', 'current_ratio', 'khả năng thanh toán', 'thanh khoản hiện hành'])

            return {
                'debt_to_equity': float(_to_number(recent_bs.get(dte_col_bs, 0))) if dte_col_bs else 0.0,
                'current_ratio': float(_to_number(recent_bs.get(cr_col_bs, 0))) if cr_col_bs else 0.0
            }


    def _get_dividend_metrics(self, symbol: str) -> Dict:
        if self.indicators is None:
            raise Exception('Indicators data not loaded')
        rows = self._select_rows_by_symbol(self.indicators, symbol)
        if rows.empty:
            return {'dividend_yield': 0.0, 'payout_ratio': 0.0}

        recent = rows.iloc[-1]
        dy_col = _find_column(self.indicators, ['dividend yield', 'yield', 'dividend'])
        pr_col = _find_column(self.indicators, ['payout ratio', 'payout', 'payout_ratio'])

        return {
            'dividend_yield': float(_to_number(recent.get(dy_col, 0))) if dy_col else 0.0,
            'payout_ratio': float(_to_number(recent.get(pr_col, 0))) if pr_col else 0.0
        }

    def _calculate_growth_rate(self, data: pd.DataFrame, column: Optional[str]) -> float:
        """Calculate year-over-year growth between last two rows for the given column."""
        try:
            if column is None:
                return 0.0
            series = data[column].dropna().map(_to_number)
            series = series[series.map(lambda v: isinstance(v, (int, float)))]
            series = series.astype(float)
            if len(series) < 2:
                return 0.0
            latest = series.iloc[-1]
            previous = series.iloc[-2]
            if previous == 0:
                return 0.0
            return ((latest - previous) / abs(previous)) * 100.0
        except Exception:
            return 0.0

    def generate_analysis_prompt(self, metrics: Dict) -> str:
        """Tạo prompt để gửi cho Gemini"""
        prompt = f"""Hãy phân tích cổ phiếu này dựa trên các chỉ số sau và đưa ra đánh giá tổng quan:

1. Định giá:
- P/E: {metrics['valuation'].get('pe_ratio', 0):.2f} (Trung bình ngành: {metrics['valuation'].get('industry_pe', 0):.2f})
- P/B: {metrics['valuation'].get('pb_ratio', 0):.2f} (Trung bình ngành: {metrics['valuation'].get('industry_pb', 0):.2f})

2. Tăng trưởng:
- Tăng trưởng doanh thu: {metrics['growth'].get('revenue_growth', 0):.2f}%
- Tăng trưởng EPS: {metrics['growth'].get('eps_growth', 0):.2f}%

3. Hiệu quả hoạt động:
- ROE: {metrics['performance'].get('roe', 0):.2f}%
- ROA: {metrics['performance'].get('roa', 0):.2f}%
- Biên lợi nhuận: {metrics['performance'].get('profit_margin', 0):.2f}%

4. Sức khỏe tài chính:
- Tỷ lệ nợ/vốn chủ sở hữu: {metrics['financial_health'].get('debt_to_equity', 0):.2f}
- Tỷ lệ thanh toán hiện hành: {metrics['financial_health'].get('current_ratio', 0):.2f}

5. Cổ tức:
- Tỷ suất cổ tức: {metrics['dividend'].get('dividend_yield', 0):.2f}%
- Tỷ lệ chi trả: {metrics['dividend'].get('payout_ratio', 0):.2f}%

Hãy đánh giá dựa trên 5 khía cạnh trên và đưa ra kết luận tổng quan về cổ phiếu này. Phân tích chi tiết điểm mạnh, điểm yếu và rủi ro tiềm ẩn. Cuối cùng, đưa ra khuyến nghị đầu tư."""

        return prompt