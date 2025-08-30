"""Student360 Multi-Agent System with proper agent orchestration."""

from google.adk.tools import agent_tool
from google.adk.agents import LlmAgent
from student360_agent.sub_agents.career.agent import career_agent, query_agent, analysis_agent, formatter_agent
from student360_agent.sub_agents.helper.agent import google_search_agent

# Create career agent with the tool
orchestrator = LlmAgent(
    name='orchestrator_agent',
    model='gemini-2.5-flash',
    description='Orchestrator agent that manages the workflow between sub-agents.',
    instruction="""
    You are the Student360 orchestrator agent that manages various specialized sub-agents.
    
    When users ask career-related questions (job search, career advice, job recommendations, internship opportunities):
    - Route to the career_agent which can search for jobs and provide personalized recommendations
    - Examples: "find me a job", "backend developer java", "tìm việc làm", "cơ hội thực tập"
    
    For other questions (general knowledge, academic topics, technology explanations, programming concepts, etc.):
    - Use google_search_agent to provide helpful and accurate answers
    - Explain concepts clearly and provide practical examples when appropriate
    - Examples: "What is machine learning?", "How does React work?", "Explain database concepts"
    
    Always be helpful and provide accurate information based on your training knowledge. 
    Support both English and Vietnamese languages as appropriate for the user's query.
    """,
    tools=[agent_tool.AgentTool(agent=google_search_agent),],
    sub_agents=[query_agent, career_agent, analysis_agent, formatter_agent],
)


# Main orchestrator (simplified to just the career agent for now)
root_agent = orchestrator
