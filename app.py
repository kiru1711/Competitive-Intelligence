# app.py - The Flask Web Server Definition
from track import supabase
from flask import Flask, jsonify, request
from flask_cors import CORS 
from concurrent.futures import ProcessPoolExecutor

# Import all necessary logic from your track.py module
from track import get_recent_articles, process_article, summarize_with_ollama

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
    new_articles = get_recent_articles()
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

# --- API FOR MANAGING KEYWORDS ---

# GET /api/keywords - Fetches all keywords
@app.route("/api/keywords", methods=['GET'])
def get_keywords():
    """Fetches the list of all tracked keywords from the database."""
    response = supabase.table('keywords').select('*').order('created_at', desc=True).execute()
    return jsonify(response.data)

# POST /api/keywords - Adds a new keyword
@app.route("/api/keywords", methods=['POST'])
def add_keyword():
    """Adds a new keyword URL to the database."""
    data = request.json
    new_url = data.get('url')

    if not new_url:
        return jsonify({"error": "URL is required"}), 400 # Bad request

    # Insert the new URL into the 'keywords' table
    response = supabase.table('keywords').insert({"url": new_url}).execute()
    
    # Supabase returns the inserted data in a list, we return the first item
    return jsonify(response.data[0]), 201 # 201 means "Created"

# DELETE /api/keywords/<id> - Deletes a keyword by its ID
@app.route("/api/keywords/<int:keyword_id>", methods=['DELETE'])
def delete_keyword(keyword_id):
    """Deletes a keyword from the database using its unique ID."""
    supabase.table('keywords').delete().eq('id', keyword_id).execute()
    return jsonify({"message": "Keyword deleted successfully"})


# --- API FOR MANAGING TASKS --- (FINAL CORRECTED VERSION)

# GET /api/tasks - Fetches all tasks
@app.route("/api/tasks", methods=['GET'])
def get_tasks():
    response = supabase.table('tasks').select('*').order('created_at', desc=True).execute()
    return jsonify(response.data)

# POST /api/tasks - Adds a new task
@app.route("/api/tasks", methods=['POST'])
def add_task():
    data = request.json
    task_text = data.get('task')
    if not task_text:
        return jsonify({"error": "Task text is required"}), 400
    
    # Corrected Logic: The .select() must be on a new line after .insert()
    response = supabase.table('tasks').insert({"task": task_text}).execute()
    
    # Now that the data is inserted, fetch the new record to get its ID
    new_task_data = supabase.table('tasks').select('*').eq('id', response.data[0]['id']).single().execute()
    return jsonify(new_task_data.data), 201

# PUT /api/tasks/<id> - Updates a task
@app.route("/api/tasks/<int:task_id>", methods=['PUT'])
def update_task(task_id):
    data = request.json
    updates = {}
    if 'is_completed' in data:
        updates['is_completed'] = data.get('is_completed')
    if 'reminder_days' in data:
        updates['reminder_days'] = data.get('reminder_days')
    
    # Corrected Logic: The .select() must be on a new line after .update()
    supabase.table('tasks').update(updates).eq('id', task_id).execute()
    updated_task_data = supabase.table('tasks').select('*').eq('id', task_id).single().execute()
    return jsonify(updated_task_data.data)

# DELETE /api/tasks/<id> - Deletes a task
@app.route("/api/tasks/<int:task_id>", methods=['DELETE'])
def delete_task(task_id):
    supabase.table('tasks').delete().eq('id', task_id).execute()
    return jsonify({"message": "Task deleted successfully"})


if __name__ == "__main__":
    # RUN THIS AFTER SAVING THE FILE
    app.run(debug=True, port=5000)