## 🛠️ Installation

### 1. Python Environment Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
cp .env.example .env
```

### 2. Google Custom Search Engine Configuration

1. Visit [Google Custom Search Engine](https://cse.google.com/cse/)
2. Create a new search engine
3. Add sites to search:
   - `topcv.vn/*`
   - `vietnamworks.com/*`
   - `topdev.vn/*`
   - `itviec.com/*`
4. Get the Search Engine ID

### 3. Google Cloud Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services
2. Enable "Custom Search API"
3. Create credentials (API Key)
4. Set up your Google Cloud project and get the required information
5. Create environment configuration file:

```bash
# Create .env file with all required variables
echo "GOOGLE_API_KEY=your_api_key_here" >> .env
echo "GOOGLE_CSE_ID=your_search_engine_id_here" >> .env
echo "GOOGLE_CLOUD_PROJECT=your_project_id" >> .env
echo "GOOGLE_CLOUD_LOCATION=your_preferred_location" >> .env
echo "GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name" >> .env
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Run agent locally
adk web
```

### Deployment

```bash
# Deploy to Google Vertex AI
python deployment/deploy.py --create
```

## 🤖 Multi-Agent Architecture

### Orchestrator Agent

- **Function**: Coordinates between sub-agents
- **Model**: Gemini 2.5 Flash
- **Tasks**: Analyzes queries and routes to appropriate agents

### Career Agent

Includes 3 specialized sub-agents:

1. **Query Processor Agent**

   - Processes and optimizes search queries
   - Extracts requirements from user input

2. **Job Analysis Agent**

   - Analyzes and scores job-candidate compatibility
   - Merges and deduplicates jobs

3. **Response Formatter Agent**
   - Formats final results
   - Creates user-friendly recommendation reports

## 🔧 Usage

### Supported query examples:

**Job Search:**

- "Find backend Java jobs"
- "Software engineer junior positions"
- "Internship opportunities"
- "Remote developer jobs"

**Career Guidance:**

- "Career advice for CS students"
- "Backend developer career path"
- "Skills needed for data science"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0. See the [`LICENSE`](LICENSE) file for details.
