/*
  # CompIntel Database Schema

  1. New Tables
    - `articles`
      - `id` (uuid, primary key) - Unique identifier for each article
      - `title` (text) - Article title
      - `source` (text) - Source of the article (e.g., "TechCrunch")
      - `posted_time` (text) - When the article was posted (e.g., "7h ago")
      - `impact_level` (text) - Strategic importance: "low", "medium", or "high"
      - `summary` (text) - Two-line summary of the article
      - `full_content` (text) - Full article content
      - `created_at` (timestamptz) - When the record was created

    - `keywords`
      - `id` (uuid, primary key) - Unique identifier for each keyword
      - `keyword` (text) - The keyword being tracked
      - `created_at` (timestamptz) - When the keyword was added

    - `todos`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `task` (text) - The task description
      - `completed` (boolean) - Whether the task is completed
      - `reminder_days` (integer, nullable) - Number of days for the deadline
      - `created_at` (timestamptz) - When the task was created

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a single-user dashboard)
    
  3. Notes
    - All tables use UUIDs for primary keys
    - Timestamps are automatically set on creation
    - RLS policies allow public access for this demo application
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL,
  posted_time text NOT NULL,
  impact_level text NOT NULL CHECK (impact_level IN ('low', 'medium', 'high')),
  summary text NOT NULL,
  full_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  completed boolean DEFAULT false,
  reminder_days integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single-user dashboard)
CREATE POLICY "Allow public read access to articles"
  ON articles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to articles"
  ON articles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to articles"
  ON articles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to articles"
  ON articles FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to keywords"
  ON keywords FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to keywords"
  ON keywords FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to keywords"
  ON keywords FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to todos"
  ON todos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to todos"
  ON todos FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to todos"
  ON todos FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to todos"
  ON todos FOR DELETE
  TO public
  USING (true);

-- Insert sample data
INSERT INTO articles (title, source, posted_time, impact_level, summary, full_content) VALUES
('OpenAI Launches New GPT-5 Model', 'TechCrunch', '2h ago', 'high', 'OpenAI has announced the release of GPT-5, featuring significant improvements in reasoning and multimodal capabilities.', 'OpenAI has announced the release of GPT-5, their most advanced language model to date. The new model features significant improvements in reasoning capabilities, better context understanding, and enhanced multimodal features. Early benchmarks show a 40% improvement in complex reasoning tasks compared to GPT-4. The model will be available to enterprise customers starting next month.'),
('Google Updates Search Algorithm', 'Search Engine Journal', '5h ago', 'medium', 'Google rolls out a new search algorithm update focusing on content quality and user experience signals.', 'Google has rolled out a major search algorithm update that prioritizes high-quality content and improved user experience signals. The update affects approximately 15% of search queries and places greater emphasis on E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness). Websites with thin content or poor user experience may see ranking drops.'),
('Microsoft Announces Azure AI Updates', 'Microsoft Blog', '1d ago', 'medium', 'Microsoft expands Azure AI services with new machine learning tools and enterprise features.', 'Microsoft has announced significant updates to its Azure AI platform, including new machine learning tools designed for enterprise customers. The updates include improved AutoML capabilities, enhanced model monitoring, and new pre-built AI models for common business scenarios. The company also announced partnerships with several Fortune 500 companies to deploy these solutions.'),
('Meta Releases Llama 4', 'VentureBeat', '3h ago', 'high', 'Meta unveils Llama 4, an open-source large language model competing with GPT-5.', 'Meta has released Llama 4, their latest open-source large language model. The model is available in multiple sizes and claims to match or exceed the performance of proprietary models like GPT-5 on several benchmarks. Meta is positioning this as a major step forward for open-source AI and has made the model available under a permissive license for both research and commercial use.'),
('Amazon Expands AWS AI Services', 'AWS News', '8h ago', 'low', 'Amazon Web Services introduces new AI tools for small and medium businesses.', 'Amazon Web Services has expanded its AI service offerings with new tools specifically designed for small and medium-sized businesses. The new services include simplified machine learning workflows, pre-trained models for common tasks, and cost-effective pricing tiers. AWS aims to make enterprise-grade AI more accessible to smaller organizations.');

INSERT INTO keywords (keyword) VALUES
('OpenAI'),
('Google AI'),
('Azure'),
('Machine Learning');

INSERT INTO todos (task, completed, reminder_days) VALUES
('Review OpenAI GPT-5 capabilities', false, 2),
('Analyze competitor pricing changes', false, 1),
('Update competitive analysis report', true, null),
('Schedule team meeting on AI trends', false, 5);