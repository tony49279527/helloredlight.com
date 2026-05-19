#!/usr/bin/env python3
"""
PageSpeed Insights batch check script for helloredlight.com
Usage: python scripts/psi-check.py [output_dir]
Records historical scores and flags regressions.
"""
import sys, json, os, urllib.request, ssl, time
from datetime import datetime

# Load API key from project config, NEVER hardcode
def load_psi_key():
    config_paths = [
        ".hermes/config.json",
        "config.json",
        "scripts/config.json",
    ]
    for p in config_paths:
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    cfg = json.load(f)
                    key = cfg.get("google_psi_key")
                    if key:
                        return key
            except Exception:
                continue
    # Fallback: environment variable
    env_key = os.environ.get("GOOGLE_PSI_KEY")
    if env_key:
        return env_key
    raise RuntimeError(
        "No Google PSI API key found. "
        "Place it in .hermes/config.json as {'google_psi_key': '...'} "
        "or set GOOGLE_PSI_KEY environment variable."
    )

API_KEY = load_psi_key()
BASE_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
STRATEGIES = ["mobile", "desktop"]
SCORE_THRESHOLD = 60  # Red alert below this
WARNING_THRESHOLD = 80  # Yellow warning

URLS = [
    "https://helloredlight.com/",
    "https://helloredlight.com/products",
    "https://helloredlight.com/product-detail",
    "https://helloredlight.com/contact",
    "https://helloredlight.com/zh/",
    "https://helloredlight.com/zh/products",
    "https://helloredlight.com/blog/red-light-therapy-benefits",
]

def check_psi(url, strategy):
    """Single PSI call. Retries on failure."""
    params = f"url={urllib.parse.quote(url)}&strategy={strategy}&key={API_KEY}"
    full_url = f"{BASE_URL}?{params}"
    ctx = ssl.create_default_context()
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(full_url, method="GET")
            req.add_header("User-Agent", "Mozilla/5.0 (compatible; PSI-Bot/1.0)")
            res = urllib.request.urlopen(req, timeout=60, context=ctx)
            data = json.loads(res.read())
            return parse_result(data, url, strategy)
        except Exception as e:
            if attempt < 2:
                time.sleep(5)
                continue
            return {"error": str(e), "url": url, "strategy": strategy}

def parse_result(data, url, strategy):
    lh = data.get("lighthouseResult", {})
    cats = lh.get("categories", {})
    perf = cats.get("performance", {})
    score = round(perf.get("score", 0) * 100)
    
    audits = lh.get("audits", {})
    cwv = {}
    for key in ["largest-contentful-paint", "cumulative-layout-shift", "first-contentful-paint", "total-blocking-time"]:
        a = audits.get(key, {})
        cwv[key.replace("-", "_")] = {
            "display": a.get("displayValue", "N/A"),
            "numeric": a.get("numericValue")
        }
    
    return {
        "url": url,
        "strategy": strategy,
        "score": score,
        "cwv": cwv,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "error": None
    }

def load_history(path):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}

def save_history(path, history):
    with open(path, "w") as f:
        json.dump(history, f, indent=2)

def run_all(output_dir="/tmp/psi-reports"):
    os.makedirs(output_dir, exist_ok=True)
    history_path = os.path.join(output_dir, "history.json")
    history = load_history(history_path)
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    results = []
    alerts = []
    warnings = []
    improvements = []
    
    for url in URLS:
        for strat in STRATEGIES:
            key = f"{url}__{strat}"
            prev = history.get(key, {})
            
            r = check_psi(url, strat)
            results.append(r)
            
            if r.get("error"):
                print(f"  ERROR: {url} ({strat}) - {r['error']}")
                continue
            
            score = r["score"]
            prev_score = prev.get("score")
            
            # Alerts
            if score < SCORE_THRESHOLD:
                alerts.append(f"🔴 {url} ({strat}): {score} (threshold: {SCORE_THRESHOLD})")
            elif score < WARNING_THRESHOLD:
                warnings.append(f"⚠️ {url} ({strat}): {score}")
            
            # Regression / improvement
            if prev_score is not None:
                delta = score - prev_score
                if delta <= -5:
                    alerts.append(f"📉 REGRESSION: {url} ({strat}) {prev_score} → {score} ({delta:+d})")
                elif delta >= 5:
                    improvements.append(f"📈 IMPROVED: {url} ({strat}) {prev_score} → {score} (+{delta})")
            
            history[key] = r
            print(f"  ✅ {url} ({strat}): {score}")
    
    save_history(history_path, history)
    
    # Generate markdown report
    report_path = os.path.join(output_dir, f"psi-report-{today}.md")
    with open(report_path, "w") as f:
        f.write(f"# PSI Report ({today})\n\n")
        f.write(f"**Pages checked:** {len(URLS)} × 2 strategies = {len(results)} scans\n\n")
        
        if alerts:
            f.write("## 🔴 Alerts\n\n")
            for a in alerts:
                f.write(f"- {a}\n")
            f.write("\n")
        if warnings:
            f.write("## ⚠️ Warnings\n\n")
            for w in warnings:
                f.write(f"- {w}\n")
            f.write("\n")
        if improvements:
            f.write("## 📈 Improvements\n\n")
            for i in improvements:
                f.write(f"- {i}\n")
            f.write("\n")
        
        f.write("## Results\n\n")
        f.write("| URL | Strategy | Score | LCP | CLS | FCP | TBT |\n")
        f.write("|-----|----------|-------|-----|-----|-----|-----|\n")
        for r in results:
            if r.get("error"):
                f.write(f"| {r['url'][:40]} | {r['strategy']} | ERROR | - | - | - | - |\n")
                continue
            c = r["cwv"]
            f.write(f"| {r['url'][:40]} | {r['strategy']} | **{r['score']}** | {c['largest_contentful_paint']['display']} | {c['cumulative_layout_shift']['display']} | {c['first_contentful_paint']['display']} | {c['total_blocking_time']['display']} |\n")
    
    print(f"\n📄 Report saved: {report_path}")
    
    # Summary
    summary = {
        "date": today,
        "pages": len(URLS),
        "alerts": len(alerts),
        "warnings": len(warnings),
        "improvements": len(improvements),
        "report_path": report_path,
        "history_path": history_path
    }
    print(json.dumps(summary, indent=2))
    return summary

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/psi-reports"
    run_all(out)
