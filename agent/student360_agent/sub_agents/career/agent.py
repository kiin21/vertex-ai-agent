# -------- Simplified Multi-Agent Job Search System --------
from google.adk.agents import LlmAgent
from student360_agent.tools.scraper import analyze_and_score_jobs, extract_user_requirements, format_job_results, google_search_jobs, merge_and_deduplicate_jobs, optimize_search_query, web_scrape_jobs

# -------- Agent Definitions --------


# Agent 1: Query Processing Agent
query_agent = LlmAgent(
    name="query_processor",
    model="gemini-2.5-flash",
    description="Processes user input and generates optimal search queries",
    instruction=(
        "You process job search requests and generate optimized queries:"
        "\n1. Parse user input to extract: skills, experience level, location, job type"
        "\n2. Generate 3-5 search query variations using both English and Vietnamese terms"
        "\n3. Consider Vietnamese job market terminology"
        "\n4. Return structured query information"
        "\nExample: 'backend java 1 năm kinh nghiệm' → ['java backend', 'java developer junior', 'lập trình viên java']"
    ),
    tools=[extract_user_requirements, optimize_search_query]
)

# Agent 2: Job Analysis Agent
analysis_agent = LlmAgent(
    name="job_analyzer",
    model="gemini-2.5-flash",
    description="Analyzes and scores job matches against user profile",
    instruction=(
        "You analyze job-user compatibility:"
        "\n1. Score each job based on: skill match, experience fit, location, salary, company type"
        "\n2. Provide detailed reasoning for each score"
        "\n3. Consider Vietnamese job market context (salary ranges, company types)"
        "\n4. Account for career growth potential"
        "\n5. Return ranked results with explanations"
    ),
    tools=[analyze_and_score_jobs, merge_and_deduplicate_jobs]
)

# Agent 3: Response Formatter Agent
formatter_agent = LlmAgent(
    name="response_formatter",
    model="gemini-2.5-flash",
    description="Formats final job recommendations in user-friendly Vietnamese format",
    instruction=(
        "You create polished job recommendation reports:"
        "\n1. Format top 5-7 jobs in clean, scannable markdown"
        "\n2. Use Vietnamese headers and friendly language"
        "\n3. Include match percentages, key reasons, and direct apply links"
        "\n4. Add contextual application tips"
        "\n5. Suggest search improvements if results are weak"
        "\nStyle: Professional but friendly, actionable, encouraging"
    ),
    tools=[format_job_results]
)

# -------- LLM Agent Orchestrator --------

career_agent = LlmAgent(
    name="job_search_coordinator",
    model="gemini-2.5-flash",
    description="Coordinates entire job search workflow",
    instruction=(
        "You are the main coordinator for job search:"
        "\n1. Take user job request and profile"
        "\n2. Generate optimized search queries"
        "\n3. Execute both Google search and web scraping in parallel"
        "\n4. Merge, deduplicate, and analyze results"
        "\n5. Score jobs against user profile"
        "\n6. Format final recommendations"
        "\nExecute all steps systematically. Provide progress updates. Handle errors gracefully."
    ),
    tools=[
        # Query tools
        extract_user_requirements,
        optimize_search_query,
        # Search tools
        google_search_jobs,
        web_scrape_jobs,
        # Analysis tools
        merge_and_deduplicate_jobs,
        analyze_and_score_jobs,
        # Formatting tools
        format_job_results
    ]
)
