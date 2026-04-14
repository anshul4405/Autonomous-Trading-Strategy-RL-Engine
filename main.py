import time
import schedule
from scanner import scan_stock
from notifier import send_telegram
from config import TRACK_SECTORS

def run_scanner():
    for stock in TRACK_SECTORS:
        try:
            results = scan_stock(stock)

            for r in results:
                msg = (
                    f"🚨 *Bullish Marubozu Detected*\n\n"
                    f"Stock: {r['stock']}\n"
                    f"Close: {round(r['close'], 2)}\n"
                    f"Volume: {round(r['volume_ratio'], 7)}\n"
                    f"Time: {r['time']}"
                )
                print(msg)
                send_telegram(msg)

        except Exception as e:
            # ❌ Never stop scanner
            print(f"Error in {stock}: {e}")

print("🟢 LIVE Scanner started. Waiting for signals...")

schedule.every(10).minutes.do(run_scanner)

# optional: first run immediately
run_scanner()

while True:
    try:
        schedule.run_pending()
        time.sleep(1)
    except:
        time.sleep(10)
send_telegram("✅ Test message: Telegram notifier working")
