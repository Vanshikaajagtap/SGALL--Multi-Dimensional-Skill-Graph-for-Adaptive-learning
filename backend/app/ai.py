import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def generate_remediation_plan(concept_name: str, difficulty: str, severity: str) -> str:
    """Generates a 3-sentence actionable remediation plan for a knowledge gap using LangChain."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or api_key == "your_gemini_api_key_here":
        return f"AI Guide: Review the foundational principles of {concept_name}. (Set a valid GEMINI_API_KEY in backend/.env to activate AI.)"
    
    # Initialize the LLM (Gemini 1.5 Flash is incredibly fast and cheap, perfect for this)
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
    
    prompt = PromptTemplate.from_template(
        "You are an expert AI tutor in a university computer science program. "
        "The student has a {severity} knowledge gap in the {difficulty} concept '{concept_name}'. "
        "Provide a strict, targeted, highly actionable 3-sentence study plan to remediate this specific gap. "
        "Do not use generic advice. Speak directly to the student."
    )
    
    try:
        response = llm.invoke(prompt.format(severity=severity, difficulty=difficulty, concept_name=concept_name))
        return response.content.strip()
    except Exception as e:
        return f"AI Guide is currently offline. Focus your review on {concept_name} lecture materials."
