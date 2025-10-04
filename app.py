# app.py - The Flask Web Server Definition

from flask import Flask, jsonify, request
from flask_cors import CORS 
from concurrent.futures import ProcessPoolExecutor

# Import all necessary logic from your track.py module
from track import get_recent_articles, process_article, summarize_with_ollama, TARGET_URLS 

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Helper to run the Ollama summary logic directly (for debugging/future use) ---
def run_ollama_query(user_prompt):
    """Runs a direct query to Ollama for a real-time user prompt."""
    llm_prompt = f"Answer this competitive intelligence question clearly and concisely: {user_prompt}"
    response = summarize_with_ollama(llm_prompt, model="gemma:2b")
    if "Error connecting to Ollama" in response:
        raise ConnectionError(response)
    return response


# ----------------------------------------------------------------------
# ENDPOINT: /api/digest/<num> (The dynamic endpoint for your Bolt Frontend)
# ----------------------------------------------------------------------

@app.route("/api/digest", methods=['GET'])
@app.route("/api/digest/<int:num_to_process>", methods=['GET']) 
def get_digest(num_to_process=5): # Default to 5
    """
    Fetches new articles, processes up to 'num_to_process' articles, 
    and returns the structured data to the frontend.
    """
    print(f"Request received for digest (Processing {num_to_process} articles)...")
    
    # 1. Fetch ALL recent articles
    new_articles = get_recent_articles(TARGET_URLS)
    total_found = len(new_articles)
    
    if total_found == 0:
        return jsonify({"total_found": 0, "summarized": []})

    # 2. Select articles to process (based on user input or default)
    articles_to_process = new_articles[:num_to_process]
    
    # 3. Process articles in parallel
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_article, articles_to_process))
    
    successful_results = [res for res in results if res is not None]
    
    print("Digest request complete. Sending data.")
    
    # 4. Return structured JSON data
    return jsonify({
        "total_found": total_found,
        "summarized_count": len(successful_results),
        "summarized_articles": successful_results,
        # The full article list is useful for the frontend to show the max number
        "full_article_list": new_articles 
    })


# ----------------------------------------------------------------------
# ENDPOINT: /api/query (For future direct LLM Q&A, not used for the digest feature)
# ----------------------------------------------------------------------

@app.route("/api/query", methods=['POST'])
def handle_user_query():
    # ... (Keep the /api/query logic from the previous step here if you want it)
    pass


# ----------------------------------------------------------------------

if __name__ == "__main__":
    # RUN THIS AFTER SAVING THE FILE
    app.run(debug=True, port=5000)