# app.py - Your First Web Server

from flask import Flask, jsonify
import feedparser
import requests
from datetime import datetime, timedelta, timezone
from newspaper import Article
from concurrent.futures import ProcessPoolExecutor

# --- Step 1: Create the Flask App ---
app = Flask(__name__)

# --- Step 2: Copy All Your Helper Functions ---

TARGET_URLS = [
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://www.wired.com/feed/category/business/latest/rss",
    "https://news.ycombinator.com/rss",
    "https://a16z.com/feed/",
]

def get_recent_articles(urls):
    recent_articles = []
    time_threshold = datetime.now(timezone.utc) - timedelta(days=1)
    for url in urls:
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
    try:
        url = "http://localhost:11434/api/generate"
        payload = { "model": model, "prompt": f"You are a senior tech analyst. Summarize this article in a single, clean paragraph of no more than two sentences, focusing on the most critical information. Do not use conversational filler. Article: {text_to_summarize}", "stream": False }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        summary = response.json().get('response', 'Could not generate a summary.')
        return summary.strip()
    except requests.exceptions.RequestException as e:
        return f"Error connecting to Ollama: {e}"

def process_article(article_data):
    try:
        article = Article(article_data['link'])
        article.download()
        article.parse()
        text_for_summary = article.text[:2500]
        summary = summarize_with_ollama(text_for_summary)
        article_data['summary'] = summary
        return article_data
    except Exception as e:
        print(f"--> Failed to process article: {article_data['link']}. Error: {e}")
        return None

# --- Step 3: Create Your API Endpoint ---

@app.route("/api/digest")
def get_digest():
    """This function will run when someone visits the /api/digest URL."""
    print("Request received for digest...")
    
    # Run the logic from your script
    new_articles = get_recent_articles(TARGET_URLS)
    
    if not new_articles:
        return jsonify({"message": "No new articles found.", "articles": []})

    # For speed, let's just process the first 5 articles for this API
    articles_to_process = new_articles[:5]
    
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_article, articles_to_process))
    
    # Filter out any failed articles
    successful_results = [res for res in results if res is not None]
    
    print("Request complete. Sending data.")
    return jsonify(successful_results)

# This part is needed to make the script runnable with `python app.py`
if __name__ == "__main__":
    app.run(debug=True)