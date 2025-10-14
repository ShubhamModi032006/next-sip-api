import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv # Import the dotenv library

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv() # This will load the .env file from the current directory

# ==================== CONFIGURATION ====================
API_BASE_URL = "https://api.mfapi.in/mf"

# --- Stability Settings ---
CONCURRENCY_LIMIT = 10
RETRY_COUNT = 4
RETRY_DELAY_SECONDS = 3

# --- Filtering & Output ---
DAYS_THRESHOLD = 14
OUTPUT_FILENAME = "active_funds_backup.json"

# --- MONGODB SETTINGS ---
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "test"
COLLECTION_NAME = "py_active_fund"
# =======================================================


def parse_ddmmyyyy(date_str: str) -> Optional[datetime]:
    """Parses a DD-MM-YYYY date string into a datetime object."""
    try:
        return datetime.strptime(date_str, "%d-%m-%Y")
    except (ValueError, TypeError):
        return None


async def fetch_fund_details(
    session: aiohttp.ClientSession,
    fund: Dict[str, Any],
    semaphore: asyncio.Semaphore
) -> Optional[Dict[str, Any]]:
    """Fetches details for a single fund with robust retries and error logging."""
    scheme_code = fund.get("schemeCode")
    if not scheme_code:
        return None

    url = f"{API_BASE_URL}/{scheme_code}"

    async with semaphore:
        await asyncio.sleep(0.05)

        for attempt in range(RETRY_COUNT):
            try:
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        nav_data = data.get("data")
                        
                        if not nav_data or not isinstance(nav_data, list) or not nav_data:
                            return None

                        latest_nav = nav_data[0]
                        nav_date = parse_ddmmyyyy(latest_nav.get("date"))
                        
                        if not nav_date:
                            return None

                        if nav_date >= datetime.now() - timedelta(days=DAYS_THRESHOLD):
                            return {
                                "code": scheme_code,
                                "name": data.get("meta", {}).get("scheme_name", "N/A"),
                                "nav": latest_nav.get("nav"),
                                "date": latest_nav.get("date"),
                                "last_updated_on": datetime.utcnow()
                            }
                        return None
                    
                    else:
                        print(f"\n⚠ Status {response.status} for fund {scheme_code} (Attempt {attempt+1}/{RETRY_COUNT})")

            except Exception as e:
                error_message = str(e).split('[Errno')[0].strip()
                print(f"\n⚠ Error fetching fund {scheme_code} (Attempt {attempt+1}/{RETRY_COUNT}): {error_message}")
            
            if attempt < RETRY_COUNT - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS * (attempt + 1))

    print(f"\n❌ Error fetching fund {scheme_code}: Failed permanently after {RETRY_COUNT} retries.")
    return None


async def main():
    """Main function to run the entire filtering and database update process."""
    print("🚀 Starting the mutual fund updater...")
    
    if not MONGO_URI:
        print("❌ CRITICAL ERROR: MONGO_URI not found. Please create a .env file and set it.")
        return

    async with aiohttp.ClientSession() as session:
        print("📡 Fetching the master list of all funds...")
        try:
            async with session.get(API_BASE_URL) as response:
                response.raise_for_status()
                all_funds = await response.json()
        except Exception as e:
            print(f"❌ Critical Error: Could not fetch master fund list. {e}")
            return
            
    total_funds = len(all_funds)
    print(f"✅ Found {total_funds} total funds to check.")

    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    progress_counter = 0
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_fund_details(session, fund, semaphore) for fund in all_funds]
        
        active_funds = []
        for task in asyncio.as_completed(tasks):
            result = await task
            progress_counter += 1
            if result:
                active_funds.append(result)
            
            print(f"⚙️  Processing: {progress_counter}/{total_funds} funds | Found: {len(active_funds)} active", end='\r')

    # --- FINAL COUNTS ---
    active_count = len(active_funds)
    inactive_count = total_funds - active_count
    
    print("\n\n✅ Processing complete.")
    print("="*30)
    print(f"📊 FINAL RESULTS:")
    print(f"    - ✅ Active Funds:    {active_count}")
    print(f"    - ❌ Inactive/Failed: {inactive_count}")
    print("="*30)

    # --- SAVE TO MONGODB ---
    if active_funds:
        client = None
        try:
            print(f"\n💾 Connecting to MongoDB...")
            client = AsyncIOMotorClient(MONGO_URI)
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]

            print(f"🗑️  Deleting all old documents from '{COLLECTION_NAME}'...")
            delete_result = await collection.delete_many({})
            print(f"   -> {delete_result.deleted_count} documents deleted.")

            print(f"✍️  Inserting {active_count} new active funds into MongoDB...")
            await collection.insert_many(active_funds)
            print(f"   -> Successfully inserted documents.")
            
            print("\n🎉 MongoDB update complete.")

        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: Could not update MongoDB. Error: {e}")
        finally:
            if client:
                client.close()
                print("🔒 MongoDB connection closed.")
    else:
        print("\n⚠️ No active funds found to insert into the database.")

    # --- SAVE LOCAL BACKUP ---
    print(f"\n💾 Saving local backup to '{OUTPUT_FILENAME}'...")
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        def default(o):
            if isinstance(o, datetime):
                return o.isoformat()
        json.dump(active_funds, f, indent=2, ensure_ascii=False, default=default)
        
    print("🎉 All done!")


if __name__ == "__main__":
    asyncio.run(main())
