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
def summarize_with_ollama(text_to_summarize, model="gemma:2b"):
    """Sends text to the local Ollama API for summarization."""
    print(f"Summarizing article...")
    try:
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": model,
            "prompt": f"Summarize the following article in two sentences, focusing on the key announcement or finding: {text_to_summarize}",
            "stream": False
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        summary = response.json().get('response', 'Could not generate a summary.')
        return summary.strip()
    except requests.exceptions.RequestException as e:
        return f"Error connecting to Ollama. Is the 'ollama serve' command running in another terminal?"

# NEW HELPER FUNCTION to process one article from start to finish
def process_article(article_data):
    """Downloads, parses, and summarizes a single article."""
    try:
        article = Article(article_data['link'])
        article.download()
        article.parse()
        
        # --- OPTIMIZATION ---
        # We only summarize the first 2500 characters (approx. 400 words)
        text_for_summary = article.text[:2500]
        summary = summarize_with_ollama(text_for_summary)
        
        # Add the summary to the original dictionary and return it
        article_data['summary'] = summary
        return article_data
    except Exception as e:
        # Return None if processing fails for any reason
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