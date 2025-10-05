# track.py - Your Application's Core Engine (Now connected to Supabase)

import feedparser
import requests
import json
from datetime import datetime, timedelta, timezone
from newspaper import Article
from supabase import create_client, Client # <-- NEW IMPORT

# --- Supabase Connection ---
# IMPORTANT: Replace with your actual Supabase URL and Key from Step 1.3
# Keep these secret! Do not commit them to a public Git repository.
SUPABASE_URL = "https://hhqodaltrifnkkxcyoqo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocW9kYWx0cmlmbmtreGN5b3FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5NDkyNywiZXhwIjoyMDc1MTcwOTI3fQ.6dc3L-psxNbjUMtqlf3e5kXvi29jN4QGxhpub00OSe0"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Your company context for the AI ---
COMPANY_CONTEXT = "We are a startup building a new AI-powered developer journal called 'Dev Diary'."


def get_recent_articles(): # The 'urls' parameter is no longer needed
    """
    Fetches URLs from the Supabase 'keywords' table and then finds
    recent articles from those RSS feeds.
    """
    # --- NEW: Fetch URLs from Supabase ---
    print("--- Fetching target URLs from Supabase database ---")
    response = supabase.table('keywords').select('url').execute()
    
    if not response.data:
        print("No keywords found in the database.")
        return []
    
    # Extract the URLs from the Supabase response
    urls_to_check = [item['url'] for item in response.data]
    print(f"Found {len(urls_to_check)} URL(s) to check in the database.")

    # --- The rest of the function is the same, but uses the new list ---
    recent_articles = []
    time_threshold = datetime.now(timezone.utc) - timedelta(days=1)
    
    for url in urls_to_check:
        try:
            feed = feedparser.parse(url)
            if hasattr(feed.feed, 'title'):
                source_name = feed.feed.title
            else:
                source_name = "Unknown Source"
            for entry in feed.entries:
                published_time = datetime(*entry.published_parsed[:6]).replace(tzinfo=timezone.utc)
                if published_time > time_threshold:
                    article = {'title': entry.title, 'link': entry.link, 'source': source_name}
                    recent_articles.append(article)
        except Exception as e:
            print(f"Could not process feed {url}. Error: {e}")
    return recent_articles

def summarize_with_ollama(text_to_summarize, model="gemma:2b"):
    prompt = f"""
    You are a strategic analyst for a company with the following context: '{COMPANY_CONTEXT}'.
    Analyze the following article text and provide a response in JSON format.
    The JSON object must have two keys:
    1. "summary": A concise, two-sentence summary of the article.
    2. "impact": Your assessment of the impact this news has on our company, rated as "Low", "Medium", or "High".
    Do not include any conversational filler or introductory text. Output only the raw JSON object.
    Article text: "{text_to_summarize}"
    """
    try:
        url = "http://localhost:11434/api/generate"
        payload = { "model": model, "prompt": prompt, "stream": False, "format": "json" }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        response_json = json.loads(response.json().get('response', '{}'))
        return {'summary': response_json.get('summary', 'Could not generate summary.'), 'impact': response_json.get('impact', 'Low')}
    except Exception as e:
        print(f"Error during Ollama processing: {e}")
        return {'summary': 'Error in processing.', 'impact': 'Low'}

def process_article(article_data):
    try:
        article = Article(article_data['link'])
        article.download()
        article.parse()
        text_for_summary = article.text[:2500]
        analysis = summarize_with_ollama(text_for_summary)
        article_data['summary'] = analysis['summary']
        article_data['impact'] = analysis['impact']
        return article_data
    except Exception as e:
        print(f"--> Failed to process article: {article_data['link']}. Error: {e}")
        return None