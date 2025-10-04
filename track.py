COMPANY_CONTEXT = "We are a startup building a new AI-powered developer journal called 'Dev Diary'."

import feedparser
import requests
from datetime import datetime, timedelta
from newspaper import Article
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timedelta, timezone

# Part 1: Your list of target URLs
TARGET_URLS = [
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://www.wired.com/feed/category/business/latest/rss",
    "https://news.ycombinator.com/rss",
    "https://a16z.com/feed/",
]

# Part 2: The function to fetch recent articles
def get_recent_articles(urls):
    recent_articles = []
    time_threshold = datetime.now(timezone.utc) - timedelta(days=2)
    print("--- Starting to fetch articles ---")
    for url in urls:
        try:
            feed = feedparser.parse(url)
# Safely get the source name, with a fallback
            if hasattr(feed.feed, 'title'):
                source_name = feed.feed.title
            else:
                source_name = "Unknown Source" # Fallback if no title is found
            print(f"Checking: {source_name}...")
            for entry in feed.entries:
                published_time = datetime(*entry.published_parsed[:6]).replace(tzinfo=timezone.utc)
                if published_time > time_threshold:
                    article = {'title': entry.title, 'link': entry.link, 'source': source_name}
                    recent_articles.append(article)
        except Exception as e:
            print(f"Could not process feed {url}. Error: {e}")
    return recent_articles

# Part 3: The function to summarize text with your local Ollama model
import json # Make sure to add this import at the top of your file

def summarize_with_ollama(text_to_summarize, model="gemma:2b"):
    """Sends text to Ollama to get a summary AND an impact analysis."""
    print("Analyzing for summary and impact...")
    
    # This new, more advanced prompt asks for a JSON output
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
        
        # Parse the JSON response string from Ollama into a Python dictionary
        response_json = json.loads(response.json().get('response', '{}'))
        
        return {
            'summary': response_json.get('summary', 'Could not generate summary.'),
            'impact': response_json.get('impact', 'Low')
        }

    except Exception as e:
        print(f"Error during Ollama processing: {e}")
        return {'summary': 'Error in processing.', 'impact': 'Low'}

# NEW HELPER FUNCTION to process one article from start to finish
def process_article(article_data):
    """Downloads, parses, and gets analysis for a single article."""
    try:
        article = Article(article_data['link'])
        article.download()
        article.parse()
        
        text_for_summary = article.text[:2500]
        analysis = summarize_with_ollama(text_for_summary)
        
        # Add both the summary and the new impact level to the data
        article_data['summary'] = analysis['summary']
        article_data['impact'] = analysis['impact']
        return article_data
    except Exception as e:
        print(f"--> Failed to process article: {article_data['link']}. Error: {e}")
        return None

if __name__ == "__main__":
    new_articles = get_recent_articles(TARGET_URLS)
    print("\n--- Scan Complete ---")

    num_found = len(new_articles)

    if num_found == 0:
        print("No new articles found in the last 24 hours.")
    else:
        print(f"\n✅ Found {num_found} new articles!")
        
        # --- NEW CODE: Ask the user for input ---
        num_to_summarize = 0
        while True:
            try:
                # Prompt the user for a number
                user_input = input(f"How many articles would you like to summarize? (Enter a number between 0 and {num_found}): ")
                num_to_summarize = int(user_input)

                # Check if the number is in the valid range
                if 0 <= num_to_summarize <= num_found:
                    break  # Exit the loop if the input is valid
                else:
                    print(f"Invalid number. Please enter a number between 0 and {num_found}.")
            except ValueError:
                # This catches cases where the user types text instead of a number
                print("That's not a valid number. Please try again.")
        
        # --- MODIFIED CODE: Only process if the user wants to ---
        if num_to_summarize > 0:
            # Take only the number of articles the user requested from the top of the list
            articles_to_process = new_articles[:num_to_summarize]
            
            print(f"\nProcessing the first {len(articles_to_process)} articles in parallel...\n")
            
            with ProcessPoolExecutor(max_workers=4) as executor:
                results = list(executor.map(process_article, articles_to_process))

            for article in results:
                if article and article.get('summary'):
                    print(f"Source: {article['source']}")
                    print(f"Title:  {article['title']}")
                    print(f"Summary: {article['summary']}")
                    print(f"Link:   {article['link']}\n")
        else:
            print("Skipping summarization.")